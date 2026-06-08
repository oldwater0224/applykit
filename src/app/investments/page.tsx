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

interface FundingRoundJoinRow {
  id: string;
  round_name: string;
  amount: number | null;
  currency: string | null;
  announced_date: string | null;
  news_url: string | null;
  company_id: string;
  companies: {
    corp_name: string;
    sector: string | null;
    industry_name: string | null;
    logo_url: string | null;
  } | null;
}

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
  const roundNames = expandRoundFilter(roundFilter);

  let data;
  let total;

  if (roundNames && roundNames.length > 1) {
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

    const rows = (rawData ?? []) as unknown as FundingRoundJoinRow[];
    data = rows.map((r) => ({
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
    total = count ?? 0;
  } else {
    const result = await getInvestments({
      round: roundNames?.[0],
      limit: PAGE_SIZE,
      offset,
    });
    data = result.data;
    total = result.total;
  }

  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      <div className="mb-1">
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          Investment & M&A
        </p>
        <h1
          className="mt-1 text-[22px] font-bold tracking-tight"
          style={{ color: "#fff" }}
        >
          투자/M&A
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--gray-500)" }}>
          국내 스타트업 투자 라운드 {total.toLocaleString()}건
        </p>
      </div>

      <div className="mb-4 mt-4">
        <Suspense fallback={null}>
          <InvestmentTabs />
        </Suspense>
      </div>

      <InvestmentTable items={data} />

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