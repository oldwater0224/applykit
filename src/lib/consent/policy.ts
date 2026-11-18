// 이용약관·개인정보 처리방침 버전과 가입 동의 폼 검증 (#69)
//
// 버전을 올리면 legal_documents 테이블의 is_current 도 같은 값으로 바꿔야 한다.
// (has_current_consents()가 DB의 현재 버전으로 재동의 여부를 판단한다)

export const TERMS_VERSION = "2026-11-01";
export const PRIVACY_VERSION = "2026-11-01";
// 화면 표시용 YYYY-MM-DD. 이 판(버전)의 제정일이다. 시행(적용) 시점은 날짜 고정이 아니라
// "서비스에 게시한 날부터"이며 문구는 처리방침·약관 화면에서 설명한다.
// 상수 이름은 기존 import 호환을 위해 유지한다.
export const LEGAL_EFFECTIVE_DATE = "2026-11-01";

// 폼 체크박스 name
export const CONSENT_FIELDS = {
  age14: "agree_age14",
  terms: "agree_terms",
  privacy: "agree_privacy",
} as const;

export type SignupConsents = { terms: string; privacy: string; age14: true };

export const CONSENT_REQUIRED_ERROR = "필수 항목에 모두 동의해주세요.";

// 체크된 네이티브 checkbox는 값 "on"으로 전송된다. 그 외 값은 동의로 보지 않는다.
export function parseConsentForm(
  formData: FormData,
):
  | { ok: true; consents: SignupConsents }
  | { ok: false; error: string } {
  const allChecked = Object.values(CONSENT_FIELDS).every(
    (field) => formData.get(field) === "on",
  );

  if (!allChecked) {
    return { ok: false, error: CONSENT_REQUIRED_ERROR };
  }

  return {
    ok: true,
    consents: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, age14: true },
  };
}
