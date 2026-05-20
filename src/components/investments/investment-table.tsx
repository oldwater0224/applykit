import Link from "next/link";
import { ROUND_COLORS } from "@/src/types/funding";
import type { InvestmentListItem } from "@/src/app/actions/investmentAction";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount: number | null) {
  if (!amount) return "-";
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}조`;
  }
  return `${amount.toLocaleString()}억`;
}

export default function InvestmentTable({
  items,
}: {
  items: InvestmentListItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
        <p className="text-sm text-gray-400">해당 조건의 투자 건이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크탑 테이블 */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                날짜
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                기업명
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                분야
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                라운드
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                금액
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item) => (
              <tr key={item.id} className="transition hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(item.announcedDate)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/companies/${item.companyId}`}
                    className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                  >
                    {item.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.sector ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ROUND_COLORS[item.roundName as keyof typeof ROUND_COLORS] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.roundName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                  {formatAmount(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-2 sm:hidden">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/companies/${item.companyId}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.companyName}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {item.sector ?? "-"} · {formatDate(item.announcedDate)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  ROUND_COLORS[item.roundName as keyof typeof ROUND_COLORS] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {item.roundName}
              </span>
            </div>
            <p className="mt-2 text-right text-lg font-bold tabular-nums text-gray-900">
              {formatAmount(item.amount)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}