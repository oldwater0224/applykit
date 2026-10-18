import { cn } from "@/lib/utils";
import type { ReviewVerdict } from "@/src/types/adminDashboard";

/**
 * 관리자 대시보드 공용 배지 (다크 테마)
 * - 서버/클라이언트 컴포넌트 어디서나 사용 가능 (상태 없음)
 * - 도메인 배지(공고 상태, 지원서 상태, 판정, D-day)는 StatusBadge를 감싼 얇은 래퍼
 */

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-white/[0.06] text-(--gray-300) ring-white/10",
  brand: "bg-(--brand-500)/15 text-(--dash-active-text) ring-(--brand-500)/30",
  success: "bg-(--accent-emerald)/12 text-(--dash-positive-text) ring-(--accent-emerald)/30",
  warning: "bg-(--accent-amber)/12 text-(--dash-warning-text) ring-(--accent-amber)/30",
  danger: "bg-(--accent-rose)/12 text-(--dash-negative-text) ring-(--accent-rose)/30",
  muted: "bg-transparent text-(--gray-500) ring-(--navy-700)",
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
  className?: string;
  /** 스크린리더용 보조 설명 (예: "심사 판정") */
  srPrefix?: string;
  children: React.ReactNode;
}

export function StatusBadge({
  tone = "neutral",
  dot = false,
  className,
  srPrefix,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] leading-none font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_CLASS[tone],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", DOT_CLASS[tone])}
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
