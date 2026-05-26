"use client";

// ============================================================
// src/app/investors/[id]/page.tsx
// 투자자 상세 페이지 — 포트폴리오, 투자 이력
// ============================================================

import { useParams } from "next/navigation";
import { useInvestorDetail } from "@/src/hooks/useInvestor";
import Link from "next/link";
import { ROUND_COLORS, normalizeRoundName } from "@/src/types/funding";
// 파일 상단에 타입 추가
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

const TYPE_LABELS: Record<string, string> = {
  VC: "벤처캐피탈",
  CVC: "기업벤처캐피탈",
  PE: "사모펀드",
  Accelerator: "액셀러레이터",
  Angel: "엔젤",
  Government: "정부/공공",
};

function formatAmount(amount: number | null) {
  if (!amount) return "비공개";
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
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
        <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !investor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="mb-4 text-gray-500">투자자 정보를 불러올 수 없습니다.</p>
        <Link href="/investors" className="text-blue-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const portfolio : PortfolioItem[] = investor.portfolio ?? [];

  // 고유 기업별 그룹핑
  const companyMap = new Map<
    string,
    { companyName: string; sector: string | null; rounds: typeof portfolio }
  >();
  portfolio.forEach((p) => {
    const existing = companyMap.get(p.companyId);
    if (existing) {
      existing.rounds.push(p);
    } else {
      companyMap.set(p.companyId, {
        companyName: p.companyName,
        sector: p.companySector,
        rounds: [p],
      });
    }
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* 뒤로가기 */}
      <Link
        href="/investors"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← 투자자 목록
      </Link>

      {/* 헤더 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {investor.name}
            </h1>
            {investor.description && (
              <p className="mt-2 text-sm text-gray-500">
                {investor.description}
              </p>
            )}
          </div>
          {investor.investor_type && (
            <span className="shrink-0 rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {TYPE_LABELS[investor.investor_type] ?? investor.investor_type}
            </span>
          )}
        </div>

        {investor.homepage_url && (
          <div className="mt-4">
            <a
              href={investor.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {investor.homepage_url} →
            </a>
          </div>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-xs font-medium text-gray-500">포트폴리오</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {investor.uniqueCompanies}개사
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-xs font-medium text-gray-500">총 투자 건수</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {investor.totalInvestments}건
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-xs font-medium text-gray-500">리드 투자</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {portfolio.filter((p) => p.isLead).length}건
          </p>
        </div>
      </div>

      {/* 투자 이력 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">투자 이력</h2>

        {portfolio.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-400">등록된 투자 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4 text-left font-medium text-gray-500">
                    기업
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    분야
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    라운드
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    금액
                  </th>
                  <th className="py-3 pl-4 text-left font-medium text-gray-500">
                    날짜
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio
                  .sort((a, b) =>
                    (b.announcedDate ?? "").localeCompare(a.announcedDate ?? "")
                  )
                  .map((p) => {
                    const roundName = normalizeRoundName(p.roundName);
                    return (
                      <tr
                        key={p.fundingInvestorId}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/companies/${p.companyId}`}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                          >
                            {p.companyName}
                          </Link>
                          {p.isLead && (
                            <span className="ml-1.5 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
                              리드
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.companySector ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              ROUND_COLORS[
                                roundName as keyof typeof ROUND_COLORS
                              ] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {roundName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                          {formatAmount(p.amount)}
                        </td>
                        <td className="py-3 pl-4 text-gray-500">
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