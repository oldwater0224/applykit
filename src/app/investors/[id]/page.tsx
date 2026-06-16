"use client";

import { useParams } from "next/navigation";
import { useInvestorDetail } from "@/src/hooks/useInvestor";
import Link from "next/link";
import { normalizeRoundName } from "@/src/types/funding";


const TYPE_LABELS: Record<string, string> = {
  VC: "벤처캐피탈", CVC: "기업벤처캐피탈", PE: "사모펀드",
  Accelerator: "액셀러레이터", Angel: "엔젤", Government: "정부/공공",
};

// app/investors/page.tsx의 TYPE_COLORS(text-*-700)에 대응하는 색상 값
const TYPE_COLORS: Record<string, string> = {
  VC: "#1d4ed8", // text-blue-700
  CVC: "#7e22ce", // text-purple-700
  PE: "#b45309", // text-amber-700
  Accelerator: "#047857", // text-emerald-700
  Angel: "#be185d", // text-pink-700
  Government: "#6b7280", // text-gray-500
};

const ROUND_DOT_COLORS: Record<string, string> = {
  Seed: "var(--round-seed)", "Pre-A": "var(--round-pre-a)",
  "Series A": "var(--round-series-a)", "Series B": "var(--round-series-b)",
  "Series C": "var(--round-series-c)", "Series D": "var(--round-series-d)",
  "Pre-IPO": "var(--round-pre-ipo)", IPO: "var(--round-ipo)", "M&A": "var(--round-ma)",
};

interface PortfolioItem {
  fundingInvestorId: string;
  isLead: boolean;
  roundName: string;
  amount: number | null;
  announcedDate: string | null;
  companyId: string;
  companyName: string;
  companySector: string | null;
  companyLogoUrl: string | null;
}

function formatAmount(amount: number | null) {
  if (!amount) return "비공개";
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InvestorDetailPage() {
  const params = useParams();
  const investorId = params.id as string;
  const { data: investor, isLoading, isError } = useInvestorDetail(investorId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--brand-500)" }} />
      </div>
    );
  }

  if (isError || !investor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="mb-4 text-[13px]" style={{ color: "var(--gray-500)" }}>투자자 정보를 불러올 수 없습니다.</p>
        <Link href="/investors" style={{ color: "var(--brand-600)" }} className="text-[13px] hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  const portfolio: PortfolioItem[] = investor.portfolio ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link href="/investors" className="mb-4 inline-flex items-center text-[12px] transition" style={{ color: "var(--gray-400)" }}>
        ← 투자자 목록
      </Link>

      {/* 헤더 */}
      <div className="mb-5 rounded-lg border p-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--gray-100)" }}>{investor.name}</h1>
            {investor.description && (
              <p className="mt-1 text-[12px]" style={{ color: "var(--gray-500)" }}>{investor.description}</p>
            )}
          </div>
          {investor.investor_type && (
            <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium" style={{  color: TYPE_COLORS[investor.investor_type] ?? "var(--gray-500)" }}>
              {TYPE_LABELS[investor.investor_type] ?? investor.investor_type}
            </span>
          )}
        </div>
        {investor.homepage_url && (
          <div className="mt-3">
            <a href={investor.homepage_url} target="_blank" rel="noopener noreferrer" className="text-[12px] hover:underline" style={{ color: "var(--brand-600)" }}>
              {investor.homepage_url} →
            </a>
          </div>
        )}
      </div>

      {/* 요약 */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="포트폴리오" value={`${investor.uniqueCompanies}개사`} />
        <StatCard label="총 투자 건수" value={`${investor.totalInvestments}건`} />
        <StatCard label="리드 투자" value={`${portfolio.filter((p) => p.isLead).length}건`} />
      </div>

      {/* 투자 이력 테이블 */}
      <div className="rounded-lg border p-5" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h2 className="mb-3 text-[13px] font-semibold" style={{ color: "var(--gray-300)" }}>투자 이력</h2>

        {portfolio.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>등록된 투자 이력이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <th className="py-2 pr-3 text-left font-medium" style={{ color: "var(--gray-400)" }}>기업</th>
                  <th className="hidden px-3 py-2 text-left font-medium sm:table-cell" style={{ color: "var(--gray-400)" }}>분야</th>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: "var(--gray-400)" }}>라운드</th>
                  <th className="px-3 py-2 text-right font-medium" style={{ color: "var(--gray-400)" }}>금액</th>
                  <th className="py-2 pl-3 text-left font-medium" style={{ color: "var(--gray-400)" }}>날짜</th>
                </tr>
              </thead>
              <tbody>
                {portfolio
                  .sort((a, b) => (b.announcedDate ?? "").localeCompare(a.announcedDate ?? ""))
                  .map((p) => {
                    const roundName = normalizeRoundName(p.roundName);
                    const dotColor = ROUND_DOT_COLORS[roundName] ?? "var(--gray-400)";
                    return (
                      <tr key={p.fundingInvestorId} style={{ borderBottom: "1px solid var(--gray-50)" }}>
                        <td className="py-2 pr-3">
                          <Link href={`/companies/${p.companyId}`} className="font-medium transition hover:underline" style={{ color: "var(--gray-100)" }}>
                            {p.companyName}
                          </Link>
                          {p.isLead && (
                            <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-medium" style={{ backgroundColor: "var(--accent-amber)", color: "#ffffff" }}>
                              리드
                            </span>
                          )}
                        </td>
                        <td className="hidden px-3 py-2 sm:table-cell" style={{ color: "var(--gray-500)" }}>
                          {p.companySector ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--gray-700)" }}>
                            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                            {roundName}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: "var(--gray-800)" }}>
                          {formatAmount(p.amount)}
                        </td>
                        <td className="py-2 pl-3 tabular-nums" style={{ color: "var(--gray-400)" }}>
                          {formatDate(p.announcedDate)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 text-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gray-100)" }}>{label}</p>
      <p className="mt-1 text-[15px] font-bold" style={{ color: "var(--gray-300)" }}>{value}</p>
    </div>
  );
}