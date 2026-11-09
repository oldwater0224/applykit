// 공고 접수 가능 여부 → 지원자 화면 표시용 라벨/스타일
//
// 판정 자체는 서버와 같은 checkProgramAcceptingApplications를 그대로 쓴다.
// 여기서는 판정 결과를 화면 문구와 뱃지 스타일로 바꾸는 일만 한다.

import type { BadgeTone } from "@/src/types/badge";
import {
  checkProgramAcceptingApplications,
  type ProgramAvailability,
  type ProgramAvailabilityInput,
} from "@/src/lib/application/deadline";
import {
  formatKstDate,
  kstDaysLeft,
  parseDeadlineMs,
} from "@/src/lib/datetime/kst";

export type ProgramAvailabilityTone = "open" | "closed" | "muted";

export interface ProgramAvailabilityView {
  availability: ProgramAvailability;
  accepting: boolean;
  /** 뱃지 문구 (접수 중 / 접수 마감 / 모집 전 / 모집 중 아님) */
  label: string;
  /** 비활성 버튼 문구 */
  disabledLabel: string;
  tone: ProgramAvailabilityTone;
}

export function getProgramAvailabilityView(
  program: ProgramAvailabilityInput | null | undefined,
  now: Date | number,
): ProgramAvailabilityView {
  const availability = checkProgramAcceptingApplications(program, now);

  if (availability.ok) {
    return {
      availability,
      accepting: true,
      label: "접수 중",
      disabledLabel: "",
      tone: "open",
    };
  }

  if (availability.reason === "deadline_passed") {
    return {
      availability,
      accepting: false,
      label: "접수 마감",
      disabledLabel: "접수 기간이 지났습니다",
      tone: "closed",
    };
  }

  if (program?.status === "closed") {
    return {
      availability,
      accepting: false,
      label: "접수 마감",
      disabledLabel: "접수가 마감되었습니다",
      tone: "closed",
    };
  }

  if (program?.status === "draft") {
    return {
      availability,
      accepting: false,
      label: "모집 전",
      disabledLabel: "아직 모집 중이 아닙니다",
      tone: "muted",
    };
  }

  return {
    availability,
    accepting: false,
    label: "모집 중 아님",
    disabledLabel: "현재 모집 중이 아닙니다",
    tone: "muted",
  };
}

// ============================================
// 공고 목록 카드와 상세 페이지가 함께 쓰는 표시 상태
// ============================================

export type ProgramStatusTone = ProgramAvailabilityTone | "pending";

export interface ProgramDisplayInput extends ProgramAvailabilityInput {
  form_schema?: { fields: unknown[] } | null;
}

export interface ProgramDisplay {
  view: ProgramAvailabilityView;
  /** 지원 양식(필드 1개 이상)이 있는지 */
  hasForm: boolean;
  /** 지원하기 가능 = 접수 중 + 양식 있음 */
  canApply: boolean;
  /** 상태 뱃지 (접수 마감 / 모집 전 / 모집 중 아님 / 양식 준비 중 / 접수 중) */
  statusLabel: string;
  statusTone: ProgramStatusTone;
  /** KST 달력 기준 남은 일수. 접수 중이고 마감일이 있을 때만 값이 있음 (오늘 마감 = 0) */
  daysLeft: number | null;
  /** D-day 문구 (D-3, 오늘 마감) */
  dDayLabel: string | null;
  /** 7일 이내 마감 */
  dDayUrgent: boolean;
  /** 마감 날짜 표시 (KST) */
  deadlineLabel: string | null;
}

export const URGENT_DEADLINE_DAYS = 7;

/**
 * 상태 뱃지 우선순위: 접수 불가(마감·closed·draft) → 양식 없음 → 접수 중
 * 목록과 상세가 같은 결과를 보이도록 이 함수 하나로만 정한다.
 */
export function getProgramDisplay(
  program: ProgramDisplayInput,
  now: Date | number,
): ProgramDisplay {
  const view = getProgramAvailabilityView(program, now);
  const hasForm = (program.form_schema?.fields.length ?? 0) > 0;
  const nowMs = typeof now === "number" ? now : now.getTime();
  const deadlineMs = parseDeadlineMs(program.deadline);

  let statusLabel = view.label;
  let statusTone: ProgramStatusTone = view.tone;
  if (view.accepting && !hasForm) {
    statusLabel = "양식 준비 중";
    statusTone = "pending";
  }

  const daysLeft =
    view.accepting && deadlineMs !== null ? kstDaysLeft(deadlineMs, nowMs) : null;

  return {
    view,
    hasForm,
    canApply: view.accepting && hasForm,
    statusLabel,
    statusTone,
    daysLeft,
    dDayLabel:
      daysLeft === null ? null : daysLeft === 0 ? "오늘 마감" : `D-${daysLeft}`,
    dDayUrgent: daysLeft !== null && daysLeft <= URGENT_DEADLINE_DAYS,
    deadlineLabel: deadlineMs === null ? null : formatKstDate(deadlineMs),
  };
}

// ============================================
// 배지 톤 (#67 4단계) - StatusBadge의 tone으로 넘긴다
// ============================================

/** 상태 배지 톤. display.statusTone으로 찾는다 */
export const AVAILABILITY_BADGE_TONE: Record<ProgramStatusTone, BadgeTone> = {
  open: "success",
  pending: "warning",
  closed: "neutral",
  muted: "muted",
};

/** D-day 배지 톤. 마감 7일 이내(dDayUrgent)는 warning, 그 외는 neutral */
export const DDAY_BADGE_TONE: Record<"urgent" | "normal", BadgeTone> = {
  urgent: "warning",
  normal: "neutral",
};

/** D-day 배지 톤. D-day가 없으면(접수 중 아님, 마감일 없음) null */
export function getDdayBadgeTone(
  display: Pick<ProgramDisplay, "dDayLabel" | "dDayUrgent">,
): BadgeTone | null {
  if (display.dDayLabel === null) return null;
  return DDAY_BADGE_TONE[display.dDayUrgent ? "urgent" : "normal"];
}
