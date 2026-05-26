"use server";

// ============================================================
// src/app/actions/investorAction.ts
// 투자자 데이터 조회 Server Actions
// ============================================================

import { createClient } from "@/src/lib/supabase/server";

// --- 투자자 목록 ---
export async function getInvestors(options?: {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const supabase = await createClient();
    const { type, search, page = 1, pageSize = 20 } = options || {};

    let query = supabase
      .from("investors")
      .select("*", { count: "exact" })
      .order("name", { ascending: true });

    if (type && type !== "전체") {
      query = query.eq("investor_type", type);
    }

    if (search && search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      return { success: false as const, error: error.message };
    }

    // 각 투자자의 투자 건수 조회
    const investorIds = (data ?? []).map((i) => i.id);

    let investCounts: Record<string, number> = {};
    if (investorIds.length > 0) {
      const { data: fiData } = await supabase
        .from("funding_investors")
        .select("investor_id")
        .in("investor_id", investorIds);

      investCounts = (fiData ?? []).reduce(
        (acc: Record<string, number>, row) => {
          acc[row.investor_id] = (acc[row.investor_id] || 0) + 1;
          return acc;
        },
        {}
      );
    }

    const investors = (data ?? []).map((inv) => ({
      ...inv,
      investmentCount: investCounts[inv.id] ?? 0,
    }));

    return {
      success: true as const,
      data: investors,
      totalCount: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 투자자 상세 ---
export async function getInvestorDetail(investorId: string) {
  try {
    const supabase = await createClient();

    // 투자자 기본 정보
    const { data: investor, error } = await supabase
      .from("investors")
      .select("*")
      .eq("id", investorId)
      .single();

    if (error) {
      return { success: false as const, error: error.message };
    }

    // 투자 이력 (funding_investors → funding_rounds → companies JOIN)
    const { data: fiData } = await supabase
      .from("funding_investors")
      .select(
        "id, is_lead, funding_round_id, funding_rounds(id, round_name, amount, announced_date, company_id, companies(id, corp_name, sector, logo_url))"
      )
      .eq("investor_id", investorId)
      .order("created_at", { ascending: false });

    // 포트폴리오 정리
    interface PortfolioRow {
      id: string;
      is_lead: boolean;
      funding_round_id: string;
      funding_rounds: {
        id: string;
        round_name: string;
        amount: number | null;
        announced_date: string | null;
        company_id: string;
        companies: {
          id: string;
          corp_name: string;
          sector: string | null;
          logo_url: string | null;
        } | null;
      } | null;
    }

    const rows = (fiData ?? []) as unknown as PortfolioRow[];

    const portfolio = rows
      .filter((r) => r.funding_rounds?.companies)
      .map((r) => ({
        fundingInvestorId: r.id,
        isLead: r.is_lead,
        roundName: r.funding_rounds!.round_name,
        amount: r.funding_rounds!.amount,
        announcedDate: r.funding_rounds!.announced_date,
        companyId: r.funding_rounds!.companies!.id,
        companyName: r.funding_rounds!.companies!.corp_name,
        companySector: r.funding_rounds!.companies!.sector,
        companyLogoUrl: r.funding_rounds!.companies!.logo_url,
      }));

    // 고유 기업 수
    const uniqueCompanies = new Set(portfolio.map((p) => p.companyId)).size;

    return {
      success: true as const,
      data: {
        ...investor,
        portfolio,
        uniqueCompanies,
        totalInvestments: portfolio.length,
      },
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 투자자 유형 목록 ---
export async function getInvestorTypes() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("investors")
      .select("investor_type");

    if (error) {
      return { success: false as const, error: error.message };
    }

    const typeCounts = (data ?? []).reduce(
      (acc: Record<string, number>, item) => {
        const t = item.investor_type ?? "기타";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      {}
    );

    const types = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true as const, data: types };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}