"use server";

// ============================================================
// src/app/actions/dashboardAction.ts
// 대시보드 통계 Server Action
// funding_rounds + companies 테이블에서 집계
// ============================================================

import { createClient } from "@/src/lib/supabase/server";
import type {
  DashboardStats,
  RoundNameCount,
  SectorInvestment,
  RecentRound,
} from "@/src/types/funding";
import { normalizeRoundName } from "@/src/types/funding";

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // 현재 연/월 기준
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const prevYearMonthStart = `${year - 1}-${String(month).padStart(2, "0")}-01`;
  const prevYearMonthEnd = `${year - 1}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, "0")}-01`;

  // 1) 전체 투자 건수 + 금액
  const { data: allRounds } = await supabase
    .from("funding_rounds")
    .select("id, round_name, amount, announced_date");

  const totalRounds = allRounds?.length ?? 0;
  const totalAmount = allRounds?.reduce((sum, r) => sum + (r.amount ?? 0), 0) ?? 0;

  // 2) 이번 달 투자
  const monthlyData = allRounds?.filter(
    (r) => r.announced_date && r.announced_date >= monthStart
  ) ?? [];
  const monthlyRounds = monthlyData.length;
  const monthlyAmount = monthlyData.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  // 3) 전년 동월 투자
  const prevYearData = allRounds?.filter(
    (r) =>
      r.announced_date &&
      r.announced_date >= prevYearMonthStart &&
      r.announced_date < prevYearMonthEnd
  ) ?? [];
  const prevYearMonthlyRounds = prevYearData.length;

  // 4) 라운드별 집계
  const roundMap = new Map<string, { count: number; amount: number }>();
  allRounds?.forEach((r) => {
    const name = normalizeRoundName(r.round_name);
    const prev = roundMap.get(name) ?? { count: 0, amount: 0 };
    roundMap.set(name, {
      count: prev.count + 1,
      amount: prev.amount + (r.amount ?? 0),
    });
  });

  const roundsByName: RoundNameCount[] = Array.from(roundMap.entries())
    .map(([roundName, { count, amount }]) => ({ roundName, count, amount }))
    .sort((a, b) => b.count - a.count);

  // 5) 업종별 집계 (companies JOIN)
  const { data: roundsWithCompany  } = await supabase
    .from("funding_rounds")
    .select("amount, companies!inner(sector, industry_name)")
    .not("companies.sector", "is", null);

  const sectorMap = new Map<string, { count: number; amount: number }>();
  (roundsWithCompany as any[])?.forEach((r) => {
    const sector = r.companies?.sector ?? r.companies?.industry_name ?? "기타";
    const prev = sectorMap.get(sector) ?? { count: 0, amount: 0 };
    sectorMap.set(sector, {
      count: prev.count + 1,
      amount: prev.amount + (r.amount ?? 0),
    });
  });

  const topSectors: SectorInvestment[] = Array.from(sectorMap.entries())
    .map(([sector, { count, amount }]) => ({ sector, count, amount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 6) 최근 투자 5건
  const { data: recentData } = await supabase
    .from("funding_rounds")
    .select("id, round_name, amount, announced_date, companies(corp_name, sector, industry_name)")
    .order("announced_date", { ascending: false })
    .limit(5);

  const recentRounds: RecentRound[] =
    (recentData as any[])?.map((r) => ({
      id: r.id,
      companyName: r.companies?.corp_name ?? "알 수 없음",
      sector: r.companies?.sector ?? r.companies?.industry_name ?? null,
      roundName: normalizeRoundName(r.round_name),
      amount: r.amount,
      announcedDate: r.announced_date ?? "",
    })) ?? [];

  return {
    totalRounds,
    totalAmount,
    monthlyRounds,
    monthlyAmount,
    prevYearMonthlyRounds,
    roundsByName,
    topSectors,
    recentRounds,
  };
}