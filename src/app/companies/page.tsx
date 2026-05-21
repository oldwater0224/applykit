"use client";

// ============================================================
// src/app/companies/page.tsx
// 기업 목록 페이지 — Day 4 고도화
// 다중 필터 + 정렬 + 검색 디바운스 + 카드 개선
// ============================================================

import { useState, useMemo, useCallback } from "react";
import {
  useCompanies,
  useCompanySectors,
  useFundingStages,
} from "@/src/hooks/useCompanies";
import Link from "next/link";
import type { Company } from "@/src/types/company";
import Pagination from "@/src/components/ui/pagination";

// 상장 구분 옵션
const CORP_CLS_OPTIONS = [
  { value: "전체", label: "전체" },
  { value: "Y", label: "유가증권" },
  { value: "K", label: "코스닥" },
  { value: "N", label: "코넥스" },
  { value: "E", label: "비상장" },
] as const;

// 정렬 옵션
const SORT_OPTIONS = [
  { value: "created_at:desc", label: "최신순" },
  { value: "corp_name:asc", label: "이름순" },
  { value: "established_date:asc", label: "설립일순" },
] as const;

// 날짜 포맷
function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

export default function CompaniesPage() {
  // 필터 상태
  const [sector, setSector] = useState("전체");
  const [fundingStage, setFundingStage] = useState("전체");
  const [corpCls, setCorpCls] = useState("전체");
  const [sort, setSort] = useState("created_at:desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // 정렬 파싱
  const [sortBy, sortOrder] = useMemo(() => {
    const [by, order] = sort.split(":");
    return [
      by as "corp_name" | "established_date" | "created_at",
      order as "asc" | "desc",
    ];
  }, [sort]);

  // 데이터 조회
  const { data: sectorsData } = useCompanySectors();
  const { data: stagesData } = useFundingStages();
  const {
    data: companiesData,
    isLoading,
    isError,
  } = useCompanies({
    sector,
    fundingStage,
    corpCls,
    search,
    page,
    pageSize: 12,
    sortBy,
    sortOrder,
  });

  const companies = companiesData?.data || [];
  const totalCount = companiesData?.totalCount || 0;
  const sectors = sectorsData || [];
  const stages = stagesData || [];

  // 검색 실행
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  // 필터 변경 헬퍼
  const resetPage = useCallback(() => setPage(1), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          스타트업 데이터베이스
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          총 {totalCount.toLocaleString()}개 기업
        </p>
      </div>

      {/* 검색 + 정렬 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 sm:max-w-md sm:flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="기업명으로 검색..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            검색
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            resetPage();
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 필터 그룹 */}
      <div className="mb-6 space-y-3">
        {/* 업종 필터 */}
        <FilterRow label="업종">
          <FilterChip
            active={sector === "전체"}
            onClick={() => {
              setSector("전체");
              resetPage();
            }}
          >
            전체
          </FilterChip>
          {sectors.map((s) => (
            <FilterChip
              key={s.name}
              active={sector === s.name}
              onClick={() => {
                setSector(s.name);
                resetPage();
              }}
            >
              {s.name} ({s.count})
            </FilterChip>
          ))}
        </FilterRow>

        {/* 투자 단계 필터 */}
        <FilterRow label="투자 단계">
          <FilterChip
            active={fundingStage === "전체"}
            onClick={() => {
              setFundingStage("전체");
              resetPage();
            }}
          >
            전체
          </FilterChip>
          {stages.map((s) => (
            <FilterChip
              key={s.name}
              active={fundingStage === s.name}
              onClick={() => {
                setFundingStage(s.name);
                resetPage();
              }}
            >
              {s.name} ({s.count})
            </FilterChip>
          ))}
        </FilterRow>

        {/* 상장 구분 필터 */}
        <FilterRow label="상장 구분">
          {CORP_CLS_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={corpCls === value}
              onClick={() => {
                setCorpCls(value);
                resetPage();
              }}
            >
              {label}
            </FilterChip>
          ))}
        </FilterRow>
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

      {/* 기업 카드 그리드 */}
      {!isLoading && !isError && (
        <>
          {companies.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
              <p className="text-sm text-gray-400">
                {search
                  ? `"${search}" 검색 결과가 없습니다.`
                  : "조건에 맞는 기업이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company: Company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="mt-8">
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

// --- 기업 카드 ---
function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
    >
      {/* 기업명 + 분야 */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">
            {company.corp_name}
          </h3>
          {company.corp_name_eng && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {company.corp_name_eng}
            </p>
          )}
        </div>
        {company.sector && (
          <span className="ml-2 shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {company.sector}
          </span>
        )}
      </div>

      {/* 기업 정보 */}
      <div className="space-y-1.5 text-sm text-gray-600">
        {company.ceo_name && (
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-gray-400">대표</span>
            <span className="truncate">{company.ceo_name}</span>
          </div>
        )}
        {company.established_date && (
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-gray-400">설립</span>
            <span>{formatDate(company.established_date)}</span>
          </div>
        )}
        {company.address && (
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-gray-400">주소</span>
            <span className="truncate">{company.address}</span>
          </div>
        )}
      </div>

      {/* 하단 뱃지 */}
      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
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
        {company.homepage_url && (
          <span className="truncate text-xs text-gray-400">
            {company.homepage_url}
          </span>
        )}
      </div>
    </Link>
  );
}

// --- 필터 행 ---
function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 w-16 shrink-0 text-xs font-medium text-gray-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// --- 필터 칩 ---
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}