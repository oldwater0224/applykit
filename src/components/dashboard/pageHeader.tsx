"use client";

import Link from "next/link";

export function DashboardPageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  actions,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="border-b px-6 py-4"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="mb-1 inline-block text-[11px] transition"
          style={{ color: "var(--gray-400)" }}
        >
          {backLabel ?? "← 뒤로"}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[18px] font-bold"
            style={{ color: "var(--gray-100)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--gray-500)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}