import {
  AVAILABILITY_BADGE_STYLE,
  getProgramAvailabilityView,
} from "@/src/components/programs/programAvailability";
import { checkProgramAcceptingApplications } from "@/src/lib/application/deadline";

// 마감: 2026-10-20 18:00 KST = 2026-10-20T09:00:00Z
const DEADLINE_ISO = "2026-10-20T09:00:00+00:00";
const DEADLINE_MS = Date.parse("2026-10-20T09:00:00Z");
const BEFORE = DEADLINE_MS - 60_000;
const AFTER = DEADLINE_MS + 1;

describe("getProgramAvailabilityView", () => {
  it("접수 중: active + 마감 전", () => {
    const view = getProgramAvailabilityView(
      { status: "active", deadline: DEADLINE_ISO },
      BEFORE,
    );
    expect(view).toEqual({
      availability: { ok: true },
      accepting: true,
      label: "접수 중",
      disabledLabel: "",
      tone: "open",
    });
  });

  it("마감 정각은 접수 중 (서버와 같은 경계)", () => {
    expect(
      getProgramAvailabilityView({ status: "active", deadline: DEADLINE_ISO }, DEADLINE_MS)
        .accepting,
    ).toBe(true);
  });

  it("active + 마감일 없음은 접수 중", () => {
    expect(
      getProgramAvailabilityView({ status: "active", deadline: null }, AFTER).label,
    ).toBe("접수 중");
  });

  it("active + 마감 지남은 접수 마감 (기간 문구)", () => {
    const view = getProgramAvailabilityView(
      { status: "active", deadline: DEADLINE_ISO },
      AFTER,
    );
    expect(view).toMatchObject({
      availability: { ok: false, reason: "deadline_passed" },
      accepting: false,
      label: "접수 마감",
      disabledLabel: "접수 기간이 지났습니다",
      tone: "closed",
    });
  });

  it("closed는 마감일이 미래여도 접수 마감", () => {
    const view = getProgramAvailabilityView(
      { status: "closed", deadline: DEADLINE_ISO },
      BEFORE,
    );
    expect(view).toMatchObject({
      availability: { ok: false, reason: "not_active" },
      accepting: false,
      label: "접수 마감",
      disabledLabel: "접수가 마감되었습니다",
      tone: "closed",
    });
  });

  it("draft는 마감과 무관하게 모집 전", () => {
    for (const now of [BEFORE, AFTER]) {
      expect(
        getProgramAvailabilityView({ status: "draft", deadline: DEADLINE_ISO }, now),
      ).toMatchObject({
        accepting: false,
        label: "모집 전",
        disabledLabel: "아직 모집 중이 아닙니다",
        tone: "muted",
      });
    }
  });

  it("알 수 없는 status/null은 모집 중 아님", () => {
    for (const status of [null, "archived"]) {
      expect(
        getProgramAvailabilityView({ status, deadline: DEADLINE_ISO }, BEFORE),
      ).toMatchObject({
        availability: { ok: false, reason: "not_active" },
        accepting: false,
        label: "모집 중 아님",
        tone: "muted",
      });
    }
  });

  it("공고가 없으면 not_found, 모집 중 아님", () => {
    for (const program of [null, undefined]) {
      expect(getProgramAvailabilityView(program, BEFORE)).toMatchObject({
        availability: { ok: false, reason: "not_found" },
        accepting: false,
        label: "모집 중 아님",
        tone: "muted",
      });
    }
  });

  it("availability는 서버 판정 함수 결과와 항상 같음", () => {
    const programs = [
      { status: "active", deadline: DEADLINE_ISO },
      { status: "active", deadline: null },
      { status: "closed", deadline: DEADLINE_ISO },
      { status: "draft", deadline: null },
      null,
    ];
    for (const program of programs) {
      for (const now of [BEFORE, DEADLINE_MS, AFTER]) {
        const view = getProgramAvailabilityView(program, now);
        const expected = checkProgramAcceptingApplications(program, now);
        expect(view.availability).toEqual(expected);
        expect(view.accepting).toBe(expected.ok);
      }
    }
  });

  it("모든 tone에 뱃지 스타일이 있음", () => {
    for (const tone of ["open", "closed", "muted"] as const) {
      expect(AVAILABILITY_BADGE_STYLE[tone]).toEqual(
        expect.objectContaining({
          borderColor: expect.any(String),
          color: expect.any(String),
          backgroundColor: expect.any(String),
        }),
      );
    }
  });
});
