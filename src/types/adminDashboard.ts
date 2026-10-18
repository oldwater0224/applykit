// 운영기관(관리자) 대시보드 집계 타입
// - getAdminDashboardOverview(orgId) Server Action의 반환 형태
// - 날짜 경계(주 시작, 일별 버킷, D-day)는 모두 KST(UTC+9) 기준
// - 계산 로직은 src/lib/adminDashboard/aggregate.ts 참고

// 심사 판정 - review_results 기준 (지원서당 가장 최근 reviewed_at의 is_passed)
// 심사 결과가 없으면 null
export type ReviewVerdict = "passed" | "failed";

export interface AdminDashboardKpis {
  // status === 'active' 이고 마감일이 없거나 아직 지나지 않은 공고 수
  activePrograms: number;
  // 기관의 전체 공고 수 (draft/closed 포함)
  totalPrograms: number;
  // 제출 완료(is_complete=true) 지원서 수 - draft(작성 중) 제외
  totalApplications: number;
  // 이번 주(KST 월요일 00:00 ~ 현재) submitted_at 기준 제출 건수
  thisWeekApplications: number;
  // 지난 주(KST 월요일 00:00 ~ 일요일 24:00) submitted_at 기준 제출 건수
  lastWeekApplications: number;
  // 제출 완료됐지만 review_results가 하나도 없는 지원서 수
  pendingReviews: number;
  // 판정이 합격인 지원서 수 (지원서 단위, 심사 건수 아님)
  passedCount: number;
  // 판정이 불합격인 지원서 수
  failedCount: number;
}

export interface DailyApplicationCount {
  // KST 날짜 'YYYY-MM-DD'
  date: string;
  count: number;
}

export interface UpcomingDeadline {
  programId: string;
  title: string;
  // DB 원본 값
  deadline: string;
  // KST 달력 기준 남은 일수 (0 = 오늘 마감 D-day, 7 = D-7)
  daysLeft: number;
  // 해당 공고의 제출 완료 지원서 수 (draft 제외)
  applicationCount: number;
}

export interface RecentApplication {
  id: string;
  programId: string;
  programTitle: string;
  // 폼 데이터에서 추출한 회사명 (extractCompanyName). 추출 불가 시 null
  // auth.users 조인이 불가능해 이메일/이름은 제공하지 않음
  applicantLabel: string | null;
  // applications.status 원본 값 (draft | submitted | passed | failed)
  status: string;
  isComplete: boolean;
  submittedAt: string | null;
  createdAt: string;
  // review_results 기반 판정 (없으면 null) - 원 스펙 외 추가 필드
  reviewVerdict: ReviewVerdict | null;
}

export interface ProgramSummary {
  programId: string;
  title: string;
  status: string;
  deadline: string | null;
  // draft 포함 전체 지원서 수 (getProgramApplications와 동일 기준)
  total: number;
  // 제출 완료(is_complete=true) 지원서 수
  completed: number;
  // 제출 완료 + 심사 결과 없음
  pendingReview: number;
  passed: number;
  failed: number;
}

export interface AdminDashboardOverview {
  kpis: AdminDashboardKpis;
  // 오늘 포함 최근 30일 (KST), 오래된 날짜 → 최신 순, 빈 날짜는 0
  dailyApplications: DailyApplicationCount[];
  // active 공고 중 마감 전이고 D-7 이내, 마감 임박순
  upcomingDeadlines: UpcomingDeadline[];
  // 최근 활동(submitted_at ?? created_at) 내림차순 10건, draft 포함
  recentApplications: RecentApplication[];
  // 공고별 요약 - programs.created_at 내림차순 (getPrograms와 동일)
  programSummaries: ProgramSummary[];
  // 집계 기준 시각 (ISO) - UI에서 "기준 시각" 표시용
  generatedAt: string;
}
