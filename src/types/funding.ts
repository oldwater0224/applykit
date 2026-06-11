// ============================================================
// src/types/funding.ts
// 투자 라운드 / 투자자 / 대시보드 통계 타입 정의
// DB의 round_name (text) 컬럼에 맞춰 설계
// ============================================================

// --- 투자 라운드 표시 이름 ---
export const ROUND_NAME_LIST = [
  "Seed",
  "Pre-A",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Pre-IPO",
  "IPO",
  "M&A",
  "CB",
  "BW",
  "유상증자",
] as const;

export type RoundName = (typeof ROUND_NAME_LIST)[number];

// --- DB round_name 값 → 표시용 정규화 ---
const ROUND_NORMALIZE: Record<string, RoundName> = {
  seed: "Seed",
  "pre-a": "Pre-A",
  pre_a: "Pre-A",
  "series a": "Series A",
  series_a: "Series A",
  "series b": "Series B",
  series_b: "Series B",
  "series c": "Series C",
  series_c: "Series C",
  "series d": "Series D",
  series_d: "Series D",
  "pre-ipo": "Pre-IPO",
  pre_ipo: "Pre-IPO",
  ipo: "IPO",
  "m&a": "M&A",
  ma: "M&A",
  cb: "CB",
  전환사채: "CB",
  bw: "BW",
  신주인수권부사채: "BW",
  유상증자: "유상증자",
};

export function normalizeRoundName(raw: string): RoundName | string {
  const key = raw.trim().toLowerCase();
  return ROUND_NORMALIZE[key] ?? raw;
}

// --- 라운드별 색상 ---
export const ROUND_COLORS: Record<string, string> = {
  Seed: "bg-emerald-50 text-emerald-700",
  "Pre-A": "bg-teal-50 text-teal-700",
  "Series A": "bg-blue-50 text-blue-700",
  "Series B": "bg-indigo-50 text-indigo-700",
  "Series C": "bg-violet-50 text-violet-700",
  "Series D": "bg-purple-50 text-purple-700",
  "Pre-IPO": "bg-amber-50 text-amber-700",
  IPO: "bg-orange-50 text-orange-700",
  "M&A": "bg-rose-50 text-rose-700",
  CB: "bg-cyan-50 text-cyan-700",
  BW: "bg-sky-50 text-sky-700",
  유상증자: "bg-slate-50 text-slate-700",
};

// --- funding_rounds 테이블 행 타입 (DB 1:1) ---
export interface FundingRound {
  id: string;
  company_id: string;
  round_name: string;
  amount: number | null;
  currency: string | null;
  announced_date: string | null;
  news_url: string | null;
  data_source: string | null;
  created_at: string;
}

// --- funding_rounds + companies JOIN ---
export interface FundingRoundWithCompany extends FundingRound {
  company: {
    corp_name: string;
    sector: string | null;
    industry_name: string | null;
    logo_url: string | null;
  };
}

// --- investors 테이블 행 타입 ---
export interface Investor {
  id: string;
  name: string;
  name_eng: string | null;
  type: string;
  description: string | null;
  logo_url: string | null;
  homepage_url: string | null;
  founded_year: number | null;
  created_at: string;
}

// --- 대시보드 통계 ---
export interface DashboardStats {
  totalRounds: number;
  totalAmount: number;
  monthlyRounds: number;
  monthlyAmount: number;
  prevYearMonthlyRounds: number;
  roundsByName: RoundNameCount[];
  topSectors: SectorInvestment[];
  recentRounds: RecentRound[];
}

export interface RoundNameCount {
  roundName: string;
  count: number;
  amount: number;
}

export interface SectorInvestment {
  sector: string;
  count: number;
  amount: number;
}

export interface RecentRound {
  id: string;
  companyName: string;
  sector: string | null;
  roundName: string;
  amount: number | null;
  announcedDate: string;
}