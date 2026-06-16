"use client";

import { useParams } from "next/navigation";
import { useCompanyDetail } from "@/src/hooks/useCompanies";
import Link from "next/link";
import { useState } from "react";
import type { Disclosure, Financial } from "@/src/types/company";
import type { FundingRound } from "@/src/types/funding";
import FundingTimeline from "@/src/components/companies/funding-timeline";
import FinancialChart from "@/src/components/companies/financial-chart";
import { TabList } from "@/src/components/ui/tabs";

function formatBillion(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  const billion = amount / 100000000;
  if (Math.abs(billion) >= 10000) return `${(billion / 10000).toFixed(1)}조`;
  return `${Math.round(billion).toLocaleString()}억`;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calcGrowthRate(
  current: number | null,
  previous: number | null,
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
        <div
          className="size-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="mb-4 text-[13px]" style={{ color: "var(--gray-500)" }}>
          기업 정보를 불러올 수 없습니다.
        </p>
        <Link
          href="/companies"
          style={{ color: "var(--brand-600)" }}
          className="text-[13px] hover:underline"
        >
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

  const clsLabel =
    company.corp_cls === "Y"
      ? "유가증권"
      : company.corp_cls === "K"
        ? "코스닥"
        : company.corp_cls === "N"
          ? "코넥스"
          : "비상장";
  const clsColor =
    company.corp_cls === "Y"
      ? "var(--accent-emerald)"
      : company.corp_cls === "K"
        ? "var(--round-series-c)"
        : company.corp_cls === "N"
          ? "var(--accent-amber)"
          : "var(--gray-400)";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link
        href="/companies"
        className="mb-4 inline-flex items-center text-[12px] transition"
        style={{ color: "var(--gray-400)" }}
      >
        ← 스타트업 목록
      </Link>

      {/* 기업 헤더 */}
      <div
        className="mb-5 rounded-lg border p-5"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-[20px] font-bold"
              style={{ color: "var(--gray-100)" }}
            >
              {company.corp_name}
            </h1>
            {company.corp_name_eng && (
              <p
                className="mt-0.5 text-[12px]"
                style={{ color: "var(--gray-300)" }}
              >
                {company.corp_name_eng}
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
              style={{
                color: clsColor,
                backgroundColor: `color-mix(in srgb, ${clsColor} 10%)`,
              }}
            >
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: clsColor }}
              />
              {clsLabel}
            </span>
            {company.sector && (
              <span
                className="rounded px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "", color: "var(--brand-700)" }}
              >
                {company.sector}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
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
                className="hover:underline"
                style={{ color: "var(--brand-600)" }}
              >
                {company.homepage_url}
              </a>
            </InfoItem>
          )}
        </div>

        {/* <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--gray-100)" }}>
          <Link
            href={`/programs?company=${companyId}`}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-medium text-white transition"
            style={{ backgroundColor: "var(--brand-600)" }}
          >
            이 기업에 지원하기
          </Link>
        </div> */}
      </div>

      {/* 투자 요약 */}
      {fundingRounds.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <SummaryCard label="총 라운드" value={`${fundingRounds.length}회`} />
          <SummaryCard
            label="누적 투자금"
            value={formatTotalFunding(fundingRounds)}
          />
          <SummaryCard
            label="최근 라운드"
            value={fundingRounds[0]?.round_name ?? "—"}
          />
        </div>
      )}

      {/* 탭 */}
      <div className="mb-4">
        <TabList tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* 탭 콘텐츠 */}
      <div
        className="rounded-lg border p-5"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        {activeTab === "investment" && (
          <FundingTimeline rounds={fundingRounds} />
        )}

        {activeTab === "financial" && (
          <>
            {financials.length > 0 ? (
              <>
                <div className="mb-5">
                  <h3
                    className="mb-2 text-[11px] font-medium uppercase tracking-wide"
                    style={{ color: "var(--gray-400)" }}
                  >
                    연도별 추이
                  </h3>
                  <FinancialChart financials={financials} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--gray-200)" }}>
                        <th
                          className="py-2 pr-3 text-left font-medium"
                          style={{ color: "var(--gray-100)" }}
                        >
                          연도
                        </th>
                        <th
                          className="px-3 py-2 text-right font-medium"
                          style={{ color: "var(--gray-100)" }}
                        >
                          매출액
                        </th>
                        <th
                          className="px-3 py-2 text-right font-medium"
                          style={{ color: "var(--gray-100)" }}
                        >
                          영업이익
                        </th>
                        <th
                          className="px-3 py-2 text-right font-medium"
                          style={{ color: "var(--gray-100)" }}
                        >
                          순이익
                        </th>
                        <th
                          className="py-2 pl-3 text-right font-medium"
                          style={{ color: "var(--gray-100)" }}
                        >
                          자산총계
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.map((f: Financial, i: number) => {
                        const prev = financials[i + 1];
                        const growth = prev
                          ? calcGrowthRate(f.revenue, prev.revenue)
                          : null;
                        return (
                          <tr
                            key={f.id}
                            style={{ borderBottom: "1px solid var(--gray-50)" }}
                          >
                            <td
                              className="py-2 pr-3 font-medium"
                              style={{ color: "var(--gray-300)" }}
                            >
                              {f.fiscal_year}
                            </td>
                            <td
                              className="px-3 py-2 text-right"
                              style={{ color: "var(--gray-300)" }}
                            >
                              {growth && (
                                <span
                                  className="ml-1 text-[10px] mr-1"
                                  style={{
                                    color: growth.startsWith("+")
                                      ? "var(--accent-rose)"
                                      : "var(--brand-500)",
                                  }}
                                >
                                  {growth}
                                </span>
                              )}
                              {formatBillion(f.revenue)}
                            </td>
                            <td
                              className="px-3 py-2 text-right"
                              style={{
                                color:
                                  f.operating_income && f.operating_income < 0
                                    ? "var(--brand-500)"
                                    : "var(--gray-300)",
                              }}
                            >
                              {formatBillion(f.operating_income)}
                            </td>
                            <td
                              className="px-3 py-2 text-right"
                              style={{
                                color:
                                  f.net_income && f.net_income < 0
                                    ? "var(--brand-500)"
                                    : "var(--gray-300)",
                              }}
                            >
                              {formatBillion(f.net_income)}
                            </td>
                            <td
                              className="py-2 pl-3 text-right"
                              style={{ color: "var(--gray-300)" }}
                            >
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
              <EmptyBlock message="등록된 재무제표가 없습니다" />
            )}
          </>
        )}

        {activeTab === "disclosure" && (
          <>
            {disclosures.length > 0 ? (
              <div className="space-y-0.5">
                {disclosures.map((d: Disclosure) => (
                  <a
                    key={d.id}
                    href={d.dart_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-md px-2 py-2 transition "
                  >
                    <span
                      className="mt-0.5 shrink-0 whitespace-nowrap text-[11px] tabular-nums"
                      style={{ color: "var(--gray-300)" }}
                    >
                      {formatDate(d.disclosure_date)}
                    </span>
                    <span
                      className="text-[12px] transition group-hover:underline"
                      style={{ color: "var(--gray-500)" }}
                    >
                      {d.title}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyBlock message="등록된 공시가 없습니다" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-3 text-center"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <p
        className="text-[10px] font-medium uppercase tracking-wide"
        style={{ color: "var(--gray-200)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-[15px] font-bold"
        style={{ color: "var(--gray-100)" }}
      >
        {value}
      </p>
    </div>
  );
}

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
      <span style={{ color: "var(--gray-200)" }}>{label}</span>
      <div className="mt-0.5" style={{ color: "var(--gray-100)" }}>
        {children || value}
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
        {message}
      </p>
    </div>
  );
}

function formatTotalFunding(rounds: FundingRound[]): string {
  const total = rounds.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  if (total === 0) return "비공개";
  if (total >= 10000) return `${(total / 10000).toFixed(1)}조`;
  return `${total.toLocaleString()}억`;
}
