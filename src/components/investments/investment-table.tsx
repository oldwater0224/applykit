import Link from "next/link";
import type { InvestmentListItem } from "@/src/app/actions/investmentAction";

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount: number | null) {
  if (!amount) return "비공개";
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억`;
}

export default function InvestmentTable({
  items,
}: {
  items: InvestmentListItem[];
}) {
  if (items.length === 0) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-lg border border-dashed"
        style={{ borderColor: "var(--hairline-strong)" }}
      >
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          해당 조건의 투자 건이 없습니다
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크탑 테이블 */}
      <div
        className="hidden overflow-hidden rounded-lg border sm:block"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <th
                className="px-3 py-2.5 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                날짜
              </th>
              <th
                className="px-3 py-2.5 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                기업명
              </th>
              <th
                className="hidden px-3 py-2.5 text-left font-medium md:table-cell"
                style={{ color: "var(--text-secondary)" }}
              >
                분야
              </th>
              <th
                className="px-3 py-2.5 text-left font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                라운드
              </th>
              <th
                className="px-3 py-2.5 text-right font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                금액
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const dotColor = ROUND_DOT_COLORS[item.roundName] ?? "var(--gray-400)";
              return (
                <tr
                  key={item.id}
                  // className="transition hover:bg-slate-50/60"
                  style={{ borderBottom: "1px solid var(--hairline)" }}
                >
                  <td
                    className="whitespace-nowrap px-3 py-2.5 tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatDate(item.announcedDate)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/companies/${item.companyId}`}
                      className="font-medium transition hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.companyName}
                    </Link>
                  </td>
                  <td
                    className="hidden px-3 py-2.5 md:table-cell"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.sector ?? "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 text-xs sm:text-[11px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{
                          backgroundColor: dotColor,
                        }}
                      />
                      {item.roundName}
                    </span>
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatAmount(item.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-2 sm:hidden">
        {items.map((item) => {
          const dotColor =
            ROUND_DOT_COLORS[item.roundName] ?? "var(--gray-400)";
          return (
            <Link
              key={item.id}
              href={`/companies/${item.companyId}`}
              className="block rounded-lg border p-3.5 transition hover:shadow-sm"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.companyName}
                  </p>
                  <p
                    className="mt-0.5 text-xs sm:text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.sector ?? "—"} · {formatDate(item.announcedDate)}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 text-xs sm:text-[11px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  {item.roundName}
                </span>
              </div>
              <p
                className="mt-2 text-right text-[15px] font-semibold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {formatAmount(item.amount)}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
