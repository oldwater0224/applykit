"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

export function useTabs(tabs: Tab[], defaultTab?: string) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");
  return { activeTab, setActiveTab, tabs };
}

export function TabList({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="flex gap-0.5"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative px-3 py-2 text-[12px] font-medium transition-colors"
          style={{
            color: activeTab === tab.id ? "var(--gray-900)" : "var(--gray-400)",
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className="ml-1 text-[10px]"
              style={{ color: "var(--gray-400)" }}
            >
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <span
              className="absolute inset-x-0 -bottom-px h-0.5"
              style={{ backgroundColor: "var(--navy-900)" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}