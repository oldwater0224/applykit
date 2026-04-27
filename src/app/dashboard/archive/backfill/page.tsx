"use client";

import { useState } from "react";
import Link from "next/link";
import { backfillCompanyNames } from "@/src/app/actions/reviewAction";

/**
 * 회사명 백필 임시 페이지
 *
 * 사용처:
 * - 운영기관이 새로 isCompanyName 플래그를 지정한 후 과거 데이터 일괄 보정
 * - 일회성 작업이라 메뉴/네비에는 노출하지 않음 (URL 직접 입력)
 *
 * 향후:
 * - 백필 완료 후 이 페이지를 삭제하거나 권한 관리자 전용으로 제한
 */
export default function BackfillPage() {
  const [result, setResult] = useState<{
    processed: number;
    updated: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleRun() {
    if (
      !confirm(
        "기존 심사 이력의 회사명을 일괄 보정합니다. 진행하시겠습니까?",
      )
    ) {
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const r = await backfillCompanyNames();
      if (r.success) {
        setResult(r.data);
      } else {
        setError(r.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/dashboard/archive"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 심사 아카이브
          </Link>
          <h1 className="text-xl font-bold mt-1">회사명 일괄 보정</h1>
          <p className="text-sm text-gray-500 mt-1">
            기존 심사 이력 중 회사명이 비어 있는 항목을 새 폼 설정에 따라
            다시 추출합니다.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <p>
              <b>주의</b>: 이 작업은 일회성으로 실행하면 됩니다.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                각 공고의 폼에서 &ldquo;회사명 필드&rdquo;를 먼저 지정하세요.
              </li>
              <li>
                회사명 필드가 지정되지 않은 공고는 라벨 키워드(회사/기관/업체
                등)로 추출을 시도합니다.
              </li>
              <li>둘 다 실패한 항목은 변경되지 않고 건너뜁니다.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "처리 중..." : "회사명 일괄 보정 실행"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6 space-y-2 text-sm">
            <p>
              <b>완료</b>: 회사명이 비어 있던 {result.processed}건 중{" "}
              <b>{result.updated}건</b>의 회사명을 보정했습니다.
            </p>
            {result.processed > result.updated && (
              <p className="text-gray-500">
                나머지 {result.processed - result.updated}건은 폼 스키마에서
                회사명을 추출하지 못해 그대로 두었습니다.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}