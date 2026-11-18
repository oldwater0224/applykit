// 로그인·재동의·OAuth 콜백 뒤 이동할 경로 검증 (오픈 리다이렉트 방지, #69)
//
// 같은 사이트 내부 경로("/..." 형태)만 허용한다.
// "//evil.com", "/\evil.com" 은 브라우저가 다른 호스트로 해석하므로 거부한다.

const DEFAULT_REDIRECT = "/applications";

// 제어문자(탭·개행 포함)와 백슬래시
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f\\]/;

export function safeRedirectPath(
  input: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof input !== "string" || input.length === 0) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (FORBIDDEN_CHARS.test(input)) return fallback;

  try {
    const base = "http://x";
    if (new URL(input, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }

  return input;
}
