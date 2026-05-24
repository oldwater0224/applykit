"use client";

// ============================================================
// src/app/companies/[id]/page.tsx
// 기업 상세 페이지 — Day 5 고도화
// 투자 이력 타임라인 + 재무 차트 + 탭 분리 + 지원 버튼
// ============================================================

import { useParams } from "next/navigation";
import { useCompanyDetail } from "@/src/hooks/useCompanies";
import Link from "next/link";
import { useState } from "react";
import type { Disclosure, Financial } from "@/src/types/company";
import type { FundingRound } from "@/src/types/funding";
import FundingTimeline from "@/src/components/companies/funding-timeline";
import FinancialChart from "@/src/components/companies/financial-chart";
import { TabList } from "@/src/components/ui/tabs";

// 금액 포맷
function formatBillion(amount: number | null): string {
  if (amount === null || amount === undefined) return "-";
  const billion = amount / 100000000;
  if (Math.abs(billion) >= 10000) return `${(billion / 10000).toFixed(1)}조`;
  return `${Math.round(billion).toLocaleString()}억`;
}

// 날짜 포맷
function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 전년 대비 증감률
function calcGrowthRate(
  current: number | null,
  previous: number | null
): string | null {
  if (!current || !previous || previous === 0) return null;
  const rate = ((current - previous) / Math.abs(previous)) * 100;
  return rate > 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const { data: company, isLoading, isError } = useCompanyDetail(companyId);
  const [activeTab, setActiveTab] = useState("investment");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="mb-4 text-gray-500">기업 정보를 불러올 수 없습니다.</p>
        <Link href="/companies" className="text-blue-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const financials: Financial[] = company.financials || [];
  const disclosures: Disclosure[] = company.disclosures || [];
  const fundingRounds: FundingRound[] = company.fundingRounds || [];

  const tabs = [
    { id: "investment", label: "투자 이력", count: fundingRounds.length },
    { id: "financial", label: "재무제표", count: financials.length },
    { id: "disclosure", label: "공시", count: disclosures.length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* 뒤로가기 */}
      <Link
        href="/companies"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← 기업 목록
      </Link>

      {/* 기업 헤더 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {company.corp_name}
            </h1>
            {company.corp_name_eng && (
              <p className="mt-1 text-sm text-gray-400">
                {company.corp_name_eng}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                company.corp_cls === "Y"
                  ? "bg-green-50 text-green-700"
                  : company.corp_cls === "K"
                    ? "bg-purple-50 text-purple-700"
                    : company.corp_cls === "N"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-50 text-gray-600"
              }`}
            >
              {company.corp_cls === "Y"
                ? "유가증권"
                : company.corp_cls === "K"
                  ? "코스닥"
                  : company.corp_cls === "N"
                    ? "코넥스"
                    : "비상장"}
            </span>
            {company.sector && (
              <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {company.sector}
              </span>
            )}
          </div>
        </div>

        {/* 기본정보 그리드 */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <InfoItem label="대표자" value={company.ceo_name} />
          <InfoItem
            label="설립일"
            value={formatDate(company.established_date)}
          />
          <InfoItem label="주소" value={company.address} span2 />
          <InfoItem label="사업자번호" value={company.bizr_no} />
          <InfoItem
            label="업종"
            value={company.industry_name || company.industry_code}
          />
          {company.homepage_url && (
            <InfoItem label="홈페이지">
              <a
                href={
                  company.homepage_url.startsWith("http")
                    ? company.homepage_url
                    : `https://${company.homepage_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {company.homepage_url}
              </a>
            </InfoItem>
          )}
          {company.phone && <InfoItem label="전화" value={company.phone} />}
        </div>

        {/* 지원하기 버튼 */}
        {/* <div className="mt-6 border-t border-gray-100 pt-4">
          <Link
            href={`/programs?company=${companyId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <ApplyIcon />
            이 기업에 지원하기
          </Link>
        </div> */}
      </div>

      {/* 투자 요약 카드 (투자 이력 있을 때만) */}
      {fundingRounds.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <SummaryCard
            label="총 투자 라운드"
            value={`${fundingRounds.length}회`}
          />
          <SummaryCard
            label="누적 투자금"
            value={formatTotalAmount(fundingRounds)}
          />
          <SummaryCard
            label="최근 라운드"
            value={fundingRounds[0]?.round_name ?? "-"}
          />
        </div>
      )}

      {/* 탭 */}
      <div className="mb-4">
        <TabList tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {activeTab === "investment" && (
          <FundingTimeline rounds={fundingRounds} />
        )}

        {activeTab === "financial" && (
          <div>
            {financials.length > 0 ? (
              <>
                {/* 차트 */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-gray-500">
                    연도별 추이
                  </h3>
                  <FinancialChart financials={financials} />
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 pr-4 text-left font-medium text-gray-500">
                          연도
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                          매출액
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                          영업이익
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">
                          순이익
                        </th>
                        <th className="py-3 pl-4 text-right font-medium text-gray-500">
                          자산총계
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.map((f: Financial, i: number) => {
                        const prev = financials[i + 1];
                        const revenueGrowth = prev
                          ? calcGrowthRate(f.revenue, prev.revenue)
                          : null;

                        return (
                          <tr
                            key={f.id}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-3 pr-4 font-medium text-gray-900">
                              {f.fiscal_year}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              <div>{formatBillion(f.revenue)}</div>
                              {revenueGrowth && (
                                <div
                                  className={`mt-0.5 text-xs ${
                                    revenueGrowth.startsWith("+")
                                      ? "text-red-500"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {revenueGrowth}
                                </div>
                              )}
                            </td>
                            <td
                              className={`px-4 py-3 text-right ${
                                f.operating_income && f.operating_income < 0
                                  ? "text-blue-500"
                                  : "text-gray-700"
                              }`}
                            >
                              {formatBillion(f.operating_income)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right ${
                                f.net_income && f.net_income < 0
                                  ? "text-blue-500"
                                  : "text-gray-700"
                              }`}
                            >
                              {formatBillion(f.net_income)}
                            </td>
                            <td className="py-3 pl-4 text-right text-gray-700">
                              {formatBillion(f.total_assets)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState message="등록된 재무제표가 없습니다." />
            )}
          </div>
        )}

        {activeTab === "disclosure" && (
          <div>
            {disclosures.length > 0 ? (
              <div className="space-y-2">
                {disclosures.map((d: Disclosure) => (
                  <a
                    key={d.id}
                    href={d.dart_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                  >
                    <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs text-gray-400">
                      {formatDate(d.disclosure_date)}
                    </span>
                    <span className="text-sm text-gray-700 transition-colors group-hover:text-blue-600">
                      {d.title}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState message="등록된 공시가 없습니다." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 요약 카드 ---
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

// --- 정보 아이템 ---
function InfoItem({
  label,
  value,
  span2,
  children,
}: {
  label: string;
  value?: string | null;
  span2?: boolean;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <span className="text-gray-400">{label}</span>
      <div className="mt-0.5 text-gray-900">{children || value}</div>
    </div>
  );
}

// --- 빈 상태 ---
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// --- 아이콘 ---
// function ApplyIcon() {
//   return (
//     <svg
//       width="16"
//       height="16"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//       <polyline points="14 2 14 8 20 8" />
//       <line x1="12" y1="18" x2="12" y2="12" />
//       <line x1="9" y1="15" x2="15" y2="15" />
//     </svg>
//   );
// }

// --- 누적 투자금 계산 ---
function formatTotalAmount(rounds: FundingRound[]): string {
  const total = rounds.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  if (total === 0) return "비공개";
  if (total >= 10000) return `${(total / 10000).toFixed(1)}조`;
  return `${total.toLocaleString()}억`;
}