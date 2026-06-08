"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: "grid" },
  { href: "/dashboard/programs", label: "공고 관리", icon: "doc" },
  { href: "/dashboard/archive", label: "심사 아카이브", icon: "search" },
] as const;

const BOTTOM_ITEMS = [
  { href: "/", label: "← 메인으로" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="hidden w-52 shrink-0 flex-col justify-between border-r md:flex"
      style={{
        backgroundColor: "var(--navy-900)",
        borderColor: "var(--navy-700)",
      }}
    >
      <div>
        {/* 로고 */}
        <div className="px-4 py-4">
          <Link href="/dashboard">
            <span className="text-[14px] font-bold text-white">
              Apply<span style={{ color: "var(--brand-500)" }}>Kit</span>
            </span>
            <span
              className="ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: "var(--navy-700)",
                color: "var(--gray-400)",
              }}
            >
              관리자
            </span>
          </Link>
        </div>

        {/* 네비 */}
        <nav className="mt-2 px-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor: isActive(href)
                      ? "var(--navy-800)"
                      : "transparent",
                    color: isActive(href)
                      ? "#ffffff"
                      : "var(--gray-400)",
                  }}
                >
                  <NavIcon type={icon} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 하단 */}
      <div className="px-2 pb-4">
        {BOTTOM_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center rounded-md px-3 py-2 text-[11px] font-medium transition-colors"
            style={{ color: "var(--gray-500)" }}
          >
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

function NavIcon({ type }: { type: string }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "doc":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    default:
      return null;
  }
}