"use client";

import { useState } from "react";
import Link from "next/link";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useArchiveSearch } from "@/src/hooks/useReviews";
import { REVIEW_RESULT_LABEL, REVIEW_RESULT_STYLE } from "@/src/types/review";
import type { ReviewResultWithProgram } from "@/src/types/review";
import { DashboardPageHeader } from "@/src/components/dashboard/pageHeader";

export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data: results = [],
    isLoading,
    error,
  } = useArchiveSearch(debouncedQuery);
  const isTyping = query !== debouncedQuery;

  return (
    <div>
      <DashboardPageHeader
        backHref="/dashboard"
        backLabel="← 대시보드"
        title="심사 아카이브"
        subtitle="과거에 심사한 회사를 검색합니다"
      />

      <div className="p-6 space-y-4">
        {/* 검색 */}
        <div
          className="rounded-lg  p-4"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          <label
            htmlFor="archive-search"
            className="mb-2 block text-[12px] font-medium"
            style={{ color: "var(--gray-300)" }}
          >
            회사명 검색
          </label>
          <input
            id="archive-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 스타트업, 테크, 엘앤에스"
            className="w-full rounded-md border px-3 py-2 text-[13px] outline-none transition focus:ring-2 text-white"
            style={{ borderColor: "var(--gray-200)" }}
            autoComplete="off"
          />
          <p
            className="mt-1.5 text-[11px]"
            style={{ color: "var(--gray-400)" }}
          >
            빈 상태에서는 최근 심사 이력이 표시됩니다
          </p>
        </div>

        {/* 결과 */}
        {isLoading ? (
          <div
            className="flex items-center justify-center rounded-lg border py-12"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div
              className="size-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--brand-500)" }}
            />
          </div>
        ) : error ? (
          <div
            className="rounded-lg border p-8 text-center text-[13px]"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--accent-rose)",
            }}
          >
            {error instanceof Error ? error.message : "검색에 실패했습니다."}
          </div>
        ) : results.length === 0 ? (
          <div
            className="rounded-lg border p-12 text-center text-[12px]"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--gray-400)",
            }}
          >
            {debouncedQuery
              ? `"${debouncedQuery}"에 해당하는 심사 이력이 없습니다.`
              : "아직 심사한 지원서가 없습니다."}
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-lg border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--gray-100)" }}
            >
              <span
                className="text-[12px]"
                style={{ color :"var(--gray-100)"}}
              >
                총 <b>{results.length}</b>건
                {debouncedQuery && (
                  <span style={{ color: "var(--gray-400)" }}>
                    {" "}
                    · &ldquo;{debouncedQuery}&rdquo;
                  </span>
                )}
              </span>
              {isTyping && (
                <span
                  className="text-[10px]"
                  style={{ color: "var(--gray-400)" }}
                >
                  입력 중...
                </span>
              )}
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <th
                    className="px-3 py-2 text-left font-medium"
                    style={{ color: "var(--gray-400)" }}
                  >
                    회사명
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium"
                    style={{ color: "var(--gray-400)" }}
                  >
                    공고
                  </th>
                  <th
                    className="px-3 py-2 text-right font-medium"
                    style={{ color: "var(--gray-400)" }}
                  >
                    총점
                  </th>
                  <th
                    className="px-3 py-2 text-center font-medium"
                    style={{ color: "var(--gray-400)" }}
                  >
                    판정
                  </th>
                  <th
                    className="px-3 py-2 text-right font-medium"
                    style={{ color: "var(--gray-400)" }}
                  >
                    심사일
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <ArchiveRow key={r.id} result={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ArchiveRow({ result }: { result: ReviewResultWithProgram }) {
  const program = result.programs;
  const href = program
    ? `/dashboard/programs/${program.id}/applications/${result.application_id}`
    : null;
  const resultKey = result.is_passed ? "passed" : "failed";

  function renderCell(children: React.ReactNode, className = "") {
    const inner = <div className={`px-3 py-2.5 ${className}`}>{children}</div>;
    if (href)
      return (
        <Link href={href} className="block transition text-white">
          {inner}
        </Link>
      );
    return <div className="opacity-50">{inner}</div>;
  }
  return (
    <tr style={{ borderBottom: "1px solid var(--gray-50)" }}>
      <td className="p-0">
        {renderCell(
          result.company_name ?? (
            <span style={{ color: "var(--gray-400)" }}>(이름 없음)</span>
          ),
        )}
      </td>
      <td className="p-0">
        {renderCell(
          program ? (
            program.title
          ) : (
            <span style={{ color: "var(--gray-400)" }}>(삭제됨)</span>
          ),
        )}
      </td>
      <td className="p-0">
        {renderCell(
          `${result.total_score}점`,
          "text-right tabular-nums font-medium",
        )}
      </td>
      <td className="p-0">
        {renderCell(
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${REVIEW_RESULT_STYLE[resultKey]}`}
          >
            {REVIEW_RESULT_LABEL[resultKey]}
          </span>,
          "text-center",
        )}
      </td>
      <td className="p-0">
        {renderCell(
          <span style={{ color: "var(--gray-400)" }}>
            {new Date(result.reviewed_at).toLocaleDateString("ko-KR")}
          </span>,
          "text-right tabular-nums text-[11px]",
        )}
      </td>
    </tr>
  );
}
