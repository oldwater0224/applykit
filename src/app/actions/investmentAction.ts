"use server";

// ============================================================
// src/app/actions/investmentAction.ts
// 투자 라운드 목록 조회 Server Action
// ============================================================

import { createClient } from "@/src/lib/supabase/server";
import { normalizeRoundName } from "@/src/types/funding";

export interface InvestmentListItem {
  id: string;
  roundName: string;
  amount: number | null;
  currency: string | null;
  announcedDate: string | null;
  newsUrl: string | null;
  companyId: string;
  companyName: string;
  sector: string | null;
  logoUrl: string | null;
}

export interface InvestmentListResult {
  data: InvestmentListItem[];
  total: number;
}

export async function getInvestments({
  round,
  limit = 20,
  offset = 0,
}: {
  round?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<InvestmentListResult> {
  const supabase = await createClient();

  let query = supabase
    .from("funding_rounds")
    .select(
      "id, round_name, amount, currency, announced_date, news_url, company_id, companies(corp_name, sector, industry_name, logo_url)",
      { count: "exact" }
    )
    .order("announced_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // 라운드 필터 (탭)
  if (round && round !== "all") {
    query = query.eq("round_name", round);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[getInvestments Error]", error);
    return { data: [], total: 0 };
  }

  const items: InvestmentListItem[] = (data as any[]).map((r) => ({
    id: r.id,
    roundName: normalizeRoundName(r.round_name),
    amount: r.amount,
    currency: r.currency,
    announcedDate: r.announced_date,
    newsUrl: r.news_url,
    companyId: r.company_id,
    companyName: r.companies?.corp_name ?? "알 수 없음",
    sector: r.companies?.sector ?? r.companies?.industry_name ?? null,
    logoUrl: r.companies?.logo_url ?? null,
  }));

  return { data: items, total: count ?? 0 };
}