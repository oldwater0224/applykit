// ============================================================
// 네이버 뉴스 검색 API 클라이언트
// 서버 사이드에서만 사용 (API 키 보호)
// ============================================================

import type { NaverNewsResponse } from "./types";

const NAVER_API_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000];

function getCredentials() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return { clientId, clientSecret };
}

export async function searchNews(
  query: string,
  options?: { display?: number; start?: number; sort?: "date" | "sim" }
): Promise<NaverNewsResponse> {
  const { clientId, clientSecret } = getCredentials();
  const params = new URLSearchParams({
    query,
    display: String(options?.display ?? 100),
    start: String(options?.start ?? 1),
    sort: options?.sort ?? "date",
  });

  const url = `${NAVER_API_URL}?${params}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        throw new NaverRateLimitError("네이버 API 일일 한도 초과");
      }

      if (response.status === 401 || response.status === 403) {
        throw new NaverAuthError(`네이버 API 인증 실패: ${response.status}`);
      }

      if (response.status === 400) {
        throw new Error(`네이버 API 파라미터 오류: ${response.status}`);
      }

      if (!response.ok) {
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAYS[attempt]);
          continue;
        }
        throw new Error(`네이버 API 요청 실패: ${response.status}`);
      }

      return (await response.json()) as NaverNewsResponse;
    } catch (err) {
      clearTimeout(timeout);

      if (err instanceof NaverRateLimitError || err instanceof NaverAuthError) {
        throw err;
      }

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAYS[attempt]);
        continue;
      }
      throw err;
    }
  }

  throw new Error("네이버 API 요청 실패: 최대 재시도 초과");
}

export class NaverRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverRateLimitError";
  }
}

export class NaverAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverAuthError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
