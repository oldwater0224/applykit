'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import type {
  Program,
  CreateProgramData,
  UpdateProgramData,
} from '@/src/types/program';

// applicationAction.ts와 동일한 응답 패턴
// 디스크리미네이티드 유니온으로 호출부에서 타입 좁히기 가능
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 특정 조직의 프로그램 목록 조회
 * - 운영기관 대시보드에서 "내 프로그램 목록" 용도
 */
export async function getPrograms(
  orgId: string
): Promise<ActionResult<Program[]>> {
  const supabase = await createClient();

  // 로그인 확인 - Server Action은 RLS가 막지만 명시적 체크로 에러 메시지 개선
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPrograms]', error);
    return { success: false, error: '프로그램 목록 조회에 실패했습니다.' };
  }

  return { success: true, data: data || [] };
}

/**
 * 특정 프로그램 단건 조회
 * - 프로그램 상세, 폼 빌더, 지원서 작성 페이지 공통 사용
 */
export async function getProgram(
  id: string
): Promise<ActionResult<Program>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getProgram]', error);
    return { success: false, error: '프로그램을 찾을 수 없습니다.' };
  }

  return { success: true, data };
}

/**
 * 프로그램 생성
 * - form_schema는 선택적. 보통 생성 직후엔 비어있고
 *   이후 폼 빌더에서 별도 저장하는 흐름
 */
export async function createProgram(
  orgId: string,
  programData: CreateProgramData
): Promise<ActionResult<Program>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // jsonb 컬럼은 undefined를 보내면 Supabase가 혼동할 수 있으므로
  // 명시적으로 null 처리
  const { data, error } = await supabase
    .from('programs')
    .insert({
      org_id: orgId,
      title: programData.title,
      description: programData.description,
      status: programData.status || 'draft',
      slug: programData.slug,
      deadline: programData.deadline,
      form_schema: programData.form_schema ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[createProgram]', error);
    return { success: false, error: '프로그램 생성에 실패했습니다.' };
  }

  revalidatePath('/dashboard/programs');

  return { success: true, data };
}

/**
 * 프로그램 수정
 * - 폼 빌더의 "폼 저장"도 이 함수로 form_schema만 업데이트
 * - partial update: 전달된 필드만 반영, undefined는 제거
 */
export async function updateProgram(
  updateData: UpdateProgramData
): Promise<ActionResult<Program>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // id는 WHERE 조건용이라 update 페이로드에서 분리
  const { id, ...fields } = updateData;

  // undefined 필드 제거 - Supabase에 undefined를 넘기면 동작이 예측 불가능
  // (null은 "값을 지워라"는 의도이므로 보존)
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  const { data, error } = await supabase
    .from('programs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateProgram]', error);
    return { success: false, error: '프로그램 수정에 실패했습니다.' };
  }

  revalidatePath('/dashboard/programs');
  revalidatePath(`/dashboard/programs/${id}`);

  return { success: true, data };
}

/**
 * 프로그램 삭제
 * - FK 제약에 따라 연관 applications도 영향받을 수 있음
 * - 추후 soft delete 고려
 */
export async function deleteProgram(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteProgram]', error);
    return { success: false, error: '프로그램 삭제에 실패했습니다.' };
  }

  revalidatePath('/dashboard/programs');

  return { success: true, data: null };
}