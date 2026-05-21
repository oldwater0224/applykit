"use server";

// ============================================================
// src/app/actions/companyAction.ts
// 기업 데이터 조회 Server Actions — Day 4 고도화
// ============================================================

import { createClient } from "@/src/lib/supabase/server";

// --- 기업 목록 조회 (다중 필터 + 검색 + 정렬 + 페이지네이션) ---
export async function getCompanies(options?: {
  sector?: string;
  fundingStage?: string;
  corpCls?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "corp_name" | "established_date" | "created_at";
  sortOrder?: "asc" | "desc";
}) {
  try {
    const supabase = await createClient();
    const {
      sector,
      fundingStage,
      corpCls,
      search,
      page = 1,
      pageSize = 12,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options || {};

    // 투자 단계 필터가 있으면 funding_rounds JOIN 필요
    if (fundingStage && fundingStage !== "전체") {
      // funding_rounds에서 해당 라운드가 있는 company_id 목록 조회
      const { data: fundingData } = await supabase
        .from("funding_rounds")
        .select("company_id")
        .eq("round_name", fundingStage);

      const companyIds = [
        ...new Set((fundingData ?? []).map((r) => r.company_id)),
      ];

      if (companyIds.length === 0) {
        return {
          success: true as const,
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      let query = supabase
        .from("companies")
        .select("*", { count: "exact" })
        .in("id", companyIds);

      // 업종 필터
      if (sector && sector !== "전체") {
        query = query.eq("sector", sector);
      }

      // 상장 구분 필터
      if (corpCls && corpCls !== "전체") {
        query = query.eq("corp_cls", corpCls);
      }

      // 검색
      if (search && search.trim()) {
        query = query.ilike("corp_name", `%${search.trim()}%`);
      }

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return { success: false as const, error: error.message };
      }

      return {
        success: true as const,
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    }

    // 투자 단계 필터 없는 일반 조회
    let query = supabase.from("companies").select("*", { count: "exact" });

    if (sector && sector !== "전체") {
      query = query.eq("sector", sector);
    }

    if (corpCls && corpCls !== "전체") {
      query = query.eq("corp_cls", corpCls);
    }

    if (search && search.trim()) {
      query = query.ilike("corp_name", `%${search.trim()}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false as const, error: error.message };
    }

    return {
      success: true as const,
      data: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 기업 상세 조회 (기본정보 + 재무 + 공시 + 투자 라운드) ---
export async function getCompanyDetail(companyId: string) {
  try {
    const supabase = await createClient();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError) {
      return { success: false as const, error: companyError.message };
    }

    const { data: financials } = await supabase
      .from("financials")
      .select("*")
      .eq("company_id", companyId)
      .order("fiscal_year", { ascending: false });

    const { data: disclosures } = await supabase
      .from("disclosures")
      .select("*")
      .eq("company_id", companyId)
      .order("disclosure_date", { ascending: false })
      .limit(10);

    const { data: fundingRounds } = await supabase
      .from("funding_rounds")
      .select("*")
      .eq("company_id", companyId)
      .order("announced_date", { ascending: false });

    return {
      success: true as const,
      data: {
        ...company,
        financials: financials || [],
        disclosures: disclosures || [],
        fundingRounds: fundingRounds || [],
      },
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 업종 목록 조회 ---
export async function getCompanySectors() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("companies")
      .select("sector")
      .not("sector", "is", null);

    if (error) {
      return { success: false as const, error: error.message };
    }

    const sectorCounts = (data || []).reduce(
      (acc: Record<string, number>, item) => {
        const s = item.sector || "기타";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {}
    );

    const sectors = Object.entries(sectorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true as const, data: sectors };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 투자 단계 목록 조회 (필터용) ---
export async function getFundingStages() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("funding_rounds")
      .select("round_name");

    if (error) {
      return { success: false as const, error: error.message };
    }

    const stageCounts = (data || []).reduce(
      (acc: Record<string, number>, item) => {
        const s = item.round_name;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {}
    );

    const stages = Object.entries(stageCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true as const, data: stages };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}