// 운영기관 대시보드 집계 - DB 조회와 분리된 순수 함수 모음
//
// 타임존 규칙 (모두 KST, UTC+9 고정 - 한국은 DST 없음):
// - 날짜 키: KST 달력 날짜 'YYYY-MM-DD'
// - 주 시작: KST 월요일 00:00
// - D-day: KST 달력 날짜 차이 (오늘 마감 = 0)
// - 마감일 문자열에 오프셋이 없으면(datetime-local 입력 원본 등) KST로 해석
//
// now를 인자로 받아 테스트에서 시각을 고정할 수 있게 한다.

import type {
  AdminDashboardOverview,
  ProgramSummary,
  RecentApplication,
  ReviewVerdict,
  UpcomingDeadline,
} from "@/src/types/adminDashboard";

import {
  DAY_MS,
  KST_OFFSET_MS,
  parseDeadlineMs,
} from "@/src/lib/datetime/kst";

// 기존 import 경로 호환을 위해 재export
// parseDeadlineMs는 지원서 서버 마감 판정(#58)과 규칙을 공유하려고 kst.ts로 옮김
export { DAY_MS, KST_OFFSET_MS, parseDeadlineMs };

export const DAILY_RANGE_DAYS = 30;
export const UPCOMING_DEADLINE_DAYS = 7;
export const RECENT_APPLICATIONS_LIMIT = 10;

// ============================================
// 입력 Row 타입 (Server Action의 select 컬럼과 1:1)
// ============================================
export interface DashboardProgramRow {
  id: string;
  title: string;
  status: string | null;
  deadline: string | null;
  created_at: string;
}

export interface DashboardReviewRow {
  is_passed: boolean;
  reviewed_at: string;
}

export interface DashboardApplicationRow {
  id: string;
  program_id: string;
  status: string | null;
  is_complete: boolean;
  submitted_at: string | null;
  created_at: string;
  review_results: DashboardReviewRow[] | null;
}

// ============================================
// 날짜 유틸 (KST)
// ============================================

// 주어진 시각이 속한 KST 날짜의 00:00을 UTC epoch ms로 반환
export function kstDayStartMs(ms: number): number {
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
}

// 주어진 시각의 KST 날짜 키 'YYYY-MM-DD'
export function toKstDateKey(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// 주어진 시각이 속한 주의 KST 월요일 00:00 (UTC epoch ms)
export function kstWeekStartMs(ms: number): number {
  const dayStart = kstDayStartMs(ms);
  // KST 기준 요일 (0=일 ~ 6=토) → 월요일부터 지난 일수
  const dow = new Date(ms + KST_OFFSET_MS).getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  return dayStart - daysSinceMonday * DAY_MS;
}

// KST 달력 기준 남은 일수 (마감일 날짜 - 오늘 날짜)
export function kstDaysLeft(deadlineMs: number, nowMs: number): number {
  return Math.round((kstDayStartMs(deadlineMs) - kstDayStartMs(nowMs)) / DAY_MS);
}

function parseMs(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

// ============================================
// 판정 / 상태
// ============================================

// 지원서 판정 - 심사 결과가 여러 개면(심사자 여러 명) 가장 최근 reviewed_at 기준
export function resolveVerdict(
  reviews: DashboardReviewRow[] | null | undefined,
): ReviewVerdict | null {
  if (!reviews || reviews.length === 0) return null;
  let latest = reviews[0];
  for (const r of reviews) {
    if ((parseMs(r.reviewed_at) ?? 0) > (parseMs(latest.reviewed_at) ?? 0)) {
      latest = r;
    }
  }
  return latest.is_passed ? "passed" : "failed";
}

// 진행 중 공고: status === 'active' 이고 마감일이 없거나 아직 지나지 않음
export function isProgramActive(
  program: Pick<DashboardProgramRow, "status" | "deadline">,
  nowMs: number,
): boolean {
  if (program.status !== "active") return false;
  const deadlineMs = parseDeadlineMs(program.deadline);
  return deadlineMs === null || deadlineMs >= nowMs;
}

// 최근 활동 시각 - 제출 시각이 있으면 제출 시각, 없으면 생성 시각
function activityMs(app: DashboardApplicationRow): number {
  return parseMs(app.submitted_at) ?? parseMs(app.created_at) ?? 0;
}

// 최근 지원서 id 선택 - Server Action이 이 id들에 대해서만 form_data를 추가 조회
export function pickRecentApplicationIds(
  applications: DashboardApplicationRow[],
  limit: number = RECENT_APPLICATIONS_LIMIT,
): string[] {
  return [...applications]
    .sort((a, b) => activityMs(b) - activityMs(a) || b.id.localeCompare(a.id))
    .slice(0, limit)
    .map((a) => a.id);
}

// ============================================
// 메인 집계
// ============================================

export interface AggregateInput {
  programs: DashboardProgramRow[];
  applications: DashboardApplicationRow[];
  now: Date;
  // 지원서 id → 표시 라벨 (회사명). 없으면 null
  applicantLabels?: Record<string, string | null>;
}

export function aggregateAdminDashboard({
  programs,
  applications,
  now,
  applicantLabels = {},
}: AggregateInput): AdminDashboardOverview {
  const nowMs = now.getTime();
  const todayStart = kstDayStartMs(nowMs);
  const thisWeekStart = kstWeekStartMs(nowMs);
  const lastWeekStart = thisWeekStart - 7 * DAY_MS;
  const dailyRangeStart = todayStart - (DAILY_RANGE_DAYS - 1) * DAY_MS;

  const programById = new Map(programs.map((p) => [p.id, p]));

  // 공고별 누적 버킷
  const summaryById = new Map<string, ProgramSummary>();
  for (const p of programs) {
    summaryById.set(p.id, {
      programId: p.id,
      title: p.title,
      status: p.status ?? "draft",
      deadline: p.deadline,
      total: 0,
      completed: 0,
      pendingReview: 0,
      passed: 0,
      failed: 0,
    });
  }

  // 일별 버킷 - 30일 모두 0으로 미리 채움
  const dailyCounts = new Map<string, number>();
  for (let i = 0; i < DAILY_RANGE_DAYS; i++) {
    dailyCounts.set(toKstDateKey(dailyRangeStart + i * DAY_MS), 0);
  }

  let totalApplications = 0;
  let thisWeekApplications = 0;
  let lastWeekApplications = 0;
  let pendingReviews = 0;
  let passedCount = 0;
  let failedCount = 0;

  const verdictByApp = new Map<string, ReviewVerdict | null>();

  for (const app of applications) {
    const summary = summaryById.get(app.program_id);
    // 기관 공고에 속하지 않는 지원서는 무시 (방어적)
    if (!summary) continue;

    const verdict = resolveVerdict(app.review_results);
    verdictByApp.set(app.id, verdict);

    summary.total += 1;
    if (!app.is_complete) continue;

    // 이하 제출 완료 지원서만
    summary.completed += 1;
    totalApplications += 1;

    if (verdict === "passed") {
      summary.passed += 1;
      passedCount += 1;
    } else if (verdict === "failed") {
      summary.failed += 1;
      failedCount += 1;
    } else {
      summary.pendingReview += 1;
      pendingReviews += 1;
    }

    // 제출 시각 기준 기간 집계 (submitted_at 없는 비정상 데이터는 기간 집계에서 제외)
    const submittedMs = parseMs(app.submitted_at);
    if (submittedMs === null || submittedMs > nowMs) continue;

    if (submittedMs >= thisWeekStart) thisWeekApplications += 1;
    else if (submittedMs >= lastWeekStart) lastWeekApplications += 1;

    if (submittedMs >= dailyRangeStart) {
      const key = toKstDateKey(submittedMs);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }
  }

  const programSummaries = programs.map((p) => summaryById.get(p.id)!);

  // 마감 임박 공고 - active이고 마감 전이며 D-7 이내
  const upcomingDeadlines: UpcomingDeadline[] = [];
  for (const p of programs) {
    if (p.status !== "active" || !p.deadline) continue;
    const deadlineMs = parseDeadlineMs(p.deadline);
    if (deadlineMs === null || deadlineMs < nowMs) continue;
    const daysLeft = kstDaysLeft(deadlineMs, nowMs);
    if (daysLeft > UPCOMING_DEADLINE_DAYS) continue;
    upcomingDeadlines.push({
      programId: p.id,
      title: p.title,
      deadline: p.deadline,
      daysLeft,
      applicationCount: summaryById.get(p.id)?.completed ?? 0,
    });
  }
  upcomingDeadlines.sort(
    (a, b) =>
      (parseDeadlineMs(a.deadline) ?? 0) - (parseDeadlineMs(b.deadline) ?? 0),
  );

  // 최근 지원서
  const appById = new Map(applications.map((a) => [a.id, a]));
  const recentApplications: RecentApplication[] = pickRecentApplicationIds(
    applications.filter((a) => programById.has(a.program_id)),
  ).map((id) => {
    const app = appById.get(id)!;
    return {
      id: app.id,
      programId: app.program_id,
      programTitle: programById.get(app.program_id)?.title ?? "",
      applicantLabel: applicantLabels[app.id] ?? null,
      status: app.status ?? "draft",
      isComplete: app.is_complete,
      submittedAt: app.submitted_at,
      createdAt: app.created_at,
      reviewVerdict: verdictByApp.get(app.id) ?? null,
    };
  });

  return {
    kpis: {
      activePrograms: programs.filter((p) => isProgramActive(p, nowMs)).length,
      totalPrograms: programs.length,
      totalApplications,
      thisWeekApplications,
      lastWeekApplications,
      pendingReviews,
      passedCount,
      failedCount,
    },
    dailyApplications: [...dailyCounts.entries()].map(([date, count]) => ({
      date,
      count,
    })),
    upcomingDeadlines,
    recentApplications,
    programSummaries,
    generatedAt: now.toISOString(),
  };
}
