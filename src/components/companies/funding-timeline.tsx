"use client";

import type { FundingRound } from "@/src/types/funding";
import { normalizeRoundName } from "@/src/types/funding";

const ROUND_DOT_COLORS: Record<string, string> = {
  Seed: "var(--round-seed)",
  "Pre-A": "var(--round-pre-a)",
  "Series A": "var(--round-series-a)",
  "Series B": "var(--round-series-b)",
  "Series C": "var(--round-series-c)",
  "Series D": "var(--round-series-d)",
  "Pre-IPO": "var(--round-pre-ipo)",
  IPO: "var(--round-ipo)",
  "M&A": "var(--round-ma)",
};

function formatAmount(amount: number | null) {
  if (!amount) return "비공개";
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억`;
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
  if (!rounds || rounds.length === 0) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-lg"
        style={{ borderColor: "var(--gray-300)" }}
      >
        <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
          등록된 투자 이력이 없습니다
        </p>
      </div>
    );
  }

  const sorted = [...rounds].sort((a, b) => {
    const da = a.announced_date ?? "";
    const db = b.announced_date ?? "";
    return db.localeCompare(da);
  });

  return (
    <div className="relative">
      <div
        className="absolute left-1.75 top-2 bottom-2 w-px"
        style={{ backgroundColor: "var(--gray-200)" }}
      />

      <div className="space-y-1">
        {sorted.map((round, i) => {
          const name = normalizeRoundName(round.round_name);
          const dotColor = ROUND_DOT_COLORS[name] ?? "var(--gray-400)";

          return (
            <div key={round.id} className="relative flex items-center gap-3 pl-6 py-2">
              {/* 도트 */}
              <div
                className="absolute left-0.75 size-2.5 rounded-full border-2"
                style={{
                  backgroundColor: i === 0 ? dotColor : "var(--card-bg)",
                  borderColor: dotColor,
                }}
              />

              {/* 날짜 */}
              <span
                className="w-16 shrink-0 text-[11px] tabular-nums"
                style={{ color: "var(--gray-400)" }}
              >
                {formatDate(round.announced_date)}
              </span>

              {/* 라운드 */}
              <span
                className="inline-flex w-20 shrink-0 items-center gap-1 text-[12px] font-semibold"
                style={{ color: "var(--gray-700)" }}
              >
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                {name}
              </span>

              {/* 금액 */}
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: "var(--gray-900)" }}
              >
                {formatAmount(round.amount)}
              </span>

              {/* 뉴스 링크 */}
              {round.news_url && (
                <a
                  href={round.news_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[11px]"
                  style={{ color: "var(--brand-600)" }}
                >
                  기사 →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}