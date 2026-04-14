'use client';

import { Application } from '@/src/types/applications';

interface ApplicationStatsCardsProps {
  applications: Application[];
}

/**
 * 접수 현황 상단 4개 통계 카드
 * - 총 접수 / 완료 / 미완성 / 오늘 접수
 * - applications 배열 받아서 클라이언트에서 카운트
 * - 지원서 수가 늘어나면 서버 집계로 옮겨야 함
 */
export function ApplicationStatsCards({
  applications,
}: ApplicationStatsCardsProps) {
  // 통계 계산 - useMemo로 감쌀 만큼 무거운 연산은 아니라 인라인
  const total = applications.length;
  const completed = applications.filter((a) => a.is_complete).length;
  const incomplete = total - completed;

  // 오늘 접수 - 자정 기준
  // 사용자 로컬 시간대 기준이라 정확하진 않지만 UX상 충분
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

/**
 * 개별 통계 카드 - 라벨 + 큰 숫자
 * - accent prop으로 색상 강조 가능
 * - default는 강조 없는 검정
 */
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'blue' | 'amber';
}) {
  // 강조 색상 매핑
  // 컨벤션상 bg-gray 회피하지만 통계 숫자는 색상이 정보 전달의 일부라 예외
  const accentClass = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
  }[accent ?? 'blue'];

  // accent prop이 없으면 기본 검정으로 - 강조 색상은 있을 때만 적용
  const valueClass = accent ? accentClass : 'text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}