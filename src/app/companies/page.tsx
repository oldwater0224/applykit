// ============================================================
// src/app/companies/page.tsx
// 기업 목록 페이지 (TheVC 스타일)
// ============================================================

"use client";

import { useState } from "react";
import { useCompanies, useCompanySectors } from "@/src/hooks/useCompanies";
import Link from "next/link";
import type { Company } from "@/src/types/company";
import Pagination from "@/src/components/ui/pagination";

// 금액 포맷 (억 단위)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatBillion(amount: number | null): string {
  if (!amount) return "-";
  const billion = Math.round(amount / 100000000);
  return `${billion.toLocaleString()}억`;
}

// 날짜 포맷
function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

export default function CompaniesPage() {
  const [sector, setSector] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // 데이터 조회
  const { data: sectorsData } = useCompanySectors();
  const {
    data: companiesData,
    isLoading,
    isError,
  } = useCompanies({
    sector,
    search,
    page,
    pageSize: 12,
  });

  const companies = companiesData?.data || [];
  const totalPages = companiesData?.totalPages || 1;
  const totalCount = companiesData?.totalCount || 0;
  const sectors = sectorsData || [];

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // 업종 필터 변경
  const handleSectorChange = (newSector: string) => {
    setSector(newSector);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">기업 데이터베이스</h1>
        <p className="text-gray-500 mt-1">
          총 {totalCount.toLocaleString()}개 기업
        </p>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="기업명으로 검색..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-sm"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            검색
          </button>
        </div>
      </form>

      {/* 업종 필터 탭 */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => handleSectorChange("전체")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${
              sector === "전체"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          전체
        </button>
        {sectors.map((s) => (
          <button
            key={s.name}
            onClick={() => handleSectorChange(s.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                sector === s.name
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {s.name} ({s.count})
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 에러 */}
      {isError && (
        <div className="text-center py-20 text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 기업 카드 그리드 */}
      {!isLoading && !isError && (
        <>
          {companies.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              {search
                ? `"${search}" 검색 결과가 없습니다.`
                : "등록된 기업이 없습니다."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company: Company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="block p-5 border border-gray-200 rounded-xl
                             hover:border-blue-300 hover:shadow-md transition-all
                             bg-white"
                >
                  {/* 기업명 + 분야 태그 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {company.corp_name}
                      </h3>
                      {company.corp_name_eng && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {company.corp_name_eng}
                        </p>
                      )}
                    </div>
                    {company.sector && (
                      <span className="ml-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium whitespace-nowrap">
                        {company.sector}
                      </span>
                    )}
                  </div>

                  {/* 기업 정보 */}
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {company.ceo_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14 shrink-0">
                          대표
                        </span>
                        <span className="truncate">{company.ceo_name}</span>
                      </div>
                    )}
                    {company.established_date && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14 shrink-0">
                          설립
                        </span>
                        <span>{formatDate(company.established_date)}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14 shrink-0">
                          주소
                        </span>
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                  </div>

                  {/* 상장 구분 뱃지 */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-medium
                        ${
                          company.corp_cls === "Y"
                            ? "bg-green-50 text-green-700"
                            : company.corp_cls === "K"
                              ? "bg-purple-50 text-purple-700"
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
                    {company.homepage_url && (
                      <span className="text-xs text-gray-400 truncate">
                        {company.homepage_url}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="mt-5">
          <Pagination 
            total={totalCount}
            pageSize={12}
            currentPage={page}
            onPageChange={setPage}
            
            
          />
          </div>
        </>
      )}
    </div>
  );
}
