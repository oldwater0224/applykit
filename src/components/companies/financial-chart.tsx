"use client";

// ============================================================
// src/components/companies/financial-chart.tsx
// 재무제표 차트 — 매출/영업이익/순이익 연도별 추이
// ============================================================

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { Financial } from "@/src/types/company";

function formatBillionShort(value: number) {
  const b = value / 100000000;
  if (Math.abs(b) >= 10000) return `${(b / 10000).toFixed(1)}조`;
  return `${Math.round(b).toLocaleString()}억`;
}

export default function FinancialChart({
  financials,
}: {
  financials: Financial[];
}) {
  if (financials.length === 0) return null;

  // 오래된 순으로 정렬
  const chartData = [...financials]
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .map((f) => ({
      year: `${f.fiscal_year}`,
      매출액: f.revenue ?? 0,
      영업이익: f.operating_income ?? 0,
      순이익: f.net_income ?? 0,
    }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={formatBillionShort}
            width={60}
          />
          <Tooltip
            formatter={(value) => [
              formatBillionShort(Number(value)),
              undefined,
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          <Bar dataKey="매출액" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="영업이익" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="순이익" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}