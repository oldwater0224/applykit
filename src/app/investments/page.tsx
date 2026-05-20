/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import { getInvestments } from "@/src/app/actions/investmentAction";
import InvestmentTabs from "@/src/components/investments/investment-tabs";
import InvestmentTable from "@/src/components/investments/investment-table";
import Pagination from "@/src/components/ui/pagination";
import { createClient } from "@/src/lib/supabase/server";
import { normalizeRoundName } from "@/src/types/funding";

const PAGE_SIZE = 20;

export const metadata = {
  title: "투자/M&A — ApplyKit",
  description: "최근 스타트업 투자 현황, 라운드별 필터링",
};

// 탭 그룹 → 실제 round_name 배열로 매핑
function expandRoundFilter(round: string | undefined): string[] | undefined {
  if (!round || round === "all") return undefined;
  return round.split(",").map((r) => r.trim());
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string; page?: string }>;
}) {
  const params = await searchParams;
  const roundFilter = params.round;
  const page = Math.max(1, Number(params.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  // 탭이 복합 필터(Seed,Pre-A)인 경우 분리해서 조회
  const roundNames = expandRoundFilter(roundFilter);

  let data;
  let total;

  if (roundNames && roundNames.length > 1) {
    // 복합 필터: 여러 round_name을 OR 조건으로 조회
    const supabase = await createClient();
    const { data: rawData, count } = await supabase
      .from("funding_rounds")
      .select(
        "id, round_name, amount, currency, announced_date, news_url, company_id, companies(corp_name, sector, industry_name, logo_url)",
        { count: "exact" }
      )
      .in("round_name", roundNames)
      .order("announced_date", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    data = (rawData as any[])?.map((r) => ({
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
    })) ?? [];
    total = count ?? 0;
  } else {
    // 단일 필터 또는 전체
    const result = await getInvestments({
      round: roundNames?.[0],
      limit: PAGE_SIZE,
      offset,
    });
    data = result.data;
    total = result.total;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          투자/M&A
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          국내 스타트업 투자 라운드 {total.toLocaleString()}건
        </p>
      </div>

      {/* 탭 필터 */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <InvestmentTabs />
        </Suspense>
      </div>

      {/* 투자 목록 */}
      <InvestmentTable items={data} />

      {/* 페이지네이션 */}
      <div className="mt-6">
        <Suspense fallback={null}>
          <Pagination
            total={total}
            pageSize={PAGE_SIZE}
            basePath="/investments"
          />
        </Suspense>
      </div>
    </div>
  );
}