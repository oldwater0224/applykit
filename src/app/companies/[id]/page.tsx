// ============================================================
// src/app/companies/[id]/page.tsx
// 기업 상세 페이지
// ============================================================

'use client';

import { useParams } from 'next/navigation';
import { useCompanyDetail } from '@/src/hooks/useCompanies';
import Link from 'next/link';

// 금액 포맷 (억 단위, 부호 포함)
function formatBillion(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  const billion = amount / 100000000;
  if (Math.abs(billion) >= 10000) {
    return `${(billion / 10000).toFixed(1)}조`;
  }
  return `${Math.round(billion).toLocaleString()}억`;
}

// 날짜 포맷
function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 전년 대비 증감률
function calcGrowthRate(current: number | null, previous: number | null): string | null {
  if (!current || !previous || previous === 0) return null;
  const rate = ((current - previous) / Math.abs(previous)) * 100;
  return rate > 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const { data: company, isLoading, isError } = useCompanyDetail(companyId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">기업 정보를 불러올 수 없습니다.</p>
        <Link href="/companies" className="text-blue-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const financials = company.financials || [];
  const disclosures = company.disclosures || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <Link
        href="/companies"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        ← 기업 목록
      </Link>

      {/* 기업 헤더 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {company.corp_name}
            </h1>
            {company.corp_name_eng && (
              <p className="text-sm text-gray-400 mt-1">
                {company.corp_name_eng}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 text-sm rounded-md font-medium
                ${company.corp_cls === 'Y'
                  ? 'bg-green-50 text-green-700'
                  : company.corp_cls === 'K'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-gray-50 text-gray-600'
                }`}
            >
              {company.corp_cls === 'Y'
                ? '유가증권'
                : company.corp_cls === 'K'
                ? '코스닥'
                : company.corp_cls === 'N'
                ? '코넥스'
                : '비상장'}
            </span>
            {company.sector && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md font-medium">
                {company.sector}
              </span>
            )}
          </div>
        </div>

        {/* 기본정보 그리드 */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <InfoItem label="대표자" value={company.ceo_name} />
          <InfoItem label="설립일" value={formatDate(company.established_date)} />
          <InfoItem label="주소" value={company.address} span2 />
          <InfoItem label="사업자번호" value={company.bizr_no} />
          <InfoItem label="업종" value={company.industry_name || company.industry_code} />
          {company.homepage_url && (
            <InfoItem label="홈페이지">
              <a
                href={
                  company.homepage_url.startsWith('http')
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
      </div>

      {/* 재무제표 */}
      {financials.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">재무제표</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 pr-4 text-gray-500 font-medium">연도</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">매출액</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">영업이익</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">순이익</th>
                  <th className="text-right py-3 pl-4 text-gray-500 font-medium">자산총계</th>
                </tr>
              </thead>
              <tbody>
                {financials.map((f: any, i: number) => {
                  const prev = financials[i + 1]; // 이전 연도
                  const revenueGrowth = prev
                    ? calcGrowthRate(f.revenue, prev.revenue)
                    : null;

                  return (
                    <tr key={f.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {f.fiscal_year}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        <div>{formatBillion(f.revenue)}</div>
                        {revenueGrowth && (
                          <div
                            className={`text-xs mt-0.5 ${
                              revenueGrowth.startsWith('+')
                                ? 'text-red-500'
                                : 'text-blue-500'
                            }`}
                          >
                            {revenueGrowth}
                          </div>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          f.operating_income && f.operating_income < 0
                            ? 'text-blue-500'
                            : 'text-gray-700'
                        }`}
                      >
                        {formatBillion(f.operating_income)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          f.net_income && f.net_income < 0
                            ? 'text-blue-500'
                            : 'text-gray-700'
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
        </div>
      )}

      {/* 공시 내역 */}
      {disclosures.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 공시</h2>
          <div className="space-y-3">
            {disclosures.map((d: any) => (
              <a
                key={d.id}
                href={d.dart_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                  {formatDate(d.disclosure_date)}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                  {d.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 정보 아이템 컴포넌트
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
    <div className={span2 ? 'col-span-2' : ''}>
      <span className="text-gray-400">{label}</span>
      <div className="text-gray-900 mt-0.5">
        {children || value}
      </div>
    </div>
  );
}