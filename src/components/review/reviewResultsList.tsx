"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgramReviews } from "@/src/hooks/useReviews";
import {
  REVIEW_RESULT_LABEL,
  REVIEW_RESULT_STYLE,
} from "@/src/types/review";
import type { ReviewResult } from "@/src/types/review";

interface ReviewResultsListProps {
  programId: string;
}

type ResultFilter = "all" | "passed" | "failed";

const FILTERS: { id: ResultFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "passed", label: "합격" },
  { id: "failed", label: "불합격" },
];

export function ReviewResultsList({ programId }: ReviewResultsListProps) {
  const { data: results = [], isLoading, error } = useProgramReviews(programId);

  const [filter, setFilter] = useState<ResultFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return results;
    if (filter === "passed") return results.filter((r) => r.is_passed);
    return results.filter((r) => !r.is_passed);
  }, [results, filter]);

  const counts = useMemo(
    () => ({
      all: results.length,
      passed: results.filter((r) => r.is_passed).length,
      failed: results.filter((r) => !r.is_passed).length,
    }),
    [results],
  );

  if (isLoading) {
    return (
      <section
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm text-center" style={{ color: "var(--gray-400)" }}>
          심사 결과 로딩 중...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm text-center" style={{ color: "var(--accent-rose)" }}>
          {error instanceof Error
            ? error.message
            : "심사 결과를 불러오지 못했습니다."}
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border p-6 space-y-4"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--gray-100)" }}>
          심사 결과
        </h2>

        {/* 필터 버튼 그룹 */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 text-sm border rounded-md transition"
              style={{
                backgroundColor: filter === f.id ? "var(--brand-600)" : "transparent",
                color: filter === f.id ? "#fff" : "var(--gray-400)",
                borderColor: filter === f.id ? "var(--brand-600)" : "var(--navy-600)",
              }}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      {results.length === 0 ? (
        <div
          className="p-8 border border-dashed rounded-md text-sm text-center"
          style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
        >
          아직 심사한 지원서가 없습니다.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="p-8 border border-dashed rounded-md text-sm text-center"
          style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
        >
          해당하는 결과가 없습니다.
        </div>
      ) : (
        <ReviewResultsTable results={filtered} programId={programId} />
      )}
    </section>
  );
}

function ReviewResultsTable({
  results,
  programId,
}: {
  results: ReviewResult[];
  programId: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--navy-700)" }}>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--gray-300)" }}>
              회사명
            </th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--gray-300)" }}>
              총점
            </th>
            <th className="text-center px-3 py-2 font-medium" style={{ color: "var(--gray-300)" }}>
              판정
            </th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--gray-300)" }}>
              심사일
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <ReviewResultRow key={r.id} result={r} programId={programId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewResultRow({
  result,
  programId,
}: {
  result: ReviewResult;
  programId: string;
}) {
  const href = `/dashboard/programs/${programId}/applications/${result.application_id}`;
  const resultKey = result.is_passed ? "passed" : "failed";

  const linkCell = "block px-3 py-3 transition-colors";

  return (
    <tr
      className="border-b last:border-0"
      style={{ borderColor: "var(--navy-700)" }}
    >
      <td className="p-0">
        <Link
          href={href}
          className={linkCell}
          style={{ color: "var(--gray-200)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {result.company_name ?? (
            <span style={{ color: "var(--gray-500)" }}>(이름 없음)</span>
          )}
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link
          href={href}
          className={linkCell}
          style={{ color: "var(--gray-200)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {result.total_score}점
        </Link>
      </td>
      <td className="p-0 text-center">
        <Link
          href={href}
          className={linkCell}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <span
            className={`inline-block px-2 py-0.5 text-xs border rounded-full ${REVIEW_RESULT_STYLE[resultKey]}`}
          >
            {REVIEW_RESULT_LABEL[resultKey]}
          </span>
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link
          href={href}
          className={linkCell}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <span className="text-xs" style={{ color: "var(--gray-400)" }}>
            {new Date(result.reviewed_at).toLocaleDateString("ko-KR")}
          </span>
        </Link>
      </td>
    </tr>
  );
}
