'use client';

import { Application } from '@/src/types/applications';

interface ApplicationStatsCardsProps {
  applications: Application[];
}

/**
 * 접수 현황 상단 4개 통계 카드
 * - 총 접수 / 완료 / 미완성 / 오늘 접수
 */
export function ApplicationStatsCards({
  applications,
}: ApplicationStatsCardsProps) {
  const total = applications.length;
  const completed = applications.filter((a) => a.is_complete).length;
  const incomplete = total - completed;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = applications.filter(
    (a) => new Date(a.created_at) >= todayStart,
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="총 접수" value={total} />
      <StatCard label="완료" value={completed} accent="blue" />
      <StatCard label="미완성" value={incomplete} accent="amber" />
      <StatCard label="오늘 접수" value={todayCount} />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'blue' | 'amber';
}) {
  const accentColor = {
    blue: 'var(--brand-500)',
    amber: 'var(--accent-amber)',
  }[accent ?? 'blue'];

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <p className="text-sm" style={{ color: "var(--gray-400)" }}>{label}</p>
      <p
        className="text-2xl font-bold mt-1"
        style={{ color: accent ? accentColor : "var(--gray-100)" }}
      >
        {value}
      </p>
    </div>
  );
}
