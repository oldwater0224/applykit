"use client";

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
  if (!financials || financials.length === 0) return null;

  const chartData = [...financials]
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .map((f) => ({
      year: `${f.fiscal_year}`,
      매출액: f.revenue ?? 0,
      영업이익: f.operating_income ?? 0,
      순이익: f.net_income ?? 0,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "var(--gray-400)" }}
            axisLine={{ stroke: "var(--gray-200)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--gray-400)" }}
            tickFormatter={formatBillionShort}
            width={55}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatBillionShort(Number(value)), undefined]}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid var(--gray-200)",
              fontSize: "12px",
              backgroundColor: "var(--card-bg)",
              boxShadow: "var(--card-hover-shadow)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
          />
          <Bar dataKey="매출액" fill="var(--brand-500)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="영업이익" fill="var(--accent-emerald)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="순이익" fill="var(--round-series-c)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}