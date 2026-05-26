"use client";

// ============================================================
// src/components/companies/funding-timeline.tsx
// 투자 이력 타임라인
// ============================================================

import { ROUND_COLORS, normalizeRoundName } from "@/src/types/funding";
import type { FundingRound } from "@/src/types/funding";

function formatAmount(amount: number | null) {
  if (!amount) return "비공개";
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억 원`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FundingTimeline({
  rounds,
}: {
  rounds: FundingRound[];
}) {
  if (rounds.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-400">등록된 투자 이력이 없습니다.</p>
      </div>
    );
  }

  // 최신순 정렬
  const sorted = [...rounds].sort((a, b) => {
    const da = a.announced_date ?? "";
    const db = b.announced_date ?? "";
    return db.localeCompare(da);
  });

  return (
    <div className="relative">
      {/* 세로 라인 */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-4">
        {sorted.map((round, i) => {
          const roundName = normalizeRoundName(round.round_name);
          const colorClass =
            ROUND_COLORS[roundName as keyof typeof ROUND_COLORS] ??
            "bg-gray-100 text-gray-600";

          return (
            <div key={round.id} className="relative flex items-start gap-4 pl-10">
              {/* 도트 */}
              <div
                className={`absolute left-2.5 top-1.5 size-3 rounded-full border-2 border-white ${
                  i === 0 ? "bg-blue-500" : "bg-gray-300"
                }`}
              />

              {/* 콘텐츠 */}
              <div className="flex-1 rounded-lg border border-gray-100 bg-white p-3 transition hover:border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
                    >
                      {roundName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(round.announced_date)}
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-gray-900">
                    {formatAmount(round.amount)}
                  </span>
                </div>

                {round.news_url && (
                  <a
                    href={round.news_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-500 hover:underline"
                  >
                    관련 기사 →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}