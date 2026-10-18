"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/src/hooks/useAuth";
import { useAdminDashboard } from "@/src/hooks/useAdminDashboard";
import type {
  AdminDashboardOverview,
  ProgramSummary,
  RecentApplication,
  UpcomingDeadline,
} from "@/src/types/adminDashboard";
import { KpiStrip, type KpiItem } from "@/src/components/dashboard/kpiStrip";
import {
  DashboardPanel,
  SkeletonBlock,
} from "@/src/components/dashboard/dashboardPanel";
import {
  DataTable,
  NumericCell,
  type DataTableColumn,
} from "@/src/components/dashboard/dataTable";
import {
  ApplicationStatusBadge,
  DeadlineBadge,
  ProgramStatusBadge,
  VerdictBadge,
} from "@/src/components/dashboard/statusBadge";
import { ApplicationTrendChart } from "@/src/components/dashboard/applicationTrendChart";
import {
  formatDeadline,
  formatKstIso,
} from "@/src/components/dashboard/formatters";

/* ------------------------------------------------------------------ */
/* 섹션 앵커 (KPI 클릭 시 이동)                                         */
/* ------------------------------------------------------------------ */

const SECTION = {
  recent: "recent-applications",
  programs: "program-summary",
} as const;

/* ------------------------------------------------------------------ */
/* 페이지                                                              */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data, error, refetch, isFetching } = useAdminDashboard();

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="size-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  // 데이터도 에러도 없으면 로딩 (orgId 대기로 쿼리가 비활성인 동안 포함)
  const loading = !data && !error;

  return (
    <div className="mx-auto w-full max-w-(--max-width) space-y-4 p-4 lg:space-y-5 lg:p-6">
      <PageIntro
        generatedAt={data?.generatedAt ?? null}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : (
        <DashboardBody data={data} loading={loading} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 상단 소개 (헤더 브레드크럼과 중복되지 않게 간소화)                    */
/* ------------------------------------------------------------------ */

function PageIntro({
  generatedAt,
  isFetching,
  onRefresh,
}: {
  generatedAt: string | null;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h1 className="text-[18px] font-bold tracking-tight text-(--dash-text)">
          운영 현황
        </h1>
        <p className="mt-0.5 text-[12px] text-(--dash-text-subtle)">
          공고·접수·심사 지표 (KST 기준)
          {generatedAt && (
            <>
              <span aria-hidden> · </span>
              <time dateTime={generatedAt} className="tabular-nums">
                {formatKstIso(generatedAt, { withTime: true })} 기준
              </time>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="flex h-8 items-center gap-1.5 rounded-md border border-(--dash-border) px-2.5 text-[12px] font-medium text-(--dash-text-secondary) transition-colors hover:bg-(--dash-hover-bg) hover:text-(--dash-text) focus-visible:outline-2 focus-visible:outline-(--brand-500) disabled:opacity-60"
      >
        <RefreshCw
          className={cn("size-3.5", isFetching && "animate-spin")}
          aria-hidden
        />
        {isFetching ? "갱신 중" : "새로고침"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 에러                                                                */
/* ------------------------------------------------------------------ */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-(--accent-rose)/30 bg-(--accent-rose)/[0.06] px-6 py-12 text-center"
    >
      <p className="text-[14px] font-semibold text-(--dash-text)">
        대시보드 데이터를 불러오지 못했습니다.
      </p>
      <p className="max-w-md text-[12px] break-keep text-(--dash-text-muted)">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 flex h-8 items-center gap-1.5 rounded-md bg-(--brand-600) px-3 text-[12px] font-semibold text-white transition-colors hover:bg-(--brand-500) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        다시 시도
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 본문                                                                */
/* ------------------------------------------------------------------ */

function DashboardBody({
  data,
  loading,
}: {
  data: AdminDashboardOverview | undefined;
  loading: boolean;
}) {
  const kpis = data?.kpis;
  const daily = data?.dailyApplications ?? [];
  const last30Total = daily.reduce((sum, d) => sum + d.count, 0);

  const kpiItems: KpiItem[] = [
    {
      key: "active",
      label: "진행 중 공고",
      value: kpis?.activePrograms ?? 0,
      unit: "개",
      sub: `전체 공고 ${(kpis?.totalPrograms ?? 0).toLocaleString("ko-KR")}개`,
      href: "/dashboard/programs",
    },
    {
      key: "total",
      label: "총 접수",
      value: kpis?.totalApplications ?? 0,
      unit: "건",
      sub: "제출 완료 기준",
      href: `#${SECTION.programs}`,
    },
    {
      key: "week",
      label: "이번 주 접수",
      value: kpis?.thisWeekApplications ?? 0,
      unit: "건",
      tone: "brand",
      sub: `지난주 전체 ${(kpis?.lastWeekApplications ?? 0).toLocaleString("ko-KR")}건`,
      href: `#${SECTION.recent}`,
    },
    {
      key: "pending",
      label: "심사 대기",
      value: kpis?.pendingReviews ?? 0,
      unit: "건",
      tone: (kpis?.pendingReviews ?? 0) > 0 ? "warning" : "default",
      sub: "심사 결과가 없는 제출 건",
      href: `#${SECTION.programs}`,
    },
    {
      key: "verdict",
      label: "합격 / 불합격",
      value: (
        <>
          <span className="text-(--dash-positive-text)">
            {(kpis?.passedCount ?? 0).toLocaleString("ko-KR")}
          </span>
          <span className="mx-1 text-[18px] font-normal text-(--dash-text-subtle)">
            /
          </span>
          <span className="text-(--dash-negative-text)">
            {(kpis?.failedCount ?? 0).toLocaleString("ko-KR")}
          </span>
        </>
      ),
      ariaLabel: `합격 ${kpis?.passedCount ?? 0}건, 불합격 ${kpis?.failedCount ?? 0}건, 심사 아카이브로 이동`,
      sub: "가장 최근 심사 기준",
      href: "/dashboard/archive",
    },
  ];

  return (
    <>
      <KpiStrip items={kpiItems} loading={loading} ariaLabel="운영 주요 지표" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardPanel
          title="접수 추이"
          meta={
            loading ? undefined : `최근 30일 ${last30Total.toLocaleString("ko-KR")}건`
          }
          description="일별 제출 완료 건수 · 가장 밝은 막대가 오늘"
        >
          {loading ? (
            <ChartSkeleton />
          ) : last30Total === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-(--dash-text-muted)">
              최근 30일 동안 제출된 지원서가 없습니다.
            </div>
          ) : (
            <ApplicationTrendChart data={daily} />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="마감 임박 공고"
          meta={
            loading ? undefined : `${data?.upcomingDeadlines.length ?? 0}건`
          }
          description="모집 중 · 7일 이내 마감"
          flush
        >
          <DataTable
            caption="마감 임박 공고 목록"
            columns={deadlineColumns}
            rows={data?.upcomingDeadlines ?? []}
            getRowKey={(r) => r.programId}
            getRowHref={(r) => `/dashboard/programs/${r.programId}`}
            loading={loading}
            skeletonRows={4}
            minWidth="360px"
            emptyMessage="7일 이내 마감되는 모집 중 공고가 없습니다."
          />
        </DashboardPanel>
      </div>

      <DashboardPanel
        id={SECTION.recent}
        title="최근 접수"
        meta={loading ? undefined : `최근 ${data?.recentApplications.length ?? 0}건`}
        description="작성 중 지원서 포함 · 제출일(없으면 작성 시작일) 최신순"
        flush
      >
        <DataTable
          caption="최근 접수 지원서 목록"
          columns={recentColumns}
          rows={data?.recentApplications ?? []}
          getRowKey={(r) => r.id}
          getRowHref={(r) =>
            `/dashboard/programs/${r.programId}/applications/${r.id}`
          }
          loading={loading}
          minWidth="640px"
          emptyMessage="아직 접수된 지원서가 없습니다."
        />
      </DashboardPanel>

      <DashboardPanel
        id={SECTION.programs}
        title="공고별 현황"
        meta={loading ? undefined : `${data?.programSummaries.length ?? 0}개`}
        description="전체는 작성 중 포함 · 나머지는 제출 완료 기준"
        action={
          <Link
            href="/dashboard/programs"
            className="text-[12px] font-medium text-(--dash-text-muted) hover:text-(--dash-text) focus-visible:outline-2 focus-visible:outline-(--brand-500)"
          >
            공고 관리 →
          </Link>
        }
        flush
      >
        <DataTable
          caption="공고별 접수·심사 현황"
          columns={programColumns}
          rows={data?.programSummaries ?? []}
          getRowKey={(r) => r.programId}
          getRowHref={(r) => `/dashboard/programs/${r.programId}`}
          loading={loading}
          minWidth="760px"
          emptyMessage={
            <>
              등록된 공고가 없습니다.{" "}
              <Link
                href="/dashboard/programs"
                className="text-(--dash-active-text) underline-offset-2 hover:underline"
              >
                공고 만들기
              </Link>
            </>
          }
        />
      </DashboardPanel>
    </>
  );
}

function ChartSkeleton() {
  const heights = [40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 75, 40, 65, 55];
  return (
    <div
      aria-hidden
      className="flex h-[220px] items-end gap-1.5 border-b border-(--dash-chart-grid) pb-px pl-8"
    >
      {heights.map((h, i) => (
        // 높이는 장식용 고정값
        <div key={i} className="flex-1" style={{ height: `${h}%` }}>
          <SkeletonBlock className="h-full rounded-b-none" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 테이블 열 정의                                                       */
/* ------------------------------------------------------------------ */

const deadlineColumns: DataTableColumn<UpcomingDeadline>[] = [
  {
    key: "title",
    header: "공고명",
    primary: true,
    cell: (r) => <span className="line-clamp-1 break-all">{r.title || "제목 없음"}</span>,
  },
  {
    key: "deadline",
    header: "마감일",
    nowrap: true,
    width: "112px",
    cell: (r) => (
      <span className="tabular-nums">
        {formatDeadline(r.deadline, { withWeekday: true })}
      </span>
    ),
  },
  {
    key: "dday",
    header: "D-day",
    width: "84px",
    cell: (r) => <DeadlineBadge daysLeft={r.daysLeft} />,
  },
  {
    key: "count",
    header: "접수",
    numeric: true,
    width: "64px",
    cell: (r) => <NumericCell value={r.applicationCount} emphasize />,
  },
];

const recentColumns: DataTableColumn<RecentApplication>[] = [
  {
    key: "applicant",
    header: "지원자",
    primary: true,
    cell: (r) =>
      r.applicantLabel ? (
        <span className="line-clamp-1 break-all">{r.applicantLabel}</span>
      ) : (
        <span className="font-normal text-(--dash-text-subtle)">회사명 미지정</span>
      ),
  },
  {
    key: "program",
    header: "공고명",
    cell: (r) => (
      <span className="line-clamp-1 break-all">{r.programTitle || "제목 없음"}</span>
    ),
  },
  {
    key: "status",
    header: "상태",
    width: "92px",
    cell: (r) => (
      <ApplicationStatusBadge status={r.status} isComplete={r.isComplete} />
    ),
  },
  {
    key: "verdict",
    header: "판정",
    width: "80px",
    cell: (r) =>
      r.isComplete ? (
        <VerdictBadge verdict={r.reviewVerdict} />
      ) : (
        <span className="text-(--dash-text-subtle)" aria-label="해당 없음">
          —
        </span>
      ),
  },
  {
    key: "submitted",
    header: "제출일",
    nowrap: true,
    width: "112px",
    cell: (r) =>
      r.submittedAt ? (
        <time dateTime={r.submittedAt} className="tabular-nums">
          {formatKstIso(r.submittedAt, { withTime: true })}
        </time>
      ) : (
        <span
          className="text-(--dash-text-subtle)"
          title={`작성 시작 ${formatKstIso(r.createdAt, { withTime: true })}`}
        >
          미제출
        </span>
      ),
  },
];

const programColumns: DataTableColumn<ProgramSummary>[] = [
  {
    key: "title",
    header: "공고명",
    primary: true,
    cell: (r) => <span className="line-clamp-1 break-all">{r.title || "제목 없음"}</span>,
  },
  {
    key: "status",
    header: "상태",
    width: "92px",
    cell: (r) => <ProgramStatusBadge status={r.status} />,
  },
  {
    key: "deadline",
    header: "마감일",
    nowrap: true,
    width: "128px",
    cell: (r) => (
      <span className="tabular-nums">
        {formatDeadline(r.deadline, { withYear: true })}
      </span>
    ),
  },
  {
    key: "total",
    header: "전체",
    numeric: true,
    width: "64px",
    cell: (r) => <NumericCell value={r.total} />,
  },
  {
    key: "completed",
    header: "완료",
    numeric: true,
    width: "64px",
    cell: (r) => <NumericCell value={r.completed} emphasize />,
  },
  {
    key: "pending",
    header: "심사 대기",
    numeric: true,
    width: "80px",
    cell: (r) =>
      r.pendingReview > 0 ? (
        <span className="font-semibold text-(--dash-warning-text)">
          {r.pendingReview.toLocaleString("ko-KR")}
        </span>
      ) : (
        <NumericCell value={0} />
      ),
  },
  {
    key: "passed",
    header: "합격",
    numeric: true,
    width: "64px",
    cell: (r) =>
      r.passed > 0 ? (
        <span className="text-(--dash-positive-text)">{r.passed.toLocaleString("ko-KR")}</span>
      ) : (
        <NumericCell value={0} />
      ),
  },
  {
    key: "failed",
    header: "불합격",
    numeric: true,
    width: "64px",
    cell: (r) =>
      r.failed > 0 ? (
        <span className="text-(--dash-negative-text)">{r.failed.toLocaleString("ko-KR")}</span>
      ) : (
        <NumericCell value={0} />
      ),
  },
];
