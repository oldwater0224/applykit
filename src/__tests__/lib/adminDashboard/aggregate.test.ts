import {
  aggregateAdminDashboard,
  isProgramActive,
  kstDayStartMs,
  kstDaysLeft,
  kstWeekStartMs,
  parseDeadlineMs,
  pickRecentApplicationIds,
  resolveVerdict,
  toKstDateKey,
  type DashboardApplicationRow,
  type DashboardProgramRow,
} from "@/src/lib/adminDashboard/aggregate";

// 기준 시각: 2026-10-15(목) 10:00 KST = 2026-10-15T01:00:00Z
const NOW = new Date("2026-10-15T01:00:00Z");

const program = (
  over: Partial<DashboardProgramRow> & { id: string },
): DashboardProgramRow => ({
  title: `공고 ${over.id}`,
  status: "active",
  deadline: null,
  created_at: "2026-09-01T00:00:00Z",
  ...over,
});

const app = (
  over: Partial<DashboardApplicationRow> & { id: string; program_id: string },
): DashboardApplicationRow => ({
  status: "submitted",
  is_complete: true,
  submitted_at: "2026-10-14T00:00:00Z",
  created_at: "2026-10-13T00:00:00Z",
  review_results: [],
  ...over,
});

describe("KST 날짜 유틸", () => {
  it("UTC 15:00 이후는 KST 다음 날로 본다", () => {
    expect(toKstDateKey(Date.parse("2026-10-14T14:59:59Z"))).toBe("2026-10-14");
    expect(toKstDateKey(Date.parse("2026-10-14T15:00:00Z"))).toBe("2026-10-15");
  });

  it("KST 자정을 UTC 전날 15:00으로 계산한다", () => {
    expect(new Date(kstDayStartMs(NOW.getTime())).toISOString()).toBe(
      "2026-10-14T15:00:00.000Z",
    );
  });

  it("주 시작은 KST 월요일 00:00", () => {
    // 2026-10-15(목) → 2026-10-12(월) 00:00 KST
    expect(new Date(kstWeekStartMs(NOW.getTime())).toISOString()).toBe(
      "2026-10-11T15:00:00.000Z",
    );
    // 일요일 23:59 KST는 직전 월요일 주에 속함
    const sundayNight = Date.parse("2026-10-18T14:59:00Z");
    expect(new Date(kstWeekStartMs(sundayNight)).toISOString()).toBe(
      "2026-10-11T15:00:00.000Z",
    );
    // 월요일 00:00 KST는 새 주의 시작
    const mondayMidnight = Date.parse("2026-10-18T15:00:00Z");
    expect(kstWeekStartMs(mondayMidnight)).toBe(mondayMidnight);
  });

  it("연말 주 경계: 2027-01-01(금) KST는 2026-12-28(월) 주", () => {
    // 2027-01-01 00:30 KST = 2026-12-31T15:30Z (UTC로는 아직 목요일)
    expect(
      new Date(kstWeekStartMs(Date.parse("2026-12-31T15:30:00Z"))).toISOString(),
    ).toBe("2026-12-27T15:00:00.000Z");
  });
});

describe("parseDeadlineMs", () => {
  it("오프셋 없는 일시는 KST로 해석한다 (datetime-local 원본)", () => {
    expect(parseDeadlineMs("2026-10-20T18:00")).toBe(
      Date.parse("2026-10-20T09:00:00Z"),
    );
    expect(parseDeadlineMs("2026-10-20 18:00:00")).toBe(
      Date.parse("2026-10-20T09:00:00Z"),
    );
  });

  it("오프셋이 있으면 그대로 해석한다", () => {
    expect(parseDeadlineMs("2026-10-20T09:00:00+00:00")).toBe(
      Date.parse("2026-10-20T09:00:00Z"),
    );
    expect(parseDeadlineMs("2026-10-20T09:00:00Z")).toBe(
      Date.parse("2026-10-20T09:00:00Z"),
    );
  });

  it("PostgREST timestamptz 응답 형식(마이크로초 + +00:00)을 해석한다", () => {
    // 실제 DB(작업 5 확인) 형식: 9999-99-99T99:99:99(.999999)+99:99
    expect(parseDeadlineMs("2026-10-20T09:00:00.123456+00:00")).toBe(
      Date.parse("2026-10-20T09:00:00.123Z"),
    );
  });

  it("날짜만 있으면 KST 그날 끝으로 본다", () => {
    expect(parseDeadlineMs("2026-10-20")).toBe(
      Date.parse("2026-10-20T15:00:00Z") - 1,
    );
  });

  it("빈 값/잘못된 값은 null", () => {
    expect(parseDeadlineMs(null)).toBeNull();
    expect(parseDeadlineMs("")).toBeNull();
    expect(parseDeadlineMs("not-a-date")).toBeNull();
  });
});

describe("kstDaysLeft", () => {
  const now = NOW.getTime();
  it("오늘 마감은 0", () => {
    expect(kstDaysLeft(Date.parse("2026-10-15T14:59:00Z"), now)).toBe(0);
  });
  it("KST 기준 다음 날이면 1 (UTC로는 같은 날이어도)", () => {
    // 2026-10-15T15:00Z = 10/16 00:00 KST
    expect(kstDaysLeft(Date.parse("2026-10-15T15:00:00Z"), now)).toBe(1);
  });
  it("7일 뒤는 7", () => {
    expect(kstDaysLeft(parseDeadlineMs("2026-10-22T23:00")!, now)).toBe(7);
  });
});

describe("resolveVerdict", () => {
  it("심사 결과가 없으면 null", () => {
    expect(resolveVerdict([])).toBeNull();
    expect(resolveVerdict(null)).toBeNull();
  });
  it("여러 심사가 있으면 가장 최근 reviewed_at 기준", () => {
    expect(
      resolveVerdict([
        { is_passed: true, reviewed_at: "2026-10-10T00:00:00Z" },
        { is_passed: false, reviewed_at: "2026-10-12T00:00:00Z" },
      ]),
    ).toBe("failed");
  });
});

describe("isProgramActive", () => {
  const now = NOW.getTime();
  it("active + 마감 전/마감일 없음만 진행 중", () => {
    expect(isProgramActive({ status: "active", deadline: null }, now)).toBe(true);
    expect(
      isProgramActive({ status: "active", deadline: "2026-10-16T00:00" }, now),
    ).toBe(true);
    expect(
      isProgramActive({ status: "active", deadline: "2026-10-15T09:00" }, now),
    ).toBe(false);
    expect(isProgramActive({ status: "draft", deadline: null }, now)).toBe(false);
    expect(isProgramActive({ status: "closed", deadline: null }, now)).toBe(false);
  });
});

describe("pickRecentApplicationIds", () => {
  it("submitted_at ?? created_at 내림차순, limit 적용", () => {
    const apps = [
      app({ id: "a", program_id: "p", submitted_at: "2026-10-01T00:00:00Z" }),
      app({
        id: "b",
        program_id: "p",
        is_complete: false,
        status: "draft",
        submitted_at: null,
        created_at: "2026-10-14T00:00:00Z",
      }),
      app({ id: "c", program_id: "p", submitted_at: "2026-10-10T00:00:00Z" }),
    ];
    expect(pickRecentApplicationIds(apps, 2)).toEqual(["b", "c"]);
  });
});

describe("aggregateAdminDashboard", () => {
  const programs: DashboardProgramRow[] = [
    program({ id: "p1", deadline: "2026-10-18T18:00" }), // D-3
    program({ id: "p2", deadline: "2026-10-15T23:00" }), // D-0
    program({ id: "p3", deadline: "2026-10-30T18:00" }), // D-15 → 제외
    program({ id: "p4", status: "draft", deadline: "2026-10-16T18:00" }), // draft → 제외
    program({ id: "p5", deadline: "2026-10-14T18:00" }), // 이미 마감 → 제외, 비활성
    program({ id: "p6", status: "closed" }),
  ];

  const applications: DashboardApplicationRow[] = [
    // 이번 주 제출, 심사 대기
    app({ id: "a1", program_id: "p1", submitted_at: "2026-10-12T00:00:00Z" }), // 10/12 09:00 KST
    // 이번 주 첫 순간 (월 00:00 KST)
    app({ id: "a2", program_id: "p1", submitted_at: "2026-10-11T15:00:00Z" }),
    // 지난 주 마지막 순간 (일 23:59:59 KST) + 합격
    app({
      id: "a3",
      program_id: "p2",
      submitted_at: "2026-10-11T14:59:59Z",
      review_results: [{ is_passed: true, reviewed_at: "2026-10-13T00:00:00Z" }],
    }),
    // 지난 주 월 00:00 KST + 불합격
    app({
      id: "a4",
      program_id: "p2",
      submitted_at: "2026-10-04T15:00:00Z",
      review_results: [{ is_passed: false, reviewed_at: "2026-10-13T00:00:00Z" }],
    }),
    // 2주 전 → 주간 집계 제외, 일별에는 포함
    app({ id: "a5", program_id: "p3", submitted_at: "2026-10-01T00:00:00Z" }),
    // 30일 범위 밖 (9/15 KST) → 일별 제외
    app({ id: "a6", program_id: "p3", submitted_at: "2026-09-15T00:00:00Z" }),
    // draft → 제출 집계 제외, total에는 포함
    app({
      id: "a7",
      program_id: "p1",
      status: "draft",
      is_complete: false,
      submitted_at: null,
      created_at: "2026-10-15T00:30:00Z",
    }),
    // 다른 기관 공고 지원서 → 무시
    app({ id: "x1", program_id: "other" }),
  ];

  const result = aggregateAdminDashboard({
    programs,
    applications,
    now: NOW,
    applicantLabels: { a1: "스타트업A" },
  });

  it("KPI", () => {
    expect(result.kpis).toEqual({
      activePrograms: 3, // p1, p2, p3
      totalPrograms: 6,
      totalApplications: 6, // a1~a6
      thisWeekApplications: 2, // a1, a2
      lastWeekApplications: 2, // a3, a4
      pendingReviews: 4, // a1, a2, a5, a6
      passedCount: 1,
      failedCount: 1,
    });
  });

  it("일별 집계는 오늘 포함 30일, 빈 날짜는 0, KST 날짜 기준", () => {
    const daily = result.dailyApplications;
    expect(daily).toHaveLength(30);
    expect(daily[0].date).toBe("2026-09-16");
    expect(daily[29].date).toBe("2026-10-15");
    const byDate = Object.fromEntries(daily.map((d) => [d.date, d.count]));
    expect(byDate["2026-10-12"]).toBe(2); // a1(09:00 KST), a2(00:00 KST)
    expect(byDate["2026-10-11"]).toBe(1); // a3(23:59:59 KST)
    expect(byDate["2026-10-05"]).toBe(1); // a4
    expect(byDate["2026-10-01"]).toBe(1); // a5
    expect(byDate["2026-10-15"]).toBe(0);
    expect(daily.reduce((s, d) => s + d.count, 0)).toBe(5); // a6 제외
  });

  it("마감 임박: active + 마감 전 + D-7 이내, 임박순", () => {
    expect(result.upcomingDeadlines).toEqual([
      {
        programId: "p2",
        title: "공고 p2",
        deadline: "2026-10-15T23:00",
        daysLeft: 0,
        applicationCount: 2,
      },
      {
        programId: "p1",
        title: "공고 p1",
        deadline: "2026-10-18T18:00",
        daysLeft: 3,
        applicationCount: 2, // draft a7 제외
      },
    ]);
  });

  it("최근 지원서: draft 포함, 최신 활동순, 라벨/판정 포함, 타 기관 제외", () => {
    const recent = result.recentApplications;
    expect(recent.map((r) => r.id)).toEqual([
      "a7",
      "a1",
      "a2",
      "a3",
      "a4",
      "a5",
      "a6",
    ]);
    expect(recent[1]).toMatchObject({
      programTitle: "공고 p1",
      applicantLabel: "스타트업A",
      reviewVerdict: null,
      isComplete: true,
    });
    expect(recent[3].reviewVerdict).toBe("passed");
    expect(recent[2].applicantLabel).toBeNull();
  });

  it("공고별 요약", () => {
    const byId = Object.fromEntries(
      result.programSummaries.map((s) => [s.programId, s]),
    );
    expect(result.programSummaries.map((s) => s.programId)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
    ]);
    expect(byId.p1).toMatchObject({
      total: 3,
      completed: 2,
      pendingReview: 2,
      passed: 0,
      failed: 0,
    });
    expect(byId.p2).toMatchObject({
      total: 2,
      completed: 2,
      pendingReview: 0,
      passed: 1,
      failed: 1,
    });
    expect(byId.p6).toMatchObject({ total: 0, status: "closed" });
  });

  it("데이터가 없어도 30일 0 채움", () => {
    const empty = aggregateAdminDashboard({
      programs: [],
      applications: [],
      now: NOW,
    });
    expect(empty.dailyApplications).toHaveLength(30);
    expect(empty.dailyApplications.every((d) => d.count === 0)).toBe(true);
    expect(empty.kpis.totalPrograms).toBe(0);
    expect(empty.generatedAt).toBe(NOW.toISOString());
  });
});
