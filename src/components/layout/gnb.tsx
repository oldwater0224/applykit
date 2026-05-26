"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { globalSearch, type SearchResult } from "@/src/app/actions/searchAction";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/companies", label: "스타트업" },
  { href: "/investments", label: "투자/M&A" },
  { href: "/investors", label: "투자자" },
  { href: "/programs", label: "지원하기" },
] as const;

export default function GNB() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 디바운스 검색
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 1) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await globalSearch(value);
      setResults(res);
      setIsSearching(false);
    }, 300);
  }, []);

  // 결과 클릭
  const handleResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    setResults([]);
    if (result.type === "company") {
      router.push(`/companies/${result.id}`);
    } else {
      router.push(`/investors/${result.id}`);
    }
  };

  if (pathname.startsWith("/dashboard")) return null;

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

        {/* 검색 + 로그인 */}
        <div className="hidden items-center gap-3 md:flex">
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className={`flex h-8 w-56 items-center gap-2 rounded-md border px-3 text-sm transition ${
                searchOpen
                  ? "border-blue-400 bg-white ring-2 ring-blue-100"
                  : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"
              }`}
            >
              <SearchIcon />
              {searchOpen ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="기업, 투자자 검색"
                  className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                />
              ) : (
                <>
                  <span>기업, 투자자 검색</span>
                  <kbd className="ml-auto hidden rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 lg:inline-block">
                    ⌘K
                  </kbd>
                </>
              )}
            </button>

            {/* 검색 결과 드롭다운 */}
            {searchOpen && (searchQuery.length > 0 || results.length > 0) && (
              <div className="absolute right-0 top-10 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : results.length === 0 && searchQuery.length > 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    검색 결과가 없습니다
                  </div>
                ) : (
                  <div>
                    {/* 기업 결과 */}
                    {results.filter((r) => r.type === "company").length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-medium text-gray-400">
                          스타트업
                        </div>
                        {results
                          .filter((r) => r.type === "company")
                          .map((r) => (
                            <button
                              key={r.id}
                              onClick={() => handleResultClick(r)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-medium text-blue-600">
                                기
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-900">
                                  {r.name}
                                </p>
                                {r.subtitle && (
                                  <p className="truncate text-xs text-gray-400">
                                    {r.subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* 투자자 결과 */}
                    {results.filter((r) => r.type === "investor").length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-medium text-gray-400">
                          투자자
                        </div>
                        {results
                          .filter((r) => r.type === "investor")
                          .map((r) => (
                            <button
                              key={r.id}
                              onClick={() => handleResultClick(r)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-xs font-medium text-emerald-600">
                                투
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-900">
                                  {r.name}
                                </p>
                                {r.subtitle && (
                                  <p className="truncate text-xs text-gray-400">
                                    {r.subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
          {/* 모바일 검색 */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="기업, 투자자 검색..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pl-9 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
            </div>

            {/* 모바일 검색 결과 */}
            {searchQuery.length > 0 && results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      handleResultClick(r);
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-medium ${
                        r.type === "company"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {r.type === "company" ? "기" : "투"}
                    </span>
                    <span className="truncate text-gray-900">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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

          <div className="mt-3 border-t border-gray-100 pt-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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