import { cn } from "@/lib/utils";
import type { ReviewVerdict } from "@/src/types/adminDashboard";
import type { BadgeTone } from "@/src/types/badge";

export type { BadgeTone } from "@/src/types/badge";

/**
 * 앱 공용 배지 (다크 테마, #67 4단계에서 앱 전체로 확장)
 * - 서버/클라이언트 컴포넌트 어디서나 사용 가능 (상태 없음)
 * - 배지 모양은 여기서만 정한다: 높이 20px, 좌우 패딩 6px, 반경 4px, 12px(sm 11px) 글자, 굵기 500
 * - 색은 톤(BadgeTone)으로만 고른다. 도메인 상수(*_TONE)가 톤 이름을 갖는다
 * - 모든 톤의 글자는 어두운 표면(navy-950 ~ navy-800) 위에서 4.5:1 이상
 * - 도메인 배지(공고 상태, 지원서 상태, 판정, D-day)는 StatusBadge를 감싼 얇은 래퍼
 */

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-white/[0.06] text-(--gray-300) ring-white/10",
  brand: "bg-(--brand-500)/15 text-(--dash-active-text) ring-(--brand-500)/30",
  success: "bg-(--accent-emerald)/12 text-(--dash-positive-text) ring-(--accent-emerald)/30",
  warning: "bg-(--accent-amber)/12 text-(--dash-warning-text) ring-(--accent-amber)/30",
  danger: "bg-(--accent-rose)/12 text-(--dash-negative-text) ring-(--accent-rose)/30",
  // muted: 채움 없이 테두리만. gray-500 글자는 패널 위 3.6:1이라 text-muted(gray-400, 6.7:1)로 올렸다
  muted: "bg-transparent text-(--text-muted) ring-(--hairline-strong)",
};

const DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-(--gray-400)",
  brand: "bg-(--brand-500)",
  success: "bg-(--accent-emerald)",
  warning: "bg-(--accent-amber)",
  danger: "bg-(--accent-rose)",
  muted: "bg-(--gray-600)",
};

export interface StatusBadgeProps {
  tone?: BadgeTone;
  /** 왼쪽에 작은 점 표시 */
  dot?: boolean;
  /**
   * 데이터 범주 색(라운드, 상장 구분 등)을 점에만 칠할 때 쓴다.
   * 지정하면 점을 이 색으로 그리고 글자·배경은 tone(보통 neutral)을 따른다
   */
  dotColor?: string;
  className?: string;
  /** 스크린리더용 보조 설명 (예: "심사 판정") */
  srPrefix?: string;
  children: React.ReactNode;
}

export function StatusBadge({
  tone = "neutral",
  dot = false,
  dotColor,
  className,
  srPrefix,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-xs sm:text-[11px] leading-none font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_CLASS[tone],
        className
      )}
    >
      {(dot || dotColor) && (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", !dotColor && DOT_CLASS[tone])}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      )}
      {srPrefix && <span className="sr-only">{srPrefix}: </span>}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 공고 상태 (programs.status)                                         */
/* ------------------------------------------------------------------ */

export const PROGRAM_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "작성 중", tone: "muted" },
  active: { label: "모집 중", tone: "success" },
  closed: { label: "마감", tone: "neutral" },
};

export function ProgramStatusBadge({ status }: { status: string | null }) {
  const meta = PROGRAM_STATUS_META[status ?? "draft"] ?? {
    label: status ?? "-",
    tone: "neutral" as const,
  };
  return (
    <StatusBadge tone={meta.tone} dot srPrefix="공고 상태">
      {meta.label}
    </StatusBadge>
  );
}

/* ------------------------------------------------------------------ */
/* 지원서 제출 상태 (applications.status + is_complete)                */
/* ------------------------------------------------------------------ */

export function ApplicationStatusBadge({
  status,
  isComplete,
}: {
  status: string;
  isComplete: boolean;
}) {
  if (status === "draft" || !isComplete) {
    return (
      <StatusBadge tone="muted" srPrefix="제출 상태">
        작성 중
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="brand" srPrefix="제출 상태">
      제출 완료
    </StatusBadge>
  );
}

/* ------------------------------------------------------------------ */
/* 심사 판정 (review_results 기준, null = 대기)                         */
/* ------------------------------------------------------------------ */

export const VERDICT_META: Record<
  ReviewVerdict | "pending",
  { label: string; tone: BadgeTone }
> = {
  passed: { label: "합격", tone: "success" },
  failed: { label: "불합격", tone: "danger" },
  pending: { label: "대기", tone: "warning" },
};

export function VerdictBadge({ verdict }: { verdict: ReviewVerdict | null }) {
  const meta = VERDICT_META[verdict ?? "pending"];
  return (
    <StatusBadge tone={meta.tone} srPrefix="심사 판정">
      {meta.label}
    </StatusBadge>
  );
}

/* ------------------------------------------------------------------ */
/* 마감 D-day (0 = 오늘 마감)                                           */
/* ------------------------------------------------------------------ */

export function formatDday(daysLeft: number): string {
  if (daysLeft === 0) return "오늘 마감";
  if (daysLeft > 0) return `D-${daysLeft}`;
  return `D+${Math.abs(daysLeft)}`;
}

export function DeadlineBadge({ daysLeft }: { daysLeft: number }) {
  const tone: BadgeTone =
    daysLeft < 0
      ? "muted"
      : daysLeft === 0
        ? "danger"
        : daysLeft <= 3
          ? "warning"
          : "neutral";
  return (
    <StatusBadge tone={tone} className="tabular-nums">
      {formatDday(daysLeft)}
    </StatusBadge>
  );
}
