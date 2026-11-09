"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PAGE_TITLE_CLASS } from "@/src/components/layout/pageTitle";

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
          className="mb-1 inline-flex items-center gap-1 text-xs sm:text-[11px] transition"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          {backLabel ?? "뒤로"}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}