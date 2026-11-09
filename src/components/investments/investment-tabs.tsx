"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterChip } from "@/src/components/layout/filterChip";

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
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map(({ value, label }) => {
        const isActive =
          currentRound === value ||
          (!searchParams.has("round") && value === "all");
        return (
          <FilterChip
            key={value}
            active={isActive}
            onClick={() => handleTab(value)}
          >
            {label}
          </FilterChip>
        );
      })}
    </div>
  );
}