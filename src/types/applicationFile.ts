// application_files 테이블과 1:1 매칭되는 Row 타입
// Supabase에서 select * 했을 때 받는 형태
// 모든 컬럼이 NOT NULL이므로 nullable 필드 없음 (DB에 NOT NULL 제약 추가했다고 가정)
export interface ApplicationFile {
  id: string;
  application_id: string;
  field_key: string; // FormField.id와 매칭 - 어느 폼 필드의 파일인지
  file_name: string; // 원본 파일명 (예: "사업계획서.pdf")
  storage_path: string; // Supabase Storage 내 경로
  file_type: string; // MIME 타입 (예: "application/pdf")
  size_bytes: number;
  uploaded_at: string;
}

// 파일 업로드 시 클라이언트가 넘기는 입력
// Server Action에서 user_id를 별도로 검증 -
// application_id로 소유권 확인 후 storage_path 생성
export interface UploadApplicationFileInput {
  application_id: string;
  field_key: string;
  file: File; // 브라우저 File 객체
}

// 파일 크기 변환 유틸 - UI에서 "1.2 MB" 같은 표시용
// 별도 유틸 파일로 빼도 되지만 파일 관련이라 여기 둠
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}