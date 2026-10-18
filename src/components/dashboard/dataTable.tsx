"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SkeletonBlock } from "@/src/components/dashboard/dashboardPanel";

/**
 * 관리자 대시보드 공용 데이터 테이블 (다크, TheVC 스타일)
 * - 촘촘한 행(기본 40px), 얇은 행 구분선, 숫자 열 오른쪽 정렬 + tabular-nums
 * - 가로 스크롤 컨테이너 내장 → 좁은 화면에서도 페이지 전체가 가로로 넘치지 않음
 * - getRowHref를 주면 행 클릭으로 이동하고, primary 열은 실제 <Link>로 렌더링
 *   (키보드·스크린리더는 링크로 접근, 마우스는 행 어디를 눌러도 이동)
 * - loading이면 스켈레톤 행, rows가 비면 emptyMessage
 */

export type DataTableAlign = "left" | "right" | "center";

export interface DataTableColumn<T> {
  /** 열 식별자 (React key) */
  key: string;
  /** 헤더 내용 */
  header: React.ReactNode;
  /** 셀 렌더러 */
  cell: (row: T, index: number) => React.ReactNode;
  /** 정렬. numeric이면 기본 right */
  align?: DataTableAlign;
  /** 숫자 열: 오른쪽 정렬 + tabular-nums */
  numeric?: boolean;
  /** 행 링크를 거는 대표 열 (getRowHref가 있을 때 <Link>로 감쌈) */
  primary?: boolean;
  /** 열 너비 (예: "120px", "30%") */
  width?: string;
  /** 줄바꿈 금지 (기본: numeric이면 true) */
  nowrap?: boolean;
  /** 셀 추가 클래스 */
  className?: string;
  /** 헤더 셀 추가 클래스 */
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** 행 클릭 시 이동할 경로 */
  getRowHref?: (row: T) => string;
  /** 표 설명 (스크린리더용 caption) */
  caption: string;
  loading?: boolean;
  /** 로딩 스켈레톤 행 수 (기본 5) */
  skeletonRows?: number;
  /** 빈 상태 문구 또는 노드 */
  emptyMessage?: React.ReactNode;
  /** 가로 스크롤이 시작되는 최소 너비 (기본 "560px") */
  minWidth?: string;
  /** 행 높이: compact 36px / default 40px */
  density?: "compact" | "default";
  /** 테이블 바깥 래퍼 클래스 */
  className?: string;
}

const ALIGN_CLASS: Record<DataTableAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  getRowHref,
  caption,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "표시할 데이터가 없습니다.",
  minWidth = "560px",
  density = "default",
  className,
}: DataTableProps<T>) {
  const router = useRouter();
  const rowHeight = density === "compact" ? "h-9" : "h-10";

  const alignOf = (col: DataTableColumn<T>): DataTableAlign =>
    col.align ?? (col.numeric ? "right" : "left");

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>, href: string) {
    // 셀 안의 링크·버튼을 누른 경우는 그 요소의 동작에 맡김
    if ((e.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    // 텍스트 선택 중이면 이동하지 않음
    if (window.getSelection()?.toString()) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  }

  return (
    <div className={cn("w-full overflow-x-auto overscroll-x-contain", className)}>
      <table
        className="w-full border-collapse text-[13px]"
        style={{ minWidth }}
        aria-busy={loading || undefined}
      >
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-(--dash-border-subtle) bg-(--dash-panel-header-bg)">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "h-8 px-4 text-[11px] font-medium whitespace-nowrap text-(--dash-text-subtle)",
                  ALIGN_CLASS[alignOf(col)],
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr
                key={`skeleton-${i}`}
                className={cn(rowHeight, "border-b border-(--dash-border-subtle) last:border-b-0")}
              >
                {columns.map((col, ci) => (
                  <td key={col.key} className="px-4">
                    <SkeletonBlock
                      className={cn(
                        "h-3",
                        ci === 0 ? "w-3/4" : "w-10",
                        alignOf(col) === "right" && "ml-auto",
                        alignOf(col) === "center" && "mx-auto"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[13px] text-(--dash-text-muted)"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => {
              const href = getRowHref?.(row);
              return (
                <tr
                  key={getRowKey(row)}
                  onClick={href ? (e) => handleRowClick(e, href) : undefined}
                  className={cn(
                    rowHeight,
                    "border-b border-(--dash-border-subtle) transition-colors last:border-b-0",
                    href && "cursor-pointer hover:bg-(--dash-row-hover)"
                  )}
                >
                  {columns.map((col) => {
                    const content = col.cell(row, ri);
                    const nowrap = col.nowrap ?? col.numeric ?? false;
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-2 align-middle text-(--dash-text-secondary)",
                          ALIGN_CLASS[alignOf(col)],
                          col.numeric && "tabular-nums",
                          nowrap && "whitespace-nowrap",
                          col.className
                        )}
                      >
                        {col.primary && href ? (
                          <Link
                            href={href}
                            className="font-medium text-(--dash-text) underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** 숫자 셀: 0이면 흐리게 표시 */
export function NumericCell({
  value,
  emphasize = false,
}: {
  value: number;
  emphasize?: boolean;
}) {
  return (
    <span
      className={cn(
        value === 0
          ? "text-(--dash-text-subtle)"
          : emphasize
            ? "font-semibold text-(--dash-text)"
            : "text-(--dash-text-secondary)"
      )}
    >
      {value.toLocaleString("ko-KR")}
    </span>
  );
}
