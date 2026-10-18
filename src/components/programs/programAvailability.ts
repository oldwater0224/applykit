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

// 기존 뱃지 인라인 스타일과 같은 값
export const AVAILABILITY_BADGE_STYLE: Record<
  ProgramAvailabilityTone,
  CSSProperties
> = {
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
