// 지원서 쓰기(생성/수정/제출/파일 추가) 허용 여부 판정 - 순수 함수
//
// 규칙 (관리자 대시보드 isProgramActive와 동일):
// - 공고가 없으면 거부 (not_found)
// - status !== 'active'면 거부 (not_active) - draft/closed 모두
// - 마감일이 null이면 마감 없음으로 통과
// - 마감 시각은 parseDeadlineMs로 해석 (날짜만 있는 값은 그날 KST 23:59:59.999,
//   오프셋 없는 값은 KST, 오프셋 있는 값은 그대로)
// - now <= 마감 시각이면 통과 (마감 정각까지 허용), now > 마감 시각이면 거부 (deadline_passed)
// - 해석할 수 없는 마감일은 대시보드와 같게 마감 없음으로 본다
//   (DB 컬럼이 timestamptz라 실제로는 발생하지 않음)
//
// now를 인자로 받아 테스트에서 시각을 고정할 수 있게 한다.

import { parseDeadlineMs } from "@/src/lib/datetime/kst";

export interface ProgramAvailabilityInput {
  status: string | null;
  deadline: string | null;
}

export type ProgramAvailabilityFailure =
  | "deadline_passed"
  | "not_active"
  | "not_found";

export type ProgramAvailability =
  | { ok: true }
  | { ok: false; reason: ProgramAvailabilityFailure };

export const PROGRAM_AVAILABILITY_ERROR: Record<
  ProgramAvailabilityFailure,
  string
> = {
  deadline_passed: "마감된 공고입니다. 지원서를 제출할 수 없습니다.",
  not_active: "현재 모집 중인 공고가 아닙니다.",
  not_found: "공고를 찾을 수 없습니다.",
};

export function checkProgramAcceptingApplications(
  program: ProgramAvailabilityInput | null | undefined,
  now: Date | number,
): ProgramAvailability {
  if (!program) return { ok: false, reason: "not_found" };
  if (program.status !== "active") return { ok: false, reason: "not_active" };

  const deadlineMs = parseDeadlineMs(program.deadline);
  if (deadlineMs === null) return { ok: true };

  const nowMs = typeof now === "number" ? now : now.getTime();
  if (nowMs > deadlineMs) return { ok: false, reason: "deadline_passed" };
  return { ok: true };
}

// DB 트리거(enforce_application_write 등, 마이그레이션 20261021000000)가 거부하면
// errcode P0001과 함께 사용자용 한국어 메시지를 보낸다. 판정~저장 사이에 마감된 경우 등.
// 그 외 DB 에러는 내부 정보라 노출하지 않으므로 null
export function dbRuleViolationMessage(
  error: { code?: string; message?: string } | null | undefined,
): string | null {
  if (error?.code === "P0001" && error.message) return error.message;
  return null;
}

// Supabase 임베드 결과는 객체 또는 배열로 올 수 있어서 하나로 정규화
export function pickEmbeddedProgram<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
