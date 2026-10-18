"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_NAV_GROUPS,
  SERVICE_HOME_HREF,
  isNavItemActive,
} from "@/src/components/dashboard/navConfig";

export interface DashboardOrgInfo {
  /** 운영기관명. 조회 실패 시 null → "운영기관"으로 표시 */
  orgName: string | null;
  /** org_members.role */
  role: "admin" | "member" | null;
}

export const ROLE_LABEL: Record<"admin" | "member", string> = {
  admin: "관리자",
  member: "멤버",
};

/* ------------------------------------------------------------------ */
/* 로고                                                                */
/* ------------------------------------------------------------------ */

export function DashboardBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-2"
      aria-label="ApplyKit 관리자 콘솔 홈"
    >
      <span className="text-[15px] font-bold tracking-tight text-(--dash-text)">
        Apply<span className="text-(--brand-500)">Kit</span>
      </span>
      <span className="rounded border border-(--dash-border) px-1.5 py-px text-xs sm:text-[10px] font-semibold text-(--dash-text-muted)">
        ADMIN
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* 그룹형 메뉴 (데스크톱 사이드바 + 모바일 시트 공용)                    */
/* ------------------------------------------------------------------ */

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="관리자 메뉴" className="px-3">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-5 first:mt-3">
          <p className="mb-1 px-2.5 text-xs sm:text-[11px] font-semibold tracking-wide text-(--dash-text-subtle)">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isNavItemActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-(--brand-500)",
                      active
                        ? "bg-(--dash-active-bg) font-semibold text-(--dash-active-text)"
                        : "font-medium text-(--dash-text-secondary) hover:bg-(--dash-hover-bg) hover:text-(--dash-text)"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r bg-(--dash-active-indicator)"
                      />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active
                          ? "text-(--dash-active-indicator)"
                          : "text-(--dash-text-subtle)"
                      )}
                      strokeWidth={active ? 2.25 : 2}
                      aria-hidden
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* 하단: 기관 정보 + 서비스 홈 바로가기                                 */
/* ------------------------------------------------------------------ */

export function DashboardOrgFooter({
  orgName,
  role,
  onNavigate,
}: DashboardOrgInfo & { onNavigate?: () => void }) {
  const name = orgName ?? "운영기관";

  return (
    <div className="border-t border-(--dash-border) p-3">
      <Link
        href={SERVICE_HOME_HREF}
        onClick={onNavigate}
        className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-(--dash-text-secondary) transition-colors hover:bg-(--dash-hover-bg) hover:text-(--dash-text) focus-visible:outline-2 focus-visible:outline-(--brand-500)"
      >
        <ArrowUpRight
          className="size-4 shrink-0 text-(--dash-text-muted)"
          aria-hidden
        />
        서비스 홈 바로가기
      </Link>

      <div className="mt-2 flex items-center gap-2.5 rounded-md border border-(--dash-border) bg-(--dash-input-bg) px-2.5 py-2">
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--brand-600) text-[12px] font-bold text-white"
        >
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p
            className="truncate text-[12px] font-semibold text-(--dash-text)"
            title={name}
          >
            {name}
          </p>
          <p className="text-xs sm:text-[11px] text-(--dash-text-muted)">
            운영기관{role ? ` · ${ROLE_LABEL[role]}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 데스크톱 사이드바 (md 이상)                                          */
/* ------------------------------------------------------------------ */

export function DashboardSidebar({ orgName, role }: DashboardOrgInfo) {
  return (
    <aside className="hidden w-(--dash-sidebar-width) shrink-0 flex-col border-r border-(--dash-border) bg-(--dash-surface) md:flex">
      <div className="flex h-(--dash-topbar-height) shrink-0 items-center border-b border-(--dash-border) px-5">
        <DashboardBrand />
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <DashboardNav />
      </div>
      <DashboardOrgFooter orgName={orgName} role={role} />
    </aside>
  );
}
