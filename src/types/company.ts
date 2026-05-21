// ============================================================
// src/types/company.ts
// 기업 데이터 타입 정의
// ============================================================

import { FundingRound } from "./funding";

// --- companies 테이블 행 타입 ---
export interface Company {
  id: string;
  corp_code: string | null;
  corp_name: string;
  corp_name_eng: string | null;
  ceo_name: string | null;
  corp_cls: string | null;
  bizr_no: string | null;
  jurir_no: string | null;
  address: string | null;
  homepage_url: string | null;
  ir_url: string | null;
  phone: string | null;
  industry_code: string | null;
  industry_name: string | null;
  sector: string | null;
  established_date: string | null;
  employee_count: number | null;
  description: string | null;
  logo_url: string | null;
  data_source: string | null;
  created_at: string;
  updated_at: string;
}

// --- financials 테이블 행 타입 ---
export interface Financial {
  id: string;
  company_id: string;
  fiscal_year: number;
  report_code: string | null;
  revenue: number | null;
  operating_income: number | null;
  net_income: number | null;
  total_assets: number | null;
  total_equity: number | null;
  total_debt: number | null;
  data_source: string | null;
  created_at: string;
}

// --- disclosures 테이블 행 타입 ---
export interface Disclosure {
  id: string;
  company_id: string;
  rcept_no: string;
  disclosure_date: string;
  title: string;
  disclosure_type: string | null;
  dart_url: string | null;
  data_source: string | null;
  created_at: string;
}

// --- 기업 상세 (기본정보 + 재무 + 공시) ---
export interface CompanyDetail extends Company {
  financials: Financial[];
  disclosures: Disclosure[];
  fundingRounds : FundingRound[];
}

// --- 업종 필터용 ---
export interface SectorCount {
  name: string;
  count: number;
}