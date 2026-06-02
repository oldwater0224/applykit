"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { value: "all", label: "전체" },
  { value: "Seed,Pre-A", label: "Seed~Pre-A" },
  { value: "Series A", label: "Series A" },
  { value: "Series B,Series C", label: "Series B~C" },
  { value: "Series D,Pre-IPO", label: "Series D+" },
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
    params.delete("page");
    router.push(`/investments?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {TABS.map(({ value, label }) => {
        const isActive =
          currentRound === value ||
          (!searchParams.has("round") && value === "all");
        return (
          <button
            key={value}
            onClick={() => handleTab(value)}
            className="shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all"
            style={{
              backgroundColor: isActive ? "var(--navy-900)" : "var(--gray-100)",
              color: isActive ? "#ffffff" : "var(--gray-500)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}