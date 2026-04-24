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

// 필터 상태 - 3가지
// "all"은 기본값, "passed"/"failed"는 특정 결과만
type ResultFilter = "all" | "passed" | "failed";

const FILTERS: { id: ResultFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "passed", label: "합격" },
  { id: "failed", label: "불합격" },
];

/**
 * 심사 결과 목록
 * - 프로그램의 모든 심사 결과 표시
 * - 합격/불합격 필터링 (클라이언트 사이드 - 데이터 양 적음)
 * - 각 행 클릭 시 지원서 상세 페이지로 이동
 * - 회사명이 null인 경우 "(이름 없음)" 표시
 *
 * 레이아웃:
 * - 헤더: 제목 + 개수 + 필터 버튼
 * - 본문: 테이블 (회사명 | 총점 | 판정 | 심사일)
 */
export function ReviewResultsList({ programId }: ReviewResultsListProps) {
  const { data: results = [], isLoading, error } = useProgramReviews(programId);

  const [filter, setFilter] = useState<ResultFilter>("all");

  // 필터 적용
  const filtered = useMemo(() => {
    if (filter === "all") return results;
    if (filter === "passed") return results.filter((r) => r.is_passed);
    return results.filter((r) => !r.is_passed);
  }, [results, filter]);

  // 각 필터별 개수 - 버튼에 표시해서 "몇 건 걸려있는지" 바로 보이게
  const counts = useMemo(
    () => ({
      all: results.length,
      passed: results.filter((r) => r.is_passed).length,
      failed: results.filter((r) => !r.is_passed).length,
    }),
    [results],
  );

  // === 렌더링 분기 ===

  if (isLoading) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-center">심사 결과 로딩 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-center text-red-600">
          {error instanceof Error
            ? error.message
            : "심사 결과를 불러오지 못했습니다."}
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">심사 결과</h2>

        {/* 필터 버튼 그룹 */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-sm border rounded-md ${
                filter === f.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : ""
              }`}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      {results.length === 0 ? (
        <div className="p-8 border border-dashed rounded-md text-sm text-center">
          아직 심사한 지원서가 없습니다.
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 border border-dashed rounded-md text-sm text-center">
          해당하는 결과가 없습니다.
        </div>
      ) : (
        <ReviewResultsTable results={filtered} programId={programId} />
      )}
    </section>
  );
}

/**
 * 심사 결과 테이블
 * - 분리한 이유: 필터 버튼 + 빈 상태 분기와 관심사 구분
 * - 각 행은 Link 컴포넌트로 감싸 지원서 상세로 이동
 */
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
          <tr className="border-b">
            <th className="text-left px-3 py-2 font-medium">회사명</th>
            <th className="text-right px-3 py-2 font-medium">총점</th>
            <th className="text-center px-3 py-2 font-medium">판정</th>
            <th className="text-right px-3 py-2 font-medium">심사일</th>
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

/**
 * 개별 심사 결과 행
 * - 행 전체를 링크로 감싸 어디 클릭해도 상세로 이동
 * - <tr> 안에 <a>를 넣는 건 불가능 → <td> 단위로 Link 래핑
 *   (HTML 스펙: <tr>의 자식은 <td>/<th>만 가능)
 */
function ReviewResultRow({
  result,
  programId,
}: {
  result: ReviewResult;
  programId: string;
}) {
  const href = `/dashboard/programs/${programId}/applications/${result.application_id}`;
  const resultKey = result.is_passed ? "passed" : "failed";

  // 모든 td가 동일 링크 - wrapper 스타일은 td 레벨에서
  const linkCell =
    "block px-3 py-3 hover:bg-blue-50";

  return (
    <tr className="border-b last:border-0">
      <td className="p-0">
        <Link href={href} className={linkCell}>
          {result.company_name ?? (
            <span className="text-gray-400">(이름 없음)</span>
          )}
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className={linkCell}>
          {result.total_score}점
        </Link>
      </td>
      <td className="p-0 text-center">
        <Link href={href} className={linkCell}>
          <span
            className={`inline-block px-2 py-0.5 text-xs border rounded-full ${REVIEW_RESULT_STYLE[resultKey]}`}
          >
            {REVIEW_RESULT_LABEL[resultKey]}
          </span>
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className={linkCell}>
          <span className="text-xs">
            {new Date(result.reviewed_at).toLocaleDateString("ko-KR")}
          </span>
        </Link>
      </td>
    </tr>
  );
}