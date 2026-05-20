"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ROUND_NAME_LIST } from "@/src/types/funding";

const TABS = [
  { value: "all", label: "전체" },
  { value: "Seed,Pre-A", label: "Seed~Pre-A" },
  { value: "Series A", label: "Series A" },
  { value: "Series B,Series C", label: "Series B~C" },
  { value: "Series D,Pre-IPO", label: "Series D~Pre-IPO" },
  { value: "IPO", label: "IPO" },
  { value: "M&A", label: "M&A" },
] as const;

export default function InvestmentTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRound = searchParams.get("round") ?? "all";

  const handleTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("round");
    } else {
      params.set("round", value);
    }
    params.delete("page"); // 탭 변경 시 페이지 리셋
    router.push(`/investments?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {TABS.map(({ value, label }) => {
        const isActive = currentRound === value || (!searchParams.has("round") && value === "all");
        return (
          <button
            key={value}
            onClick={() => handleTab(value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}