"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useCompanies,
  useCompanySectors,
  useFundingStages,
} from "@/src/hooks/useCompanies";
import Link from "next/link";
import type { Company } from "@/src/types/company";
import Pagination from "@/src/components/ui/pagination";

const CORP_CLS_OPTIONS = [
  { value: "전체", label: "전체" },
  { value: "Y", label: "유가증권" },
  { value: "K", label: "코스닥" },
  { value: "N", label: "코넥스" },
  { value: "E", label: "비상장" },
] as const;

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "최신순" },
  { value: "corp_name:asc", label: "이름순" },
  { value: "established_date:asc", label: "설립일순" },
] as const;

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
  });
}

export default function CompaniesPage() {
  const [sector, setSector] = useState("전체");
  const [fundingStage, setFundingStage] = useState("전체");
  const [corpCls, setCorpCls] = useState("전체");
  const [sort, setSort] = useState("created_at:desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [sortBy, sortOrder] = useMemo(() => {
    const [by, order] = sort.split(":");
    return [by as "corp_name" | "established_date" | "created_at", order as "asc" | "desc"];
  }, [sort]);

  const { data: sectorsData } = useCompanySectors();
  const { data: stagesData } = useFundingStages();
  const { data: companiesData, isLoading, isError } = useCompanies({
    sector, fundingStage, corpCls, search, page, pageSize: 12, sortBy, sortOrder,
  });

  const companies = companiesData?.data || [];
  const totalCount = companiesData?.totalCount || 0;
  const sectors = sectorsData || [];
  const stages = stagesData || [];

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const resetPage = useCallback(() => setPage(1), []);

  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      {/* 헤더 */}
      <div className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
          Startups
        </p>
        <h1 className="mt-1 text-[22px] font-bold tracking-tight" style={{ color: "#fff" }}>
          스타트업
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--gray-500)" }}>
          총 {totalCount.toLocaleString()}개 기업
        </p>
      </div>

      {/* 검색 + 정렬 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 sm:max-w-sm sm:flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="기업명으로 검색..."
            className="flex-1 rounded-md border px-3 py-1.5 text-[13px] outline-none transition focus:ring-2 text-gray-100"
            style={{
              
              backgroundColor: "var(--card-bg)",
            }}
          />
          <button
            type="submit"
            className="rounded-md px-4 py-1.5 text-[12px] font-medium text-white transition"
            style={{ backgroundColor: "var(--brand-600)" }}
          >
            검색
          </button>
        </form>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); resetPage(); }}
          className="rounded-md border px-2.5 py-1.5 text-[12px] outline-none"
          style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)" }}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* 필터 */}
      <div className="mb-5 space-y-2">
        <FilterRow label="업종">
          <Chip active={sector === "전체"} onClick={() => { setSector("전체"); resetPage(); }}>전체</Chip>
          {sectors.map((s) => (
            <Chip key={s.name} active={sector === s.name} onClick={() => { setSector(s.name); resetPage(); }}>
              {s.name} <span style={{ color: "var(--gray-400)" }}>({s.count})</span>
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="투자 단계">
          <Chip active={fundingStage === "전체"} onClick={() => { setFundingStage("전체"); resetPage(); }}>전체</Chip>
          {stages.map((s) => (
            <Chip key={s.name} active={fundingStage === s.name} onClick={() => { setFundingStage(s.name); resetPage(); }}>
              {s.name}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="상장">
          {CORP_CLS_OPTIONS.map(({ value, label }) => (
            <Chip key={value} active={corpCls === value} onClick={() => { setCorpCls(value); resetPage(); }}>
              {label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      {/* 로딩/에러 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--brand-500)" }} />
        </div>
      )}
      {isError && (
        <div className="py-20 text-center text-[13px]" style={{ color: "var(--accent-rose)" }}>
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 카드 그리드 */}
      {!isLoading && !isError && (
        <>
          {companies.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed" style={{ borderColor: "var(--gray-300)" }}>
              <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
                {search ? `"${search}" 검색 결과가 없습니다.` : "조건에 맞는 기업이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company: Company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
          <div className="mt-6">
            <Pagination total={totalCount} pageSize={12} currentPage={page} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const clsLabel =
    company.corp_cls === "Y" ? "유가증권" :
    company.corp_cls === "K" ? "코스닥" :
    company.corp_cls === "N" ? "코넥스" : "비상장";
  const clsColor =
    company.corp_cls === "Y" ? "var(--accent-emerald)" :
    company.corp_cls === "K" ? "var(--round-series-c)" :
    company.corp_cls === "N" ? "var(--accent-amber)" : "var(--gray-400)";

  return (
    <Link
      href={`/companies/${company.id}`}
      className="block rounded-lg border p-4 transition-all hover:shadow-md"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold" style={{ color: "var(--gray-100)" }}>
            {company.corp_name}
          </h3>
          {company.corp_name_eng && (
            <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--gray-400)" }}>
              {company.corp_name_eng}
            </p>
          )}
        </div>
        {company.sector && (
          <span className="ml-2 shrink-0 rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "", color: "var(--brand-700)" }}>
            {company.sector}
          </span>
        )}
      </div>

      <div className="space-y-1 text-[12px]" style={{ color: "var(--gray-500)" }}>
        {company.ceo_name && (
          <div className="flex gap-2">
            <span className="w-10 shrink-0" style={{ color: "var(--gray-400)" }}>대표</span>
            <span className="truncate">{company.ceo_name}</span>
          </div>
        )}
        {company.established_date && (
          <div className="flex gap-2">
            <span className="w-10 shrink-0" style={{ color: "var(--gray-400)" }}>설립</span>
            <span>{formatDate(company.established_date)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t pt-2.5" style={{ borderColor: "var(--gray-100)" }}>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: clsColor }}>
          <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: clsColor }} />
          {clsLabel}
        </span>
      </div>
    </Link>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 w-14 shrink-0 text-[11px] font-medium" style={{ color: "var(--gray-400)" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
      style={{
        backgroundColor: active ? "var(--navy-900)" : "var(--gray-100)",
        color: active ? "var(--gray-100)" : "var(--gray-500)",
      }}
    >
      {children}
    </button>
  );
}