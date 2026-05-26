"use client";

// ============================================================
// src/components/ui/tabs.tsx
// 간단한 탭 컴포넌트
// ============================================================

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
    <div className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-gray-400">{tab.count}</span>
          )}
          {activeTab === tab.id && (
            <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-900" />
          )}
        </button>
      ))}
    </div>
  );
}