"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyApplicationCount } from "@/src/types/adminDashboard";

/**
 * 일별 접수 추이 막대 차트 (다크)
 * - data.date는 KST 'YYYY-MM-DD' 키 → 타임존 영향 없이 문자열로 라벨 생성
 * - 마지막 막대(오늘)만 밝은 색으로 강조
 * - 축은 최소화: X축 라벨 몇 개, Y축 눈금 3~4개, 세로 격자 없음
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 'YYYY-MM-DD' → { short: "10/15", long: "10월 15일 (수)" } */
export function formatDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return {
    short: `${m}/${d}`,
    long: `${m}월 ${d}일 (${weekday})`,
  };
}

interface TrendTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: unknown }>;
}

function TrendTooltip({ active, label, payload }: TrendTooltipProps) {
  if (!active || !payload?.length || typeof label !== "string") return null;
  const count = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-md border border-(--dash-border) bg-(--navy-950) px-2.5 py-1.5 text-[12px] shadow-lg">
      <p className="text-(--dash-text-muted)">{formatDateKey(label).long}</p>
      <p className="mt-0.5 font-semibold text-(--dash-text) tabular-nums">
        제출 {count.toLocaleString("ko-KR")}건
      </p>
    </div>
  );
}

export function ApplicationTrendChart({
  data,
  height = 220,
}: {
  data: DailyApplicationCount[];
  height?: number;
}) {
  const lastIndex = data.length - 1;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
          barCategoryGap="22%"
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--dash-chart-grid)"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDateKey(v).short}
            tick={{ fontSize: 10, fill: "var(--gray-500)" }}
            axisLine={{ stroke: "var(--dash-border)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "var(--gray-500)" }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
            width={36}
          />
          <Tooltip
            content={TrendTooltip}
            cursor={{ fill: "rgb(255 255 255 / 0.04)" }}
            isAnimationActive={false}
          />
          <Bar dataKey="count" name="제출" radius={[2, 2, 0, 0]} maxBarSize={18}>
            {data.map((d, i) => (
              <Cell
                key={d.date}
                fill={
                  i === lastIndex
                    ? "var(--dash-chart-bar-today)"
                    : "var(--dash-chart-bar)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
