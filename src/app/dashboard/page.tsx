"use client";

import Link from "next/link";
import { usePrograms } from "@/src/hooks/usePrograms";
import { useAuth } from "@/src/hooks/useAuth";
import { DashboardPageHeader } from "@/src/components/dashboard/pageHeader";

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { data: programs } = usePrograms();

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--brand-500)" }} />
      </div>
    );
  }

  const programCount = Array.isArray(programs) ? programs.length : 0;

  return (
    <div>
      <DashboardPageHeader title="대시보드" subtitle="운영기관 관리 콘솔" />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashCard
            href="/dashboard/programs"
            label="공고 관리"
            value={`${programCount}개`}
            desc="공고 생성, 양식 편집, 접수 현황"
          />
          <DashCard
            href="/dashboard/archive"
            label="심사 아카이브"
            value="검색"
            desc="심사 이력 조회"
          />
          <DashCard
            href="/"
            label="홈으로"
            value="이동"
            desc="한국 스타트업 투자"
          />
        </div>
      </div>
    </div>
  );
}

function DashCard({
  href,
  label,
  value,
  desc,
}: {
  href: string;
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border p-5 transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <p
        className="text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "var(--gray-400)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-[20px] font-bold"
        style={{ color: "var(--gray-200)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--gray-500)" }}>
        {desc}
      </p>
    </Link>
  );
}