"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronRight, Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ARCHIVE_SEARCH_PATH,
  SERVICE_HOME_HREF,
  getDashboardBreadcrumbs,
} from "@/src/components/dashboard/navConfig";
import {
  DashboardBrand,
  DashboardNav,
  DashboardOrgFooter,
  ROLE_LABEL,
  type DashboardOrgInfo,
} from "@/src/components/dashboard/sidebar";

export interface DashboardTopbarProps extends DashboardOrgInfo {
  /** 로그인 사용자 이메일 (사용자 표시용) */
  userEmail: string | null;
}

export function DashboardTopbar({
  orgName,
  role,
  userEmail,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const crumbs = getDashboardBreadcrumbs(pathname);
  const current = crumbs[crumbs.length - 1];
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  const displayName = orgName ?? "운영기관";
  const initial = (userEmail ?? displayName).charAt(0).toUpperCase();

  return (
    <header className="flex h-(--dash-topbar-height) shrink-0 items-center gap-3 border-b border-(--dash-border) bg-(--dash-surface) px-4 lg:px-6">
      {/* 모바일 메뉴 버튼 */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="-ml-1 flex size-8 items-center justify-center rounded-md text-(--dash-text-secondary) hover:bg-(--dash-hover-bg) hover:text-(--dash-text) md:hidden"
        aria-label="메뉴 열기"
        aria-expanded={mobileOpen}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* 현재 위치 */}
      <nav aria-label="현재 위치" className="min-w-0 flex-1">
        {/* 모바일: 현재 페이지명만 */}
        <p className="truncate text-[14px] font-semibold text-(--dash-text) sm:hidden">
          {current.label}
        </p>
        {/* sm 이상: 브레드크럼 */}
        <ol className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-(--dash-text-subtle)"
                    aria-hidden
                  />
                )}
                <li className="min-w-0 truncate">
                  {isLast ? (
                    <span
                      aria-current="page"
                      className="font-semibold text-(--dash-text)"
                    >
                      {crumb.label}
                    </span>
                  ) : crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-(--dash-text-muted) hover:text-(--dash-text)"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-(--dash-text-subtle)">
                      {crumb.label}
                    </span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      {/* 검색 (심사 아카이브) */}
      <ArchiveSearchForm className="hidden w-60 lg:w-72 md:block" />

      {/* 서비스 홈 */}
      <Link
        href={SERVICE_HOME_HREF}
        className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-(--dash-border) px-2 text-[12px] font-medium text-(--dash-text-secondary) transition-colors hover:bg-(--dash-hover-bg) hover:text-(--dash-text) sm:px-2.5"
        aria-label="서비스 홈으로 이동"
      >
        <span className="hidden sm:inline">서비스 홈</span>
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>

      {/* 기관 / 사용자 */}
      <div className="hidden h-6 w-px bg-(--dash-border) sm:block" aria-hidden />
      <div className="flex shrink-0 items-center gap-2">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-(--dash-active-bg) text-[12px] font-semibold text-(--dash-active-text)"
        >
          {initial}
        </span>
        <div className="hidden max-w-44 min-w-0 leading-tight lg:block">
          <p
            className="truncate text-[12px] font-semibold text-(--dash-text)"
            title={displayName}
          >
            {displayName}
            {role && (
              <span className="ml-1 font-normal text-(--dash-text-muted)">
                · {ROLE_LABEL[role]}
              </span>
            )}
          </p>
          {userEmail && (
            <p
              className="truncate text-[11px] text-(--dash-text-muted)"
              title={userEmail}
            >
              {userEmail}
            </p>
          )}
        </div>
        <span className="sr-only lg:hidden">
          {displayName} {userEmail ?? ""}
        </span>
      </div>

      {/* 모바일 메뉴 시트 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-(--dash-sidebar-width) max-w-[85vw] gap-0 border-(--dash-border) bg-(--dash-surface) p-0 text-(--dash-text) [&>button:last-child]:text-(--dash-text-muted)"
        >
          <div className="flex h-(--dash-topbar-height) shrink-0 items-center border-b border-(--dash-border) px-5">
            <SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
            <SheetDescription className="sr-only">
              관리자 대시보드 페이지 이동
            </SheetDescription>
            <DashboardBrand onNavigate={closeMobile} />
          </div>
          <div className="px-3 pt-3">
            <ArchiveSearchForm onSubmitted={closeMobile} />
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            <DashboardNav onNavigate={closeMobile} />
          </div>
          <DashboardOrgFooter
            orgName={orgName}
            role={role}
            onNavigate={closeMobile}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}

/** 심사 아카이브 검색 → /dashboard/archive?q=... (next/form GET 이동) */
function ArchiveSearchForm({
  className,
  onSubmitted,
}: {
  className?: string;
  onSubmitted?: () => void;
}) {
  return (
    <Form
      action={ARCHIVE_SEARCH_PATH}
      role="search"
      className={className}
      onSubmit={onSubmitted}
    >
      <label className="relative block">
        <span className="sr-only">심사 아카이브 회사 검색</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--dash-text-subtle)"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          placeholder="심사 아카이브에서 회사 검색"
          autoComplete="off"
          className="h-8 w-full rounded-md border border-(--dash-border) bg-(--dash-input-bg) pr-3 pl-8 text-[13px] text-(--dash-text) outline-none transition placeholder:text-(--dash-text-subtle) focus:border-(--brand-500) focus:bg-(--dash-surface) focus:ring-2 focus:ring-(--dash-focus-ring)"
        />
      </label>
    </Form>
  );
}
