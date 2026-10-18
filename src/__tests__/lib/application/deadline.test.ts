import {
  checkProgramAcceptingApplications,
  pickEmbeddedProgram,
  PROGRAM_AVAILABILITY_ERROR,
} from "@/src/lib/application/deadline";
import { isProgramActive } from "@/src/lib/adminDashboard/aggregate";

// 모든 판정은 런타임 TZ와 무관해야 한다 (now는 절대 시각으로 고정)

const active = (deadline: string | null) => ({ status: "active", deadline });

// 마감: 2026-10-20 18:00 KST = 2026-10-20T09:00:00Z
const DEADLINE_ISO = "2026-10-20T09:00:00+00:00";
const DEADLINE_MS = Date.parse("2026-10-20T09:00:00Z");

describe("checkProgramAcceptingApplications", () => {
  it("마감 전이면 통과", () => {
    expect(
      checkProgramAcceptingApplications(active(DEADLINE_ISO), DEADLINE_MS - 60_000),
    ).toEqual({ ok: true });
  });

  it("마감 정각은 통과 (마감 시각까지 허용)", () => {
    expect(
      checkProgramAcceptingApplications(active(DEADLINE_ISO), DEADLINE_MS),
    ).toEqual({ ok: true });
  });

  it("마감 직후(1ms)면 deadline_passed", () => {
    expect(
      checkProgramAcceptingApplications(active(DEADLINE_ISO), DEADLINE_MS + 1),
    ).toEqual({ ok: false, reason: "deadline_passed" });
  });

  it("Date 객체로 넘겨도 같은 결과", () => {
    expect(
      checkProgramAcceptingApplications(active(DEADLINE_ISO), new Date(DEADLINE_MS + 1)),
    ).toEqual({ ok: false, reason: "deadline_passed" });
  });

  it("마감일이 null/빈 문자열이면 마감 없음으로 통과", () => {
    const farFuture = Date.parse("2099-01-01T00:00:00Z");
    expect(checkProgramAcceptingApplications(active(null), farFuture)).toEqual({ ok: true });
    expect(checkProgramAcceptingApplications(active(""), farFuture)).toEqual({ ok: true });
  });

  it("날짜만 있는 값은 그날 KST 23:59:59.999까지 허용", () => {
    // 2026-10-20 23:59:59.999 KST = 2026-10-20T14:59:59.999Z
    const endOfDay = Date.parse("2026-10-20T14:59:59.999Z");
    expect(checkProgramAcceptingApplications(active("2026-10-20"), endOfDay)).toEqual({ ok: true });
    expect(
      checkProgramAcceptingApplications(active("2026-10-20"), endOfDay + 1),
    ).toEqual({ ok: false, reason: "deadline_passed" });
  });

  it("오프셋 없는 일시는 KST로 해석", () => {
    // '2026-10-20T18:00' (KST) = DEADLINE_MS
    expect(
      checkProgramAcceptingApplications(active("2026-10-20T18:00"), DEADLINE_MS),
    ).toEqual({ ok: true });
    expect(
      checkProgramAcceptingApplications(active("2026-10-20T18:00"), DEADLINE_MS + 1),
    ).toEqual({ ok: false, reason: "deadline_passed" });
  });

  it("Z / 마이크로초 표기도 같은 시각으로 해석", () => {
    expect(
      checkProgramAcceptingApplications(active("2026-10-20T09:00:00Z"), DEADLINE_MS + 1),
    ).toEqual({ ok: false, reason: "deadline_passed" });
    expect(
      checkProgramAcceptingApplications(active("2026-10-20T09:00:00.000000+00:00"), DEADLINE_MS),
    ).toEqual({ ok: true });
  });

  it("draft/closed/null 상태는 not_active (마감 전이어도)", () => {
    const before = DEADLINE_MS - 60_000;
    for (const status of ["draft", "closed", null]) {
      expect(
        checkProgramAcceptingApplications({ status, deadline: DEADLINE_ISO }, before),
      ).toEqual({ ok: false, reason: "not_active" });
    }
    // 마감도 지났으면 상태 사유가 우선
    expect(
      checkProgramAcceptingApplications({ status: "closed", deadline: DEADLINE_ISO }, DEADLINE_MS + 1),
    ).toEqual({ ok: false, reason: "not_active" });
  });

  it("공고가 없으면 not_found", () => {
    expect(checkProgramAcceptingApplications(null, DEADLINE_MS)).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(checkProgramAcceptingApplications(undefined, DEADLINE_MS)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("관리자 대시보드 isProgramActive와 판정이 일치", () => {
    const cases: Array<[string | null, string | null, number]> = [
      ["active", DEADLINE_ISO, DEADLINE_MS - 1],
      ["active", DEADLINE_ISO, DEADLINE_MS],
      ["active", DEADLINE_ISO, DEADLINE_MS + 1],
      ["active", "2026-10-20", Date.parse("2026-10-20T14:59:59.999Z")],
      ["active", "2026-10-20", Date.parse("2026-10-20T15:00:00Z")],
      ["active", null, DEADLINE_MS],
      ["closed", DEADLINE_ISO, DEADLINE_MS - 1],
      ["draft", null, DEADLINE_MS],
    ];
    for (const [status, deadline, now] of cases) {
      expect(checkProgramAcceptingApplications({ status, deadline }, now).ok).toBe(
        isProgramActive({ status: status as string, deadline }, now),
      );
    }
  });

  it("에러 메시지 정의", () => {
    expect(PROGRAM_AVAILABILITY_ERROR.deadline_passed).toBe(
      "마감된 공고입니다. 지원서를 제출할 수 없습니다.",
    );
    expect(PROGRAM_AVAILABILITY_ERROR.not_active).toBe("현재 모집 중인 공고가 아닙니다.");
  });
});

describe("pickEmbeddedProgram", () => {
  it("객체/배열/null을 정규화", () => {
    const p = { status: "active", deadline: null };
    expect(pickEmbeddedProgram(p)).toBe(p);
    expect(pickEmbeddedProgram([p])).toBe(p);
    expect(pickEmbeddedProgram([])).toBeNull();
    expect(pickEmbeddedProgram(null)).toBeNull();
    expect(pickEmbeddedProgram(undefined)).toBeNull();
  });
});
