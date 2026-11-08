// getDashboardStats 의 이번 달 / 전년 동월 집계 (#64)
// - 12월에 전년 12월 건수가 0이 되던 문제
// - 매월 1일 KST 새벽에 이번 달이 지난달로 계산되던 문제
// - 미래 날짜 행이 이번 달에 섞이던 문제
// Supabase 클라이언트는 목으로 대체한다. 집계는 funding_rounds 첫 select 결과만 쓴다.

type Row = {
  id: string;
  round_name: string;
  amount: number | null;
  announced_date: string | null;
};

const state: { rows: Row[] } = { rows: [] };

function chain() {
  const result = () => ({ data: state.rows, error: null });
  const c = {
    select: () => c,
    not: () => c,
    order: () => c,
    limit: () => c,
    then: (resolve: (v: { data: unknown; error: unknown }) => void) =>
      resolve(result()),
  };
  return c;
}

jest.mock("@/src/lib/supabase/server", () => ({
  createClient: async () => ({ from: () => chain() }),
}));

import { getDashboardStats } from "@/src/app/actions/dashboardAction";

const row = (id: string, announced_date: string | null, amount = 100): Row => ({
  id,
  round_name: "Series A",
  amount,
  announced_date,
});

const ROWS: Row[] = [
  row("p-nov", "2025-11-20"),
  row("p-dec-1", "2025-12-01"),
  row("p-dec-31", "2025-12-31"),
  row("p-jan", "2026-01-01"),
  row("nov-30", "2026-11-30", 1000),
  row("dec-1", "2026-12-01", 10),
  row("dec-15", "2026-12-15", 20),
  row("future", "2027-01-05", 5000),
  row("null-date", null),
];

beforeEach(() => {
  state.rows = ROWS;
});
afterEach(() => {
  jest.useRealTimers();
});

describe("getDashboardStats 월 범위", () => {
  it("12월 중순: 전년 12월 건수를 세고, 다음 달 이후 행은 이번 달에서 제외", async () => {
    jest.useFakeTimers({ now: new Date("2026-12-15T03:00:00Z") });
    const stats = await getDashboardStats();
    expect(stats.prevYearMonthlyRounds).toBe(2); // 2025-12-01, 2025-12-31
    expect(stats.monthlyRounds).toBe(2); // 12-01, 12-15 (2027-01-05 제외)
    expect(stats.monthlyAmount).toBe(30);
    expect(stats.totalRounds).toBe(ROWS.length);
  });

  it("12월 1일 KST 00:00 (UTC 11-30 15:00): 이번 달은 12월", async () => {
    jest.useFakeTimers({ now: new Date("2026-11-30T15:00:00Z") });
    const stats = await getDashboardStats();
    expect(stats.monthlyRounds).toBe(2); // 11-30 제외
    expect(stats.monthlyAmount).toBe(30);
    expect(stats.prevYearMonthlyRounds).toBe(2);
  });

  it("11월 30일 KST 23:59: 이번 달은 11월", async () => {
    jest.useFakeTimers({ now: new Date("2026-11-30T14:59:59Z") });
    const stats = await getDashboardStats();
    expect(stats.monthlyRounds).toBe(1);
    expect(stats.monthlyAmount).toBe(1000);
    expect(stats.prevYearMonthlyRounds).toBe(1); // 2025-11-20
  });
});
