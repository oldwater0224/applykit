"use client";

import { useState } from "react";
import Link from "next/link";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useArchiveSearch } from "@/src/hooks/useReviews";
import {
  REVIEW_RESULT_LABEL,
  REVIEW_RESULT_STYLE,
} from "@/src/types/review";
import type { ReviewResultWithProgram } from "@/src/types/review";

/**
 * 심사 아카이브 페이지
 * - 운영기관이 과거에 심사한 모든 회사를 검색
 * - 회사명 부분검색 (trigram 인덱스 활용)
 * - 프로그램 경계를 넘는 전역 뷰 - ReviewResultsList와 별도 컴포넌트
 *   (컬럼 구성이 다름: 프로그램명 포함)
 *
 * 동작:
 * - 검색창 비어있음 → 최근 심사 100건 (최신순)
 * - 검색어 입력 → 300ms 디바운싱 후 trigram 검색
 * - 각 행 클릭 → 해당 지원서 상세 페이지로 이동
 *   (프로그램 경계를 넘지만 URL은 동일 형태)
 */
export default function ArchivePage() {
  const [query, setQuery] = useState("");
  // 300ms 디바운싱 - 타이핑 중 중간값으로 API 호출 방지
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results = [], isLoading, error } =
    useArchiveSearch(debouncedQuery);

  // 검색 중인지 여부 - 입력값과 디바운스값이 다르면 아직 타이핑 중
  // 로딩 인디케이터 표시에 활용
  const isTyping = query !== debouncedQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold mt-1">심사 아카이브</h1>
          <p className="text-sm text-gray-500 mt-1">
            과거에 심사한 회사를 검색합니다.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* 검색창 */}
        <div className="bg-white rounded-lg shadow p-4">
          <label
            htmlFor="archive-search"
            className="block text-sm font-medium mb-2"
          >
            회사명 검색
          </label>
          <input
            id="archive-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 스타트업, 테크, 엘앤에스"
            className="w-full px-3 py-2 border rounded-md text-sm"
            autoComplete="off"
          />
          <p className="text-xs mt-2 text-gray-500">
            회사명의 일부만 입력해도 검색됩니다. 빈 상태에서는 최근 심사
            이력이 표시됩니다.
          </p>
        </div>

        {/* 결과 영역 */}
        <ArchiveResults
          results={results}
          isLoading={isLoading}
          isTyping={isTyping}
          error={error}
          query={debouncedQuery}
        />
      </div>
    </div>
  );
}

/**
 * 검색 결과 영역
 * - 로딩/에러/빈 상태/결과 각각 처리
 * - 분리한 이유: 페이지 컴포넌트는 레이아웃과 검색 state에 집중하고,
 *   결과 렌더링은 별도로 관심사 분리
 */
function ArchiveResults({
  results,
  isLoading,
  isTyping,
  error,
  query,
}: {
  results: ReviewResultWithProgram[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
  query: string;
}) {
  // 처음 로딩 또는 타이핑 중 - 이전 결과는 흐리게 유지하지 않고 메시지만
  // (TanStack Query의 keepPreviousData 도입도 가능하지만 여기선 단순화)
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm">검색 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "검색에 실패했습니다."}
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm">
          {query
            ? `"${query}"에 해당하는 심사 이력이 없습니다.`
            : "아직 심사한 지원서가 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 - 결과 개수 + 타이핑 중 표시 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="text-sm">
          총 <b>{results.length}</b>건
          {query && (
            <span className="text-gray-500 ml-2">
              &ldquo;{query}&rdquo; 검색 결과
            </span>
          )}
        </div>
        {isTyping && (
          <span className="text-xs text-gray-400">입력 중...</span>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium">회사명</th>
              <th className="text-left px-3 py-2 font-medium">공고</th>
              <th className="text-right px-3 py-2 font-medium">총점</th>
              <th className="text-center px-3 py-2 font-medium">판정</th>
              <th className="text-right px-3 py-2 font-medium">심사일</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <ArchiveRow key={r.id} result={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 개별 아카이브 행
 * - 5컬럼: 회사명 | 공고 | 총점 | 판정 | 심사일
 * - programs가 null인 케이스 방어: 공고가 삭제된 경우 "(삭제된 공고)"
 * - tr 전체 링크 대신 각 td를 Link로 래핑 (HTML 스펙 준수)
 *
 * 셀 래핑은 헬퍼 함수(renderCell)로 분리 - 인라인 컴포넌트 정의를 피하기 위함
 * (react/no-unstable-nested-components ESLint 룰 회피)
 */
function ArchiveRow({ result }: { result: ReviewResultWithProgram }) {
  const program = result.programs;
  const href = program
    ? `/dashboard/programs/${program.id}/applications/${result.application_id}`
    : null; // 공고 삭제된 경우 이동 불가

  const resultKey = result.is_passed ? "passed" : "failed";
  const linkCell = "block px-3 py-3 hover:bg-blue-50";

  // 셀 컨텐츠를 Link 또는 비활성 div로 래핑하는 헬퍼
  // 컴포넌트가 아닌 함수라서 매 렌더 시 새 컴포넌트 타입이 생기지 않음
  function renderCell(children: React.ReactNode, extraClass = "") {
    if (href) {
      return (
        <Link href={href} className={`${linkCell} ${extraClass}`}>
          {children}
        </Link>
      );
    }
    return (
      <div
        className={`${linkCell} ${extraClass} cursor-not-allowed opacity-60`}
      >
        {children}
      </div>
    );
  }

  return (
    <tr className="border-b last:border-0">
      <td className="p-0">
        {renderCell(
          result.company_name ?? (
            <span className="text-gray-400">(이름 없음)</span>
          ),
        )}
      </td>
      <td className="p-0">
        {renderCell(
          program ? (
            program.title
          ) : (
            <span className="text-gray-400">(삭제된 공고)</span>
          ),
        )}
      </td>
      <td className="p-0 text-right">{renderCell(`${result.total_score}점`)}</td>
      <td className="p-0 text-center">
        {renderCell(
          <span
            className={`inline-block px-2 py-0.5 text-xs border rounded-full ${REVIEW_RESULT_STYLE[resultKey]}`}
          >
            {REVIEW_RESULT_LABEL[resultKey]}
          </span>,
        )}
      </td>
      <td className="p-0 text-right">
        {renderCell(
          new Date(result.reviewed_at).toLocaleDateString("ko-KR"),
          "text-xs",
        )}
      </td>
    </tr>
  );
}