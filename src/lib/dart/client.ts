// ============================================================
// DART OpenAPI 클라이언트
// 서버 사이드에서만 사용 (API 키 보호)
// ============================================================

import type {
  DartCompanyResponse,
  DartFinancialResponse,
  DartDisclosureResponse,
} from './types';

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

function getApiKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) {
    throw new Error('DART_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  return key;
}

// --- 요청 유틸리티 (rate limit 대응 포함) ---
async function dartFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${DART_BASE_URL}/${endpoint}`);
  url.searchParams.set('crtfc_key', getApiKey());

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`DART API 요청 실패: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // DART API 에러 코드 처리
  if (data.status && data.status !== '000') {
    // "013" = 조회된 데이터 없음 (에러가 아닌 정상 케이스)
    if (data.status === '013') {
      return data as T;
    }
    throw new Error(`DART API 오류 [${data.status}]: ${data.message}`);
  }

  return data as T;
}

// 요청 사이 딜레이 (DART API 분당 요청 제한 대응)
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 1. 기업개황 API
// ============================================================
export async function fetchCompany(
  corpCode: string
): Promise<DartCompanyResponse> {
  return dartFetch<DartCompanyResponse>('company.json', {
    corp_code: corpCode,
  });
}

// ============================================================
// 2. 단일회사 주요계정 API (재무제표)
// ============================================================
// reprt_code: 11013(1분기), 11012(반기), 11014(3분기), 11011(사업보고서)
export async function fetchFinancials(
  corpCode: string,
  bsnsYear: string,
  reprtCode: string = '11011' // 기본값: 사업보고서 (연간)
): Promise<DartFinancialResponse> {
  return dartFetch<DartFinancialResponse>('fnlttSinglAcnt.json', {
    corp_code: corpCode,
    bsns_year: bsnsYear,
    reprt_code: reprtCode,
  });
}

// ============================================================
// 3. 공시검색 API
// ============================================================
export async function fetchDisclosures(
  corpCode: string,
  options?: {
    startDate?: string; // YYYYMMDD
    endDate?: string; // YYYYMMDD
    pageNo?: number;
    pageCount?: number;
  }
): Promise<DartDisclosureResponse> {
  const params: Record<string, string> = {
    corp_code: corpCode,
  };

  if (options?.startDate) params.bgn_de = options.startDate;
  if (options?.endDate) params.end_de = options.endDate;
  if (options?.pageNo) params.page_no = String(options.pageNo);
  if (options?.pageCount) params.page_count = String(options.pageCount);

  return dartFetch<DartDisclosureResponse>('list.json', params);
}

// ============================================================
// 4. 고유번호 전체 목록 다운로드 (ZIP → XML 파싱)
// ============================================================
// 이 API는 ZIP 파일을 반환하므로 별도 처리 필요
// 전체 목록은 수만 건이라 초기 1회만 실행하거나,
// 필요한 기업만 수동으로 corp_code를 지정해서 사용
export async function fetchCorpCodeZip(): Promise<ArrayBuffer> {
  const url = `${DART_BASE_URL}/corpCode.xml?crtfc_key=${getApiKey()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`고유번호 ZIP 다운로드 실패: ${response.status}`);
  }

  return response.arrayBuffer();
}