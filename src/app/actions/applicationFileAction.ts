"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { ApplicationFile } from "@/src/types/applicationFile";
import {
  ALLOWED_FILES_LABEL,
  isAllowedFile,
} from "@/src/lib/file/allowedTypes";

// 다른 Action들과 동일한 응답 패턴
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// Storage 버킷 이름 - 한 곳에서 관리
// 추후 환경별로 다른 버킷을 쓰게 되면 env로 빼면 됨
const BUCKET_NAME = "applications";

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
  formData: FormData,
): Promise<ActionResult<ApplicationFile>> {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 2. FormData에서 값 추출
  // 이 시점에는 아직 string/File로만 보장되므로 타입 가드 필수
  const applicationId = formData.get("application_id");
  const fieldKey = formData.get("field_key");
  const file = formData.get("file");

  if (
    typeof applicationId !== "string" ||
    typeof fieldKey !== "string" ||
    !(file instanceof File)
  ) {
    return { success: false, error: "잘못된 요청입니다." };
  }

  // 3. 지원서 소유권 확인
  // - application_id가 실제로 본인 것인지 검증
  // - 안 그러면 다른 사람 지원서에 파일을 붙일 수 있음
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, user_id, is_complete")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { success: false, error: "지원서를 찾을 수 없습니다." };
  }

  if (application.user_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 제출 완료된 지원서에는 파일 추가 불가
  if (application.is_complete) {
    return {
      success: false,
      error: "제출된 지원서에는 파일을 추가할 수 없습니다.",
    };
  }

  // 4. Storage 경로 생성
  // 규칙: {user_id}/{application_id}/{field_key}/{timestamp}_{filename}
  //
  // 변경 사항 (Day 12):
  // - 파일명을 ASCII safe로만 만듦 (한글/공백/특수문자 모두 _)
  // - 원본 파일명은 file_name 컬럼에 보존 (다운로드 시 원본명으로 표시)
  // - 사유: 한글/유니코드 sanitize가 환경마다 결과 달라서
  //   DB와 Storage 경로 어긋나고 signed URL 발급 후 404 발생

  // 확장자 분리 - 점이 sanitize되지 않게
  const lastDot = file.name.lastIndexOf(".");
  const ext = lastDot > 0 ? file.name.slice(lastDot) : "";
  const baseName = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;

  // ASCII alphanumeric + 하이픈/밑줄만 허용
  // 그 외 (한글, 공백, 특수문자, 콜론 등)는 모두 _로
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_") || "file";

  // 확장자도 안전하게
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");

  const timestamp = Date.now();
  // fieldKey도 sanitize - useId() 출력에 콜론이 있을 수 있어서
  const safeFieldKey = fieldKey.replace(/[^a-zA-Z0-9_-]/g, "_");

  const storagePath = `${user.id}/${applicationId}/${safeFieldKey}/${timestamp}_${safeBase}${safeExt}`;

  // 파일 형식 서버 검증 - 클라이언트 우회 차단
  if (!isAllowedFile(file)) {
    return {
      success: false,
      error: `${ALLOWED_FILES_LABEL} 파일만 업로드할 수 있습니다.`,
    };
  }

  // 파일 크기 서버 검증 - 일반적 상한 (10MB)
  // MVP는 클라이언트 maxFileSize에 의존하지만 서버에도 안전망
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      error: "파일 크기는 10MB 이하여야 합니다.",
    };
  }

  // 5. Storage 업로드
  // After - Supabase가 path를 자체 sanitize할 수 있어서
  // 우리가 보낸 storagePath와 실제 저장 경로가 다를 수 있음
  // uploadData.path를 받아 DB에 저장해야 signed URL 발급 시 일치
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError || !uploadData) {
    console.error("[uploadApplicationFile] storage upload", uploadError);
    return { success: false, error: "파일 업로드에 실패했습니다." };
  }

  // 6. DB row 생성
  // application_files 테이블에 메타데이터 저장
  const { data: fileRow, error: dbError } = await supabase
    .from("application_files")
    .insert({
      application_id: applicationId,
      field_key: fieldKey,
      file_name: file.name, // 원본 파일명 보존 (사용자에게 표시할 이름)
      storage_path: uploadData.path,
      file_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbError) {
    // 7. DB insert 실패 시 롤백 - Storage에 올린 파일 삭제
    // 이게 없으면 고아 파일이 쌓임
    console.error("[uploadApplicationFile] db insert", dbError);
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return { success: false, error: "파일 정보 저장에 실패했습니다." };
  }

  revalidatePath("/applications");

  return { success: true, data: fileRow };
}

/**
 * 파일 삭제
 * - DB row 삭제 + Storage 파일 삭제
 * - DB 삭제가 먼저 - 그래야 RLS 권한 체크가 작동함
 *   (Storage 정책은 파일명만 체크하지만, DB 정책이 더 엄격)
 */
export async function deleteApplicationFile(
  fileId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 1. 파일 정보 조회 (Storage 경로 확보 + 소유권 확인)
  // application_files와 applications를 조인해서 user_id 확인
  const { data: fileRow, error: fetchError } = await supabase
    .from("application_files")
    .select(
      "id, storage_path, application_id, applications!inner(user_id, is_complete)",
    )
    .eq("id", fileId)
    .single();

  if (fetchError || !fileRow) {
    return { success: false, error: "파일을 찾을 수 없습니다." };
  }

  // Supabase nested select 결과는 배열 또는 객체로 올 수 있음 -
  // !inner로 강제 join했으니 객체로 옴
  const application = Array.isArray(fileRow.applications)
    ? fileRow.applications[0]
    : fileRow.applications;

  if (!application || application.user_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  if (application.is_complete) {
    return {
      success: false,
      error: "제출된 지원서의 파일은 삭제할 수 없습니다.",
    };
  }

  // 2. DB row 삭제 먼저
  const { error: dbError } = await supabase
    .from("application_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("[deleteApplicationFile] db delete", dbError);
    return { success: false, error: "파일 삭제에 실패했습니다." };
  }

  // 3. Storage 파일 삭제
  // DB는 지웠는데 Storage 삭제가 실패하면 고아 파일이 남음 -
  // 치명적이지 않으므로 에러를 사용자에게 노출하지 않고 로그만 남김
  // (나중에 cron job으로 고아 파일 정리)
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileRow.storage_path]);

  if (storageError) {
    console.error("[deleteApplicationFile] storage remove", storageError);
    // DB는 이미 지워졌으므로 사용자 입장에선 성공으로 처리
  }

  revalidatePath("/applications");

  return { success: true, data: null };
}

/**
 * 특정 지원서의 파일 목록 조회
 * - 작성 페이지에서 "이미 업로드된 파일" 표시용
 * - field_key별로 그룹핑해서 쓸 수 있게 평탄한 배열 반환
 */
export async function getApplicationFiles(
  applicationId: string,
): Promise<ActionResult<ApplicationFile[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // RLS가 막아주지만 명시적으로 application_id로 필터링
  const { data, error } = await supabase
    .from("application_files")
    .select("*")
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: true });

  if (error) {
    console.error("[getApplicationFiles]", error);
    return { success: false, error: "파일 목록 조회에 실패했습니다." };
  }

  return { success: true, data: data || [] };
}

/**
 * 파일 다운로드용 signed URL 생성
 * - private 버킷이라 직접 URL 접근 불가 - 일회성 서명 URL 필요
 * - 1시간 유효 (3600초)
 * - 권한 체크는 RLS에 위임:
 *   - 지원자: 본인 파일만 조회 가능 (Users can view files ...)
 *   - 운영기관: 자기 기관 프로그램의 모든 파일 조회 가능 (operator_files)
 * - RLS가 row를 숨기므로 권한 없으면 "not found"로 자연스럽게 떨어짐
 */
export async function getFileSignedUrl(
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // storage_path만 필요 - 권한 체크는 RLS가 처리
  // 권한 없으면 RLS가 row를 숨겨서 not found로 떨어짐
  const { data: fileRow, error: fetchError } = await supabase
    .from("application_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fetchError || !fileRow) {
    return { success: false, error: "파일을 찾을 수 없습니다." };
  }

  // signed URL 생성 - 1시간 유효
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileRow.storage_path, 3600);

  if (error || !data) {
    console.error("[getFileSignedUrl]", error);
    return { success: false, error: "URL 생성에 실패했습니다." };
  }

  return { success: true, data: { url: data.signedUrl } };
}
