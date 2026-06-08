import Link from "next/link";
import { getDashboardStats } from "@/src/app/actions/dashboardAction";
// import { ROUND_COLORS, normalizeRoundName } from "@/src/types/funding";

export default async function HomePage() {
  const stats = await getDashboardStats();

  const monthlyGrowth =
    stats.prevYearMonthlyRounds > 0
      ? Math.round(
          ((stats.monthlyRounds - stats.prevYearMonthlyRounds) /
            stats.prevYearMonthlyRounds) *
            100
        )
      : null;

  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      {/* 헤더 영역 */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p
            className="text-[11px] font-medium uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Korea Startup Investment
          </p>
          <h1
            className="mt-1 text-[22px] font-bold tracking-tight"
            style={{ color: "#fff" }}
          >
            한국 스타트업 투자
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
            DART 공시 기반 · 자동 업데이트
          </p>
        </div>
      </div>

      {/* 메인 통계 바 */}
      <div
        className="mb-6 flex items-center gap-8 rounded-xl px-6 py-4"
        style={{
          backgroundColor: "var(--navy-900)",
        }}
      >
        <StatBig
          label="총 투자 금액"
          value={formatLargeAmount(stats.totalAmount)}
          sub="억 원"
        />
        <div className="h-8 w-px" style={{ backgroundColor: "var(--navy-700)" }} />
        <StatBig
          label="전년대비 금액"
          value={
            monthlyGrowth !== null
              ? `${monthlyGrowth >= 0 ? "+" : ""}${monthlyGrowth}%`
              : "—"
          }
          positive={monthlyGrowth !== null ? monthlyGrowth >= 0 : undefined}
        />
        <div className="h-8 w-px" style={{ backgroundColor: "var(--navy-700)" }} />
        <StatBig
          label="총 건수"
          value={stats.totalRounds.toLocaleString()}
          sub="건"
        />
        <div className="hidden h-8 w-px sm:block" style={{ backgroundColor: "var(--navy-700)" }} />
        <div className="hidden sm:block">
          <StatBig
            label="이번 달"
            value={stats.monthlyRounds.toLocaleString()}
            sub="건"
          />
        </div>
      </div>

      {/* 라운드별 카드 그리드 */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-[13px] font-semibold"
            style={{ color: "#fff" }}
          >
            투자 라운드별 현황
          </h2>
          <Link
            href="/investments"
            className="text-[12px] font-medium"
            style={{ color: "var(--brand-600)" }}
          >
            전체 보기 →
          </Link>
        </div>

        {stats.roundsByName.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {stats.roundsByName.map(({ roundName, count, amount }) => (
              <Link
                key={roundName}
                href={`/investments?round=${encodeURIComponent(roundName)}`}
                className="group rounded-lg border px-3 py-3 transition-all hover:shadow-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <RoundBadge name={roundName} />
                </div>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ color: "#fff" }}
                >
                  {count}
                  <span
                    className="ml-0.5 text-[11px] font-normal"
                    style={{ color: "var(--gray-400)" }}
                  >
                    건
                  </span>
                </p>
                <p
                  className="mt-0.5 text-[11px] tabular-nums"
                  style={{ color: "var(--gray-400)" }}
                >
                  {amount.toLocaleString()}억
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyBlock />
        )}
      </section>

      {/* 2열: 분야 TOP + 최근 투자 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* 투자 분야 TOP */}
        <section className="lg:col-span-2">
          <h2
            className="mb-3 text-[13px] font-semibold"
            style={{ color: "#fff" }}
          >
            투자 분야 TOP 6
          </h2>
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            {stats.topSectors.length > 0 ? (
              <div className="space-y-3">
                {stats.topSectors.map((sector, i) => {
                  const maxCount = stats.topSectors[0].count;
                  const pct = Math.max((sector.count / maxCount) * 100, 6);
                  return (
                    <div key={sector.sector}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium" style={{ color: "#fff" }}>
                          <span className="mr-1.5 inline-block w-4 text-center text-[11px]" style={{ color: "var(--gray-400)" }}>
                            {i + 1}
                          </span>
                          {sector.sector}
                        </span>
                        <span className="text-[11px] tabular-nums" style={{ color: "var(--gray-400)" }}>
                          {sector.count}건 · {sector.amount.toLocaleString()}억
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--gray-100)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: i === 0 ? "var(--brand-500)" : "var(--brand-500)",
                            opacity: 1 - i * 0.12,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-[12px]" style={{ color: "var(--gray-400)" }}>
                데이터 부족
              </p>
            )}
          </div>
        </section>

        {/* 최근 투자 */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-[13px] font-semibold"
              style={{ color: "#fff" }}
            >
              최근 투자
            </h2>
            <Link
              href="/investments"
              className="text-[12px] font-medium"
              style={{ color: "var(--brand-600)" }}
            >
              더 보기 →
            </Link>
          </div>
          <div
            className="overflow-hidden rounded-lg border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            {stats.recentRounds.length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <th
                      className="px-3 py-2 text-left font-medium"
                      style={{ color: "#fff" }}
                    >
                      기업
                    </th>
                    <th
                      className="hidden px-3 py-2 text-left font-medium sm:table-cell"
                      style={{ color: "#fff" }}
                    >
                      분야
                    </th>
                    <th
                      className="px-3 py-2 text-left font-medium"
                      style={{ color: "#fff" }}
                    >
                      라운드
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium"
                      style={{ color: "#fff" }}
                    >
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRounds.map((round) => (
                    <tr
                      key={round.id}
                      className="transition hover:bg-slate-50/50"
                      style={{ borderBottom: "1px solid #fff" }}
                    >
                      <td className="px-3 py-2.5">
                        <span className="font-medium" style={{ color: "#fff" }}>
                          {round.companyName}
                        </span>
                      </td>
                      <td
                        className="hidden px-3 py-2.5 sm:table-cell"
                        style={{ color: "#fff" }}
                      >
                        {round.sector ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <RoundBadge name={round.roundName} small />
                      </td>
                      <td
                        className="px-3 py-2.5 text-right tabular-nums font-medium"
                        style={{ color: "#fff" }}
                      >
                        {round.amount
                          ? `${round.amount.toLocaleString()}억`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-12 text-center text-[12px]" style={{ color: "#fff" }}>
                데이터 없음
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */

function StatBig({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
        {label}
      </p>
      <p className="mt-0.5 flex items-baseline gap-1">
        <span
          className="text-xl font-bold tabular-nums"
          style={{
            color:
              positive === true
                ? "var(--accent-emerald)"
                : positive === false
                  ? "var(--accent-rose)"
                  : "#ffffff",
          }}
        >
          {value}
        </span>
        {sub && (
          <span className="text-[11px]" style={{ color: "var(--gray-500)" }}>
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}

// 라운드별 색상 도트 + 라벨
const ROUND_DOT_COLORS: Record<string, string> = {
  Seed: "var(--round-seed)",
  "Pre-A": "var(--round-pre-a)",
  "Series A": "var(--round-series-a)",
  "Series B": "var(--round-series-b)",
  "Series C": "var(--round-series-c)",
  "Series D": "var(--round-series-d)",
  "Pre-IPO": "var(--round-pre-ipo)",
  IPO: "var(--round-ipo)",
  "M&A": "var(--round-ma)",
};

function RoundBadge({ name, small }: { name: string; small?: boolean }) {
  const dotColor = ROUND_DOT_COLORS[name] ?? "var(--gray-400)";
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        small ? "text-[11px]" : "text-[11px]"
      }`}
      style={{ color: "#fff" }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {name}
    </span>
  );
}

function EmptyBlock() {
  return (
    <div
      className="flex h-32 items-center justify-center rounded-lg border border-dashed"
      style={{ borderColor: "var(--gray-300)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
        등록된 데이터가 없습니다
      </p>
    </div>
  );
}

function formatLargeAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return amount.toLocaleString();
}