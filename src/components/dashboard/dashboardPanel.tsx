import { cn } from "@/lib/utils";

/**
 * 관리자 대시보드 섹션 패널 (다크)
 * - 얇은 테두리 + 제목 바, 그림자 없음
 * - 테이블을 넣을 때는 flush=true로 본문 패딩 제거
 */
export interface DashboardPanelProps {
  title: string;
  /** 제목 옆 보조 텍스트 (건수 등) */
  meta?: React.ReactNode;
  /** 제목 아래 한 줄 설명 */
  description?: string;
  /** 오른쪽 액션 (전체 보기 링크 등) */
  action?: React.ReactNode;
  /** 본문 패딩 제거 (테이블용) */
  flush?: boolean;
  /** 앵커 이동용 id (KPI 링크 등) */
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function DashboardPanel({
  title,
  meta,
  description,
  action,
  flush = false,
  id,
  className,
  children,
}: DashboardPanelProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "flex min-w-0 scroll-mt-4 flex-col overflow-hidden rounded-lg border border-(--dash-border-subtle) bg-(--dash-panel-bg)",
        className
      )}
    >
      <header className="flex min-h-11 items-center gap-3 border-b border-(--dash-border-subtle) px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <h2
            id={headingId}
            className="flex items-baseline gap-2 text-[13px] font-semibold text-(--dash-text)"
          >
            <span className="truncate">{title}</span>
            {meta != null && (
              <span className="shrink-0 text-[12px] font-normal tabular-nums text-(--dash-text-muted)">
                {meta}
              </span>
            )}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] text-(--dash-text-subtle)">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("min-w-0 flex-1", !flush && "p-4")}>{children}</div>
    </section>
  );
}

/** 스켈레톤 블록 (크기는 className으로 지정) */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded bg-(--dash-skeleton)",
        className
      )}
    />
  );
}
