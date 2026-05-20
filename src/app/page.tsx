import Link from "next/link";
import { getDashboardStats } from "@/src/app/actions/dashboardAction";
import { ROUND_COLORS  } from "@/src/types/funding";

export default async function HomePage() {
  const stats = await getDashboardStats();

  // 전년 동월 대비 증감
  const monthlyGrowth =
    stats.prevYearMonthlyRounds > 0
      ? Math.round(
          ((stats.monthlyRounds - stats.prevYearMonthlyRounds) /
            stats.prevYearMonthlyRounds) *
            100
        )
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 히어로 섹션 */}
      <section className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          한국 스타트업 투자 동향
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          국내 스타트업 투자 데이터를 한눈에. DART 공시 기반 실시간 업데이트.
        </p>
      </section>

      {/* 종합 통계 카드 */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="총 투자 건수"
          value={stats.totalRounds.toLocaleString()}
          suffix="건"
        />
        <StatCard
          label="총 투자 금액"
          value={stats.totalAmount.toLocaleString()}
          suffix="억 원"
        />
        <StatCard
          label="이번 달 투자"
          value={stats.monthlyRounds.toLocaleString()}
          suffix="건"
          badge={
            monthlyGrowth !== null
              ? monthlyGrowth >= 0
                ? `+${monthlyGrowth}% YoY`
                : `${monthlyGrowth}% YoY`
              : undefined
          }
          badgePositive={monthlyGrowth !== null ? monthlyGrowth >= 0 : undefined}
        />
        <StatCard
          label="이번 달 금액"
          value={stats.monthlyAmount.toLocaleString()}
          suffix="억 원"
        />
      </section>

      {/* 투자 라운드별 현황 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            투자 라운드별 현황
          </h2>
          <Link
            href="/investments"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            전체 보기 →
          </Link>
        </div>

        {stats.roundsByName.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.roundsByName.map(({ roundName, count, amount }) => (
              <Link
                key={roundName}
                href={`/investments?round=${encodeURIComponent(roundName)}`}
                className="group rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ROUND_COLORS[roundName as keyof typeof ROUND_COLORS] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {roundName}
                </span>
                <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">
                  {count}
                  <span className="text-sm font-normal text-gray-400">건</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {amount.toLocaleString()}억 원
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="등록된 투자 라운드가 없습니다." />
        )}
      </section>

      {/* 2컬럼: 업종 TOP + 최근 투자 */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* 투자 분야 TOP */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            투자 분야 TOP
          </h2>
          {stats.topSectors.length > 0 ? (
            <div className="space-y-3">
              {stats.topSectors.map((sector, i) => {
                const maxCount = stats.topSectors[0].count;
                const widthPct = Math.max((sector.count / maxCount) * 100, 8);

                return (
                  <div key={sector.sector}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        <span className="mr-2 text-gray-400">{i + 1}</span>
                        {sector.sector}
                      </span>
                      <span className="tabular-nums text-gray-500">
                        {sector.count}건
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="업종 데이터가 부족합니다." />
          )}
        </section>

        {/* 최근 투자 */}
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">최근 투자</h2>
            <Link
              href="/investments"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              더 보기 →
            </Link>
          </div>

          {stats.recentRounds.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">
                      기업
                    </th>
                    <th className="hidden px-4 py-2.5 text-left font-medium text-gray-500 sm:table-cell">
                      분야
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">
                      라운드
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentRounds.map((round) => (
                    <tr
                      key={round.id}
                      className="transition hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {round.companyName}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                        {round.sector ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            ROUND_COLORS[
                              round.roundName as keyof typeof ROUND_COLORS
                            ] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {round.roundName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {round.amount
                          ? `${round.amount.toLocaleString()}억`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="등록된 투자 데이터가 없습니다." />
          )}
        </section>
      </div>
    </div>
  );
}

// --- 통계 카드 ---
function StatCard({
  label,
  value,
  suffix,
  badge,
  badgePositive,
}: {
  label: string;
  value: string;
  suffix: string;
  badge?: string;
  badgePositive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
        {value}
        <span className="ml-1 text-sm font-normal text-gray-400">
          {suffix}
        </span>
      </p>
      {badge && (
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            badgePositive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// --- 빈 상태 ---
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}