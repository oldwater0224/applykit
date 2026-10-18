import Link from "next/link";
import { cn } from "@/lib/utils";
import { SkeletonBlock } from "@/src/components/dashboard/dashboardPanel";

/**
 * KPI 스트립 — 한 줄에 큰 숫자 지표를 세로 구분선으로 나눠 표시 (TheVC 스타일)
 * - lg 이상: items 개수만큼 한 줄
 * - lg 미만: 2열 (홀수 개면 마지막 항목이 2칸 차지)
 * - href가 있으면 항목 전체가 링크
 * - 구분선은 gap-px + 배경색으로 그려서 줄바꿈돼도 선이 끊기지 않음
 */

export type KpiTone = "default" | "brand" | "success" | "warning" | "danger";

export interface KpiItem {
  /** React key */
  key: string;
  label: string;
  /** 메인 수치. 숫자면 천 단위 구분, 노드면 그대로 렌더링 */
  value: React.ReactNode;
  /** 수치 뒤 단위 (건, 개 등) */
  unit?: string;
  /** 수치 아래 보조 문구 */
  sub?: React.ReactNode;
  /** 클릭 시 이동할 경로 (같은 페이지 앵커 "#id"도 가능) */
  href?: string;
  /** 링크 접근성 라벨 (없으면 셀 텍스트 전체가 링크 이름) */
  ariaLabel?: string;
  /** 수치 색 */
  tone?: KpiTone;
}

export interface KpiStripProps {
  items: KpiItem[];
  /** true면 수치 대신 스켈레톤 */
  loading?: boolean;
  /** 스트립 전체 접근성 라벨 */
  ariaLabel?: string;
  className?: string;
}

const VALUE_TONE: Record<KpiTone, string> = {
  default: "text-(--dash-text)",
  brand: "text-(--dash-active-text)",
  success: "text-(--dash-positive-text)",
  warning: "text-(--dash-warning-text)",
  danger: "text-(--dash-negative-text)",
};

export function KpiStrip({
  items,
  loading = false,
  ariaLabel = "주요 지표",
  className,
}: KpiStripProps) {
  return (
    <section
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      style={
        {
          "--kpi-cols": `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
        } as React.CSSProperties
      }
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-(--dash-border-subtle) bg-(--dash-border-subtle) lg:grid-cols-(--kpi-cols)",
        "[&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1",
        className
      )}
    >
      {items.map((item) => (
        <KpiCell key={item.key} item={item} loading={loading} />
      ))}
    </section>
  );
}

function KpiCell({ item, loading }: { item: KpiItem; loading: boolean }) {
  const formatted =
    typeof item.value === "number"
      ? item.value.toLocaleString("ko-KR")
      : item.value;

  const body = (
    <>
      <p className="flex items-center gap-1 text-[12px] font-medium text-(--dash-text-muted)">
        {item.label}
        {item.href && !loading && (
          <span
            aria-hidden
            className="text-(--dash-text-subtle) opacity-0 transition-opacity group-hover:opacity-100"
          >
            →
          </span>
        )}
      </p>
      {loading ? (
        <>
          <SkeletonBlock className="mt-2 h-7 w-16" />
          <SkeletonBlock className="mt-2 h-3 w-24" />
        </>
      ) : (
        <>
          <p
            className={cn(
              "mt-1.5 text-[26px] leading-none font-bold tracking-tight tabular-nums",
              VALUE_TONE[item.tone ?? "default"]
            )}
          >
            {formatted}
            {item.unit && (
              <span className="ml-0.5 text-[14px] font-semibold text-(--dash-text-muted)">
                {item.unit}
              </span>
            )}
          </p>
          {item.sub != null && (
            <p className="mt-2 truncate text-xs sm:text-[11px] text-(--dash-text-subtle) tabular-nums">
              {item.sub}
            </p>
          )}
        </>
      )}
    </>
  );

  const cellClass = "block min-w-0 bg-(--dash-panel-bg) px-4 py-4 lg:px-5";

  if (item.href && !loading) {
    return (
      <Link
        href={item.href}
        aria-label={item.ariaLabel}
        className={cn(
          cellClass,
          "group transition-colors hover:bg-(--dash-hover-bg) focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--brand-500)"
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={cellClass}>{body}</div>;
}
