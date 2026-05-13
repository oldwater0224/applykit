// ============================================================
// DART OpenAPI 응답 타입 + Supabase DB 타입
// ============================================================

// --- DART API 공통 응답 ---
export interface DartBaseResponse {
  status: string; // "000" = 정상, "013" = 조회된 데이터 없음
  message: string;
}

// --- 고유번호 목록 (corpCode.xml → ZIP → XML) ---
export interface DartCorpCode {
  corp_code: string; // 고유번호 8자리
  corp_name: string; // 기업명
  stock_code: string; // 종목코드 (비상장이면 빈 문자열)
  modify_date: string; // 최근변경일 YYYYMMDD
}

// --- 기업개황 API 응답 (company.json) ---
export interface DartCompanyResponse extends DartBaseResponse {
  corp_code: string;
  corp_name: string;
  corp_name_eng: string;
  stock_name: string;
  stock_code: string;
  ceo_nm: string;
  corp_cls: string; // Y(유가증권), K(코스닥), N(코넥스), E(기타)
  jurir_no: string; // 법인등록번호
  bizr_no: string; // 사업자등록번호
  adres: string; // 주소
  hm_url: string; // 홈페이지
  ir_url: string; // IR 페이지
  phn_no: string; // 전화번호
  fax_no: string;
  induty_code: string; // 업종코드
  est_dt: string; // 설립일 YYYYMMDD
  acc_mt: string; // 결산월
}

// --- 단일회사 주요계정 API 응답 (fnlttSinglAcnt.json) ---
export interface DartFinancialItem {
  rcept_no: string; // 접수번호
  reprt_code: string; // 보고서 코드
  bsns_year: string; // 사업연도
  corp_code: string;
  stock_code: string;
  fs_div: string; // CFS(연결), OFS(개별)
  fs_nm: string;
  sj_div: string; // BS(재무상태표), IS(손익계산서)
  sj_nm: string;
  account_nm: string; // 계정명 (매출액, 영업이익 등)
  thstrm_nm: string; // 당기명
  thstrm_amount: string; // 당기금액 (콤마 포함 문자열)
  frmtrm_nm: string; // 전기명
  frmtrm_amount: string; // 전기금액
  bfefrmtrm_nm: string; // 전전기명
  bfefrmtrm_amount: string; // 전전기금액
  ord: string; // 계정과목 정렬순서
}

export interface DartFinancialResponse extends DartBaseResponse {
  list: DartFinancialItem[];
}

// --- 공시검색 API 응답 (list.json) ---
export interface DartDisclosureItem {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  corp_cls: string;
  report_nm: string; // 보고서명
  rcept_no: string; // 접수번호
  flr_nm: string; // 공시제출인명
  rcept_dt: string; // 접수일자 YYYYMMDD
  rm: string; // 비고 (유, 코, 넥 등)
}

export interface DartDisclosureResponse extends DartBaseResponse {
  page_no: number;
  page_count: number;
  total_count: number;
  total_page: number;
  list: DartDisclosureItem[];
}

// --- Supabase DB Insert 타입 ---
export interface CompanyInsert {
  corp_code: string;
  corp_name: string;
  corp_name_eng?: string;
  ceo_name?: string;
  corp_cls?: string;
  bizr_no?: string;
  jurir_no?: string;
  address?: string;
  homepage_url?: string;
  ir_url?: string;
  phone?: string;
  industry_code?: string;
  industry_name?: string;
  sector?: string;
  established_date?: string; // ISO date string
  data_source?: string;
}

export interface FinancialInsert {
  company_id: string;
  fiscal_year: number;
  report_code?: string;
  revenue?: number;
  operating_income?: number;
  net_income?: number;
  total_assets?: number;
  total_equity?: number;
  total_debt?: number;
  data_source?: string;
}

export interface DisclosureInsert {
  company_id: string;
  rcept_no: string;
  disclosure_date: string; // ISO date string
  title: string;
  disclosure_type?: string;
  dart_url?: string;
  data_source?: string;
}