'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import type { ApplicationFile } from '@/src/types/applicationFile';

// 다른 Action들과 동일한 응답 패턴
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// Storage 버킷 이름 - 한 곳에서 관리
// 추후 환경별로 다른 버킷을 쓰게 되면 env로 빼면 됨
const BUCKET_NAME = 'applications';

/**
 * 파일 업로드
 * - Storage 업로드 + DB row 생성을 원자적으로 처리
 * - DB insert 실패 시 Storage에 올린 파일도 삭제(롤백)
 *
 * 주의: Server Action은 FormData만 직접 받을 수 있음 -
 * File 객체는 FormData에 담아서 전달해야 함
 * 호출부에서 new FormData() 만들어서 넘기는 패턴
 */
export async function uploadApplicationFile(
  formData: FormData
): Promise<ActionResult<ApplicationFile>> {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 2. FormData에서 값 추출
  // 이 시점에는 아직 string/File로만 보장되므로 타입 가드 필수
  const applicationId = formData.get('application_id');
  const fieldKey = formData.get('field_key');
  const file = formData.get('file');

  if (
    typeof applicationId !== 'string' ||
    typeof fieldKey !== 'string' ||
    !(file instanceof File)
  ) {
    return { success: false, error: '잘못된 요청입니다.' };
  }

  // 3. 지원서 소유권 확인
  // - application_id가 실제로 본인 것인지 검증
  // - 안 그러면 다른 사람 지원서에 파일을 붙일 수 있음
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('id, user_id, is_complete')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return { success: false, error: '지원서를 찾을 수 없습니다.' };
  }

  if (application.user_id !== user.id) {
    return { success: false, error: '권한이 없습니다.' };
  }

  // 제출 완료된 지원서에는 파일 추가 불가
  if (application.is_complete) {
    return {
      success: false,
      error: '제출된 지원서에는 파일을 추가할 수 없습니다.',
    };
  }

  // 4. Storage 경로 생성
  // 규칙: {user_id}/{application_id}/{field_key}/{timestamp}_{filename}
  // - user_id로 시작해야 Storage RLS 정책이 통과됨
  // - timestamp 접두어로 동일 파일명 충돌 방지
  // - 한글 파일명도 안전하게 - Supabase는 UTF-8 경로 지원
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, '_'); // 위험 문자 치환
  const storagePath = `${user.id}/${applicationId}/${fieldKey}/${timestamp}_${safeName}`;

  // 5. Storage 업로드
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false, // 동일 경로 덮어쓰기 금지 - timestamp가 있어서 충돌 안 남
    });

  if (uploadError) {
    console.error('[uploadApplicationFile] storage upload', uploadError);
    return { success: false, error: '파일 업로드에 실패했습니다.' };
  }

  // 6. DB row 생성
  // application_files 테이블에 메타데이터 저장
  const { data: fileRow, error: dbError } = await supabase
    .from('application_files')
    .insert({
      application_id: applicationId,
      field_key: fieldKey,
      file_name: file.name, // 원본 파일명 보존 (사용자에게 표시할 이름)
      storage_path: storagePath,
      file_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbError) {
    // 7. DB insert 실패 시 롤백 - Storage에 올린 파일 삭제
    // 이게 없으면 고아 파일이 쌓임
    console.error('[uploadApplicationFile] db insert', dbError);
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return { success: false, error: '파일 정보 저장에 실패했습니다.' };
  }

  revalidatePath('/applications');

  return { success: true, data: fileRow };
}

/**
 * 파일 삭제
 * - DB row 삭제 + Storage 파일 삭제
 * - DB 삭제가 먼저 - 그래야 RLS 권한 체크가 작동함
 *   (Storage 정책은 파일명만 체크하지만, DB 정책이 더 엄격)
 */
export async function deleteApplicationFile(
  fileId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 1. 파일 정보 조회 (Storage 경로 확보 + 소유권 확인)
  // application_files와 applications를 조인해서 user_id 확인
  const { data: fileRow, error: fetchError } = await supabase
    .from('application_files')
    .select('id, storage_path, application_id, applications!inner(user_id, is_complete)')
    .eq('id', fileId)
    .single();

  if (fetchError || !fileRow) {
    return { success: false, error: '파일을 찾을 수 없습니다.' };
  }

  // Supabase nested select 결과는 배열 또는 객체로 올 수 있음 -
  // !inner로 강제 join했으니 객체로 옴
  const application = Array.isArray(fileRow.applications)
    ? fileRow.applications[0]
    : fileRow.applications;

  if (!application || application.user_id !== user.id) {
    return { success: false, error: '권한이 없습니다.' };
  }

  if (application.is_complete) {
    return {
      success: false,
      error: '제출된 지원서의 파일은 삭제할 수 없습니다.',
    };
  }

  // 2. DB row 삭제 먼저
  const { error: dbError } = await supabase
    .from('application_files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    console.error('[deleteApplicationFile] db delete', dbError);
    return { success: false, error: '파일 삭제에 실패했습니다.' };
  }

  // 3. Storage 파일 삭제
  // DB는 지웠는데 Storage 삭제가 실패하면 고아 파일이 남음 -
  // 치명적이지 않으므로 에러를 사용자에게 노출하지 않고 로그만 남김
  // (나중에 cron job으로 고아 파일 정리)
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileRow.storage_path]);

  if (storageError) {
    console.error('[deleteApplicationFile] storage remove', storageError);
    // DB는 이미 지워졌으므로 사용자 입장에선 성공으로 처리
  }

  revalidatePath('/applications');

  return { success: true, data: null };
}

/**
 * 특정 지원서의 파일 목록 조회
 * - 작성 페이지에서 "이미 업로드된 파일" 표시용
 * - field_key별로 그룹핑해서 쓸 수 있게 평탄한 배열 반환
 */
export async function getApplicationFiles(
  applicationId: string
): Promise<ActionResult<ApplicationFile[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // RLS가 막아주지만 명시적으로 application_id로 필터링
  const { data, error } = await supabase
    .from('application_files')
    .select('*')
    .eq('application_id', applicationId)
    .order('uploaded_at', { ascending: true });

  if (error) {
    console.error('[getApplicationFiles]', error);
    return { success: false, error: '파일 목록 조회에 실패했습니다.' };
  }

  return { success: true, data: data || [] };
}

/**
 * 파일 다운로드용 signed URL 생성
 * - private 버킷이라 직접 URL 접근 불가 - 일회성 서명 URL 필요
 * - 1시간 유효 (3600초)
 * - 작성 페이지에서 "업로드한 파일 미리보기/다운로드" 용도
 */
export async function getFileSignedUrl(
  fileId: string
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  // 파일 정보 + 소유권 확인
  const { data: fileRow, error: fetchError } = await supabase
    .from('application_files')
    .select('storage_path, applications!inner(user_id)')
    .eq('id', fileId)
    .single();

  if (fetchError || !fileRow) {
    return { success: false, error: '파일을 찾을 수 없습니다.' };
  }

  const application = Array.isArray(fileRow.applications)
    ? fileRow.applications[0]
    : fileRow.applications;

  if (!application || application.user_id !== user.id) {
    return { success: false, error: '권한이 없습니다.' };
  }

  // signed URL 생성 - 1시간 유효
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileRow.storage_path, 3600);

  if (error || !data) {
    console.error('[getFileSignedUrl]', error);
    return { success: false, error: 'URL 생성에 실패했습니다.' };
  }

  return { success: true, data: { url: data.signedUrl } };
}