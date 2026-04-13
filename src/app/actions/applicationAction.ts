'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationStatus,
} from '@/src/types/applications';

// Server Action의 공통 응답 타입
// 디스크리미네이티드 유니온으로 success 플래그에 따라 타입이 좁혀짐
// 호출부에서 if (result.success)면 data 접근, else면 error 접근이 타입 안전
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 지원서 생성 (임시저장 포함)
 * - is_complete=false면 임시저장, true면 즉시 제출
 * - user_id는 반드시 서버에서 auth로 주입 (클라이언트 값 신뢰 X)
 * - 같은 프로그램에 중복 지원 방지
 */
export async function createApplication(
  input: CreateApplicationInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  // 1. 인증 확인 - 로그인하지 않은 사용자는 생성 불가
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 2. 중복 지원 방지 - 같은 프로그램에 이미 지원서가 있으면 차단
  // (임시저장 중인 것도 포함. 기존 것을 수정해야 함)
  // 주의: 앱 레벨 체크라 동시 요청 race condition 가능 -
  // 나중에 DB에 UNIQUE(program_id, user_id) 제약 추가 권장
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('program_id', input.program_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: '이미 해당 공고에 작성 중인 지원서가 있습니다.',
    };
  }

  // 3. 실제 insert
  // is_complete=true면 submitted_at과 status를 원자적으로 함께 세팅
  // 임시저장이면 status=draft, submitted_at=null 유지
  const isSubmitting = input.is_complete === true;
  const { data, error } = await supabase
    .from('applications')
    .insert({
      program_id: input.program_id,
      user_id: user.id,
      form_data: input.form_data,
      is_complete: isSubmitting,
      status: isSubmitting ? 'submitted' : 'draft',
      submitted_at: isSubmitting ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) {
    // DB 에러는 사용자에게 그대로 노출하지 않고 일반 메시지로 변환
    // 실제 에러는 서버 로그에만 남김 (디버깅용)
    console.error('[createApplication]', error);
    return { success: false, error: '지원서 생성에 실패했습니다.' };
  }

  // 4. 캐시 무효화 - 목록 페이지와 프로그램 상세 페이지 모두 갱신 필요
  revalidatePath('/applications');
  revalidatePath(`/programs/${input.program_id}`);

  return { success: true, data: { id: data.id } };
}

/**
 * 지원서 수정 (임시저장/최종 제출 모두 처리)
 * - 본인 지원서만 수정 가능 (RLS + 앱 레벨 이중 체크)
 * - 이미 제출된(is_complete=true) 지원서는 수정 불가
 */
export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 기존 지원서 조회 - 소유권/상태 확인용
  // program_id는 revalidatePath에서 필요해서 함께 가져옴
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('id, user_id, is_complete, program_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: '지원서를 찾을 수 없습니다.' };
  }

  // 소유권 검증 - 다른 사용자의 지원서 수정 차단
  // RLS가 이미 막지만, 앱 레벨에서도 체크해서 친절한 에러 메시지 제공
  if (existing.user_id !== user.id) {
    return { success: false, error: '수정 권한이 없습니다.' };
  }

  // 제출 완료된 지원서는 수정 금지
  // (비즈니스 요구사항에 따라 변경 가능 - 현재는 엄격하게 차단)
  if (existing.is_complete) {
    return { success: false, error: '제출된 지원서는 수정할 수 없습니다.' };
  }

  // 업데이트 페이로드 구성
  // 전달된 필드만 반영하는 partial update 패턴
  const updatePayload: {
    form_data?: UpdateApplicationInput['form_data'];
    is_complete?: boolean;
    status?: ApplicationStatus;
    submitted_at?: string;
  } = {};

  if (input.form_data !== undefined) {
    updatePayload.form_data = input.form_data;
  }

  if (input.is_complete === true) {
    // 제출 처리 - 상태 전환과 제출 시각 기록을 원자적으로 묶음
    updatePayload.is_complete = true;
    updatePayload.status = 'submitted';
    updatePayload.submitted_at = new Date().toISOString();
  } else if (input.is_complete === false) {
    updatePayload.is_complete = false;
  }

  // status만 별도로 넘어온 경우 (예: 관리자 검토 상태 변경)
  // is_complete 처리 뒤에 와야 위의 status 세팅을 덮어쓸 수 있음
  if (input.status !== undefined && input.is_complete === undefined) {
    updatePayload.status = input.status;
  }

  const { error } = await supabase
    .from('applications')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('[updateApplication]', error);
    return { success: false, error: '지원서 수정에 실패했습니다.' };
  }

  revalidatePath('/applications');
  revalidatePath(`/applications/${id}`);
  revalidatePath(`/programs/${existing.program_id}`);

  return { success: true, data: null };
}

/**
 * 지원서 삭제
 * - 본인 지원서만 삭제 가능
 * - 제출된 지원서는 삭제 불가 (감사 추적 목적)
 * - 필요시 soft delete(cancelled 상태)로 전환 고려
 */
export async function deleteApplication(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 삭제 전 소유권/상태 확인
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('id, user_id, is_complete, program_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: '지원서를 찾을 수 없습니다.' };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: '삭제 권한이 없습니다.' };
  }

  // 제출 완료된 지원서는 물리 삭제 금지
  // 감사 추적을 위해 제출 이력은 보존해야 함
  if (existing.is_complete) {
    return {
      success: false,
      error: '제출된 지원서는 삭제할 수 없습니다.',
    };
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteApplication]', error);
    return { success: false, error: '지원서 삭제에 실패했습니다.' };
  }

  revalidatePath('/applications');
  revalidatePath(`/programs/${existing.program_id}`);

  return { success: true, data: null };
}