import {
  Archive,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

/**
 * 관리자 대시보드 네비게이션 정의
 * - 사이드바(데스크톱), 모바일 시트, 상단 헤더 브레드크럼이 함께 사용한다.
 */

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "개요",
    items: [{ href: "/dashboard", label: "대시보드", icon: LayoutDashboard }],
  },
  {
    label: "공고·접수",
    items: [{ href: "/dashboard/programs", label: "공고 관리", icon: FileText }],
  },
  {
    label: "심사",
    items: [
      { href: "/dashboard/archive", label: "심사 아카이브", icon: Archive },
    ],
  },
];

/** 서비스(공개 사이트) 홈 */
export const SERVICE_HOME_HREF = "/";

/** 상단 헤더 검색이 이동할 경로 (쿼리: ?q=) */
export const ARCHIVE_SEARCH_PATH = "/dashboard/archive";

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface DashboardCrumb {
  label: string;
  href?: string;
}

/**
 * pathname → 브레드크럼
 * 예) /dashboard/programs/abc/applications/xyz
 *   → 공고·접수 / 공고 관리 / 공고 상세 / 지원서 상세
 * 첫 항목은 메뉴 그룹 라벨(링크 없음), 마지막 항목은 현재 페이지(링크 없음).
 */
export function getDashboardBreadcrumbs(pathname: string): DashboardCrumb[] {
  const segments = pathname.split("/").filter(Boolean).slice(1); // "dashboard" 제거
  const [section, id, sub, subId] = segments;

  if (section === "programs") {
    const crumbs: DashboardCrumb[] = [
      { label: "공고·접수" },
      { label: "공고 관리", href: "/dashboard/programs" },
    ];
    if (id) {
      crumbs.push({ label: "공고 상세", href: `/dashboard/programs/${id}` });
      if (sub === "applications" && subId) {
        crumbs.push({ label: "지원서 상세" });
      }
    }
    return stripLastHref(crumbs);
  }

  if (section === "archive") {
    const crumbs: DashboardCrumb[] = [
      { label: "심사" },
      { label: "심사 아카이브", href: "/dashboard/archive" },
    ];
    if (id === "backfill") crumbs.push({ label: "회사명 보정" });
    return stripLastHref(crumbs);
  }

  return [{ label: "개요" }, { label: "대시보드" }];
}

function stripLastHref(crumbs: DashboardCrumb[]): DashboardCrumb[] {
  return crumbs.map((c, i) =>
    i === crumbs.length - 1 ? { label: c.label } : c
  );
}
