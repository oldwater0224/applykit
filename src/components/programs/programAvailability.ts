// 공고 접수 가능 여부 → 지원자 화면 표시용 라벨/스타일
//
// 판정 자체는 서버와 같은 checkProgramAcceptingApplications를 그대로 쓴다.
// 여기서는 판정 결과를 화면 문구와 뱃지 스타일로 바꾸는 일만 한다.

import type { CSSProperties } from "react";
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

export const DDAY_BADGE_STYLE: Record<"urgent" | "normal", CSSProperties> = {
  urgent: {
    borderColor: "var(--accent-rose)",
    color: "var(--accent-rose)",
    backgroundColor: "rgba(244, 63, 94, 0.1)",
  },
  normal: {
    borderColor: "var(--brand-500)",
    color: "var(--brand-500)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
};

// 기존 뱃지 인라인 스타일과 같은 값
export const AVAILABILITY_BADGE_STYLE: Record<
  ProgramStatusTone,
  CSSProperties
> = {
  pending: {
    borderColor: "var(--accent-amber)",
    color: "var(--accent-amber)",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  open: {
    borderColor: "var(--accent-emerald)",
    color: "var(--accent-emerald)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  closed: {
    borderColor: "var(--accent-rose)",
    color: "var(--accent-rose)",
    backgroundColor: "rgba(244, 63, 94, 0.1)",
  },
  muted: {
    borderColor: "var(--navy-600)",
    color: "var(--gray-400)",
    backgroundColor: "var(--navy-800)",
  },
};
