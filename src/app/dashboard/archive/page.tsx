"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useArchiveSearch } from "@/src/hooks/useReviews";
import type { ReviewResultWithProgram } from "@/src/types/review";
import { DashboardPageHeader } from "@/src/components/dashboard/pageHeader";
import {
  DashboardPanel,
  SkeletonBlock,
} from "@/src/components/dashboard/dashboardPanel";
import {
  DataTable,
  type DataTableColumn,
} from "@/src/components/dashboard/dataTable";
import { VerdictBadge } from "@/src/components/dashboard/statusBadge";
import { formatKstIso } from "@/src/components/dashboard/formatters";

export default function ArchivePage() {
  return (
    <div>
      <DashboardPageHeader
        title="심사 아카이브"
        subtitle="과거에 심사한 회사를 검색합니다"
      />

      <div className="mx-auto w-full max-w-(--max-width) space-y-4 p-4 lg:p-6">
        {/* useSearchParams는 Suspense 경계가 필요 (정적 프리렌더 시 CSR bailout) */}
        <Suspense fallback={<ArchiveFallback />}>
          <ArchiveSearchFromParams />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * ?q= 값을 검색 초기값으로 넘김.
 * q가 바뀌면(헤더 검색으로 다시 이동) key로 리마운트해서 새 초기값을 반영
 * → useEffect 안 setState 없이 URL과 동기화
 */
function ArchiveSearchFromParams() {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("q") ?? "").trim();
  return <ArchiveSearch key={initialQuery} initialQuery={initialQuery} />;
}

function ArchiveSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  // useDebouncedValue는 초기값을 그대로 쓰므로 q가 있으면 진입 즉시 검색됨
  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data: results = [],
    isLoading,
    error,
  } = useArchiveSearch(debouncedQuery);
  const isTyping = query !== debouncedQuery;

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-(--accent-rose)/30 bg-(--accent-rose)/[0.06] px-6 py-10 text-center text-[13px] text-(--dash-negative-text)"
        >
          {error instanceof Error ? error.message : "검색에 실패했습니다."}
        </div>
      ) : (
        <DashboardPanel
          title={debouncedQuery ? "검색 결과" : "최근 심사 이력"}
          meta={
            isLoading ? undefined : (
              <>
                총 {results.length.toLocaleString("ko-KR")}건
                {debouncedQuery && (
                  <span className="text-(--dash-text-subtle)">
                    {" "}
                    · &ldquo;{debouncedQuery}&rdquo;
                  </span>
                )}
              </>
            )
          }
          action={
            isTyping ? (
              <span
                className="text-[11px] text-(--dash-text-subtle)"
                aria-live="polite"
              >
                입력 중...
              </span>
            ) : undefined
          }
          flush
        >
          <DataTable
            caption="심사 아카이브 검색 결과"
            columns={archiveColumns}
            rows={results}
            getRowKey={(r) => r.id}
            getRowHref={(r) =>
              r.programs
                ? `/dashboard/programs/${r.programs.id}/applications/${r.application_id}`
                : ""
            }
            loading={isLoading}
            minWidth="600px"
            emptyMessage={
              debouncedQuery
                ? `"${debouncedQuery}"에 해당하는 심사 이력이 없습니다.`
                : "아직 심사한 지원서가 없습니다."
            }
          />
        </DashboardPanel>
      )}
    </>
  );
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="search" className="flex flex-col gap-1.5">
      <label
        htmlFor="archive-search"
        className="text-[12px] font-medium text-(--dash-text-secondary)"
      >
        회사명 검색
      </label>
      <div className="relative w-full max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--dash-text-subtle)"
          aria-hidden
        />
        <input
          id="archive-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: 스타트업, 테크, 엘앤에스"
          autoComplete="off"
          aria-describedby="archive-search-hint"
          className="h-9 w-full rounded-md border border-(--dash-border) bg-(--dash-input-bg) pr-3 pl-9 text-[13px] text-(--dash-text) outline-none transition placeholder:text-(--dash-text-subtle) focus:border-(--brand-500) focus:ring-2 focus:ring-(--dash-focus-ring)"
        />
      </div>
      <p
        id="archive-search-hint"
        className="text-[11px] text-(--dash-text-subtle)"
      >
        입력하면 자동으로 검색됩니다 · 빈 상태에서는 최근 심사 이력이 표시됩니다
      </p>
    </div>
  );
}

/** Suspense 대기 중 표시 (검색창 + 테이블 자리) */
function ArchiveFallback() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="space-y-1.5">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-9 w-full max-w-xl" />
      </div>
      <SkeletonBlock className="h-64 w-full rounded-lg" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 테이블 열 정의                                                       */
/* ------------------------------------------------------------------ */

const archiveColumns: DataTableColumn<ReviewResultWithProgram>[] = [
  {
    key: "company",
    header: "회사명",
    primary: true,
    cell: (r) =>
      r.company_name ? (
        <span className="line-clamp-1 break-all">{r.company_name}</span>
      ) : (
        <span className="font-normal text-(--dash-text-subtle)">(이름 없음)</span>
      ),
  },
  {
    key: "program",
    header: "공고",
    cell: (r) =>
      r.programs ? (
        <span className="line-clamp-1 break-all">{r.programs.title || "제목 없음"}</span>
      ) : (
        <span
          className="text-(--dash-text-subtle)"
          title="공고가 삭제되어 지원서로 이동할 수 없습니다"
        >
          (삭제됨)
        </span>
      ),
  },
  {
    key: "score",
    header: "총점",
    numeric: true,
    width: "80px",
    cell: (r) => (
      <span className="font-medium text-(--dash-text)">
        {r.total_score.toLocaleString("ko-KR")}
        <span className="ml-0.5 text-[11px] font-normal text-(--dash-text-muted)">점</span>
      </span>
    ),
  },
  {
    key: "verdict",
    header: "판정",
    align: "center",
    width: "80px",
    cell: (r) => <VerdictBadge verdict={r.is_passed ? "passed" : "failed"} />,
  },
  {
    key: "reviewed",
    header: "심사일",
    align: "right",
    nowrap: true,
    width: "112px",
    cell: (r) => (
      <time dateTime={r.reviewed_at} className="tabular-nums text-(--dash-text-muted)">
        {formatKstIso(r.reviewed_at, { withYear: true })}
      </time>
    ),
  },
];
