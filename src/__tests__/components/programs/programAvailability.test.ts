import {
  AVAILABILITY_BADGE_STYLE,
  getProgramAvailabilityView,
  getProgramDisplay,
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
    for (const tone of ["open", "closed", "muted", "pending"] as const) {
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

describe("getProgramDisplay (목록·상세 공통)", () => {
  const FORM = { fields: [{ id: "f1" }] };
  const EMPTY_FORM = { fields: [] };

  it("접수 중 + 양식 있음 → 접수 중, 지원 가능", () => {
    const d = getProgramDisplay(
      { status: "active", deadline: DEADLINE_ISO, form_schema: FORM },
      BEFORE,
    );
    expect(d).toMatchObject({
      statusLabel: "접수 중",
      statusTone: "open",
      hasForm: true,
      canApply: true,
    });
  });

  it("접수 중 + 양식 없음/빈 양식 → 양식 준비 중, 지원 불가 (목록·상세 같은 결과)", () => {
    for (const form_schema of [null, undefined, EMPTY_FORM]) {
      const d = getProgramDisplay(
        { status: "active", deadline: DEADLINE_ISO, form_schema },
        BEFORE,
      );
      expect(d).toMatchObject({
        statusLabel: "양식 준비 중",
        statusTone: "pending",
        hasForm: false,
        canApply: false,
      });
      expect(d.view.accepting).toBe(true);
    }
  });

  it("접수 불가가 양식 없음보다 우선", () => {
    expect(
      getProgramDisplay({ status: "closed", deadline: null, form_schema: null }, BEFORE)
        .statusLabel,
    ).toBe("접수 마감");
    expect(
      getProgramDisplay(
        { status: "active", deadline: DEADLINE_ISO, form_schema: null },
        AFTER,
      ).statusLabel,
    ).toBe("접수 마감");
    expect(
      getProgramDisplay({ status: "draft", deadline: null, form_schema: null }, BEFORE)
        .statusLabel,
    ).toBe("모집 전");
  });

  it("D-day는 KST 달력 기준, 오늘 마감은 '오늘 마감'", () => {
    // 마감 2026-10-20 18:00 KST, 지금 같은 날 17:59 KST
    const today = getProgramDisplay(
      { status: "active", deadline: DEADLINE_ISO, form_schema: FORM },
      BEFORE,
    );
    expect(today).toMatchObject({ daysLeft: 0, dDayLabel: "오늘 마감", dDayUrgent: true });

    // 지금 2026-10-19 23:30 KST → 하루 전 (24시간 미만이어도 달력으로 D-1)
    const yesterday = getProgramDisplay(
      { status: "active", deadline: DEADLINE_ISO, form_schema: FORM },
      Date.parse("2026-10-19T14:30:00Z"),
    );
    expect(yesterday).toMatchObject({ daysLeft: 1, dDayLabel: "D-1", dDayUrgent: true });

    // 8일 남으면 급하지 않음
    const later = getProgramDisplay(
      { status: "active", deadline: DEADLINE_ISO, form_schema: FORM },
      Date.parse("2026-10-12T00:00:00Z"),
    );
    expect(later).toMatchObject({ daysLeft: 8, dDayLabel: "D-8", dDayUrgent: false });
  });

  it("양식 준비 중이어도 접수 중이면 D-day 표시", () => {
    expect(
      getProgramDisplay(
        { status: "active", deadline: DEADLINE_ISO, form_schema: null },
        BEFORE,
      ).dDayLabel,
    ).toBe("오늘 마감");
  });

  it("접수 불가거나 마감일이 없으면 D-day 없음", () => {
    for (const [program, now] of [
      [{ status: "active", deadline: DEADLINE_ISO, form_schema: FORM }, AFTER],
      [{ status: "closed", deadline: DEADLINE_ISO, form_schema: FORM }, BEFORE],
      [{ status: "active", deadline: null, form_schema: FORM }, BEFORE],
    ] as const) {
      const d = getProgramDisplay(program, now);
      expect(d.daysLeft).toBeNull();
      expect(d.dDayLabel).toBeNull();
      expect(d.dDayUrgent).toBe(false);
    }
  });

  it("마감 날짜는 KST로 표시 (UTC로는 전날이어도)", () => {
    // 2026-10-20 08:00 KST = 2026-10-19T23:00Z
    expect(
      getProgramDisplay(
        { status: "closed", deadline: "2026-10-19T23:00:00+00:00", form_schema: null },
        BEFORE,
      ).deadlineLabel,
    ).toBe("2026. 10. 20.");
    expect(
      getProgramDisplay({ status: "active", deadline: null, form_schema: null }, BEFORE)
        .deadlineLabel,
    ).toBeNull();
  });
});
