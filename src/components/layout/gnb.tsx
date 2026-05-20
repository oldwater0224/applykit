"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/companies", label: "스타트업" },
  { href: "/investments", label: "투자/M&A" },
  { href: "/investors", label: "투자자" },
  { href: "/programs", label: "지원하기" },
] as const;

export default function GNB() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 대시보드 내부 페이지에서는 GNB 숨김
  if (pathname.startsWith("/dashboard")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Apply<span className="text-blue-600">Kit</span>
          </span>
        </Link>

        {/* 데스크탑 내비게이션 */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* 검색 + 로그인 (데스크탑) */}
        <div className="hidden items-center gap-3 md:flex">
          {/* 통합 검색 — Day 7에서 구현, 지금은 플레이스홀더 */}
          <button
            type="button"
            className="flex h-8 w-56 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400 transition hover:border-gray-300"
          >
            <SearchIcon />
            <span>기업, 투자자 검색</span>
            <kbd className="ml-auto hidden rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 lg:inline-block">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            로그인
          </Link>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex size-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="메뉴 열기"
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              로그인
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// --- 아이콘 ---

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}