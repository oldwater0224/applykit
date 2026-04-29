// MVP 허용 파일 형식 - PDF와 Excel(.xlsx)만
// 보안 + 단순성 위해 구버전 .xls는 제외
// 변경 시 클라이언트/서버/폼빌더 3곳에 자동 반영됨

export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".xlsx"] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

// HTML input의 accept 속성 형식 (쉼표 구분)
// 폼 빌더에서 운영기관에게 표시할 기본값 + UI 제한
export const ACCEPT_ATTRIBUTE = ALLOWED_FILE_EXTENSIONS.join(",");

// 사용자에게 보여줄 라벨 - 에러 메시지에 사용
export const ALLOWED_FILES_LABEL = "PDF, Excel(.xlsx)";

/**
 * 파일이 허용된 형식인지 검증
 * - 확장자 + MIME 둘 다 체크 (확장자만 바꾸는 우회 방어)
 * - 한쪽이라도 매칭 안 되면 거부
 */
export function isAllowedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const extOk = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const mimeOk = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);

  // 일부 OS/브라우저는 MIME을 빈 문자열로 보냄 - 그 경우 확장자만 봄
  if (!file.type) return extOk;

  return extOk && mimeOk;
}