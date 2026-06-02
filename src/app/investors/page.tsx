"use client";

// ============================================================
// src/app/investors/page.tsx
// 투자자 목록 페이지
// ============================================================

import { useState } from "react";
import { useInvestors, useInvestorTypes } from "@/src/hooks/useInvestor";
import Link from "next/link";
import Pagination from "@/src/components/ui/pagination";

// 투자자 유형 라벨
const TYPE_LABELS: Record<string, string> = {
  VC: "벤처캐피탈",
  CVC: "기업벤처캐피탈",
  PE: "사모펀드",
  Accelerator: "액셀러레이터",
  Angel: "엔젤",
  Government: "정부/공공",
};

function getTypeLabel(type: string | null) {
  if (!type) return "기타";
  return TYPE_LABELS[type] ?? type;
}

const TYPE_COLORS: Record<string, string> = {
  VC: "bg-blue-50 text-blue-700",
  CVC: "bg-purple-50 text-purple-700",
  PE: "bg-amber-50 text-amber-700",
  Accelerator: "bg-emerald-50 text-emerald-700",
  Angel: "bg-pink-50 text-pink-700",
  Government: "bg-gray-100 text-gray-700",
};

export default function InvestorsPage() {
  const [type, setType] = useState("전체");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const { data: typesData } = useInvestorTypes();
  const { data: investorsData, isLoading, isError } = useInvestors({
    type,
    search,
    page,
    pageSize: 20,
  });

  const investors = investorsData?.data ?? [];
  const totalCount = investorsData?.totalCount ?? 0;
  const types = typesData ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          투자자
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          VC · 액셀러레이터 · CVC {totalCount.toLocaleString()}곳
        </p>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2 sm:max-w-md">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="투자자명으로 검색..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-white text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          검색
        </button>
      </form>

      {/* 유형 필터 */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <button
          onClick={() => { setType("전체"); setPage(1); }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            type === "전체"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {types.map((t) => (
          <button
            key={t.name}
            onClick={() => { setType(t.name); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === t.name
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {getTypeLabel(t.name)} ({t.count})
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* 에러 */}
      {isError && (
        <div className="py-20 text-center text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 투자자 목록 */}
      {!isLoading && !isError && (
        <>
          {investors.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
              <p className="text-sm text-gray-400">
                {search ? `"${search}" 검색 결과가 없습니다.` : "등록된 투자자가 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {investors.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/investors/${inv.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{inv.name}</h3>
                    {inv.investor_type && (
                      <span
                        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                          TYPE_COLORS[inv.investor_type] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getTypeLabel(inv.investor_type)}
                      </span>
                    )}
                  </div>

                  {inv.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                      {inv.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="text-gray-500">
                      투자 {inv.investmentCount}건
                    </span>
                    {inv.homepage_url && (
                      <span className="truncate text-xs text-gray-400">
                        {inv.homepage_url.replace(/^https?:\/\//, "")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              total={totalCount}
              pageSize={20}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}