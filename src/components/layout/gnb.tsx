"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  globalSearch,
  type SearchResult,
} from "@/src/app/actions/searchAction";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/companies", label: "스타트업" },
  { href: "/investments", label: "투자/M&A" },
  { href: "/investors", label: "투자자" },
  { href: "/programs", label: "지원사업" },
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    setResults([]);
    router.push(
      result.type === "company"
        ? `/companies/${result.id}`
        : `/investors/${result.id}`,
    );
  };
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: "var(--navy-900)" }}
    >
      <nav className="mx-auto flex h-12 max-w-(--max-width) items-center justify-between px-4 lg:px-6">
        {/* 로고 */}
        <Link href="/" className="mr-8 flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-white">
            Apply<span style={{ color: "var(--brand-500)" }}>Kit</span>
          </span>
        </Link>

        {/* 데스크탑 네비 */}
        <ul className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="relative px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  color: isActive(href) ? "#ffffff" : "var(--gray-400)",
                }}
              >
                {label}
                {isActive(href) && (
                  <span
                    className="absolute inset-x-1 -bottom-3.25 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--brand-500)" }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* 우측: 검색 + 로그인 */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="flex h-7 w-52 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-all"
              style={{
                backgroundColor: searchOpen
                  ? "var(--navy-700)"
                  : "var(--navy-800)",
                color: "var(--gray-400)",
                border: searchOpen
                  ? "1px solid var(--navy-600)"
                  : "1px solid var(--navy-700)",
              }}
            >
              <SearchIcon size={12} />
              {searchOpen ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="기업, 투자자 검색"
                  className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-gray-500"
                />
              ) : (
                <>
                  <span>통합검색</span>
                  <kbd
                    className="ml-auto rounded px-1 py-0.5 text-[10px]"
                    style={{
                      backgroundColor: "var(--navy-700)",
                      color: "var(--gray-500)",
                    }}
                  >
                    ⌘K
                  </kbd>
                </>
              )}
            </button>

            {/* 검색 결과 드롭다운 */}
            {searchOpen && searchQuery.length > 0 && (
              <div
                className="absolute right-0 top-9 w-80 overflow-hidden rounded-lg border shadow-xl"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--gray-200)",
                }}
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div
                      className="size-4 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "var(--brand-500)" }}
                    />
                  </div>
                ) : results.length === 0 ? (
                  <div
                    className="px-4 py-8 text-center text-[13px]"
                    style={{ color: "var(--gray-400)" }}
                  >
                    검색 결과가 없습니다
                  </div>
                ) : (
                  <div className="py-1">
                    {results.filter((r) => r.type === "company").length > 0 && (
                      <>
                        <div
                          className="px-3 py-1.5 text-[11px] font-medium"
                          style={{ color: "var(--gray-400)" }}
                        >
                          스타트업
                        </div>
                        {results
                          .filter((r) => r.type === "company")
                          .map((r) => (
                            <button
                              key={r.id}
                              onClick={() => handleResultClick(r)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-slate-50"
                            >
                              <span
                                className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                                style={{
                                  backgroundColor: "var(--brand-50)",
                                  color: "var(--brand-600)",
                                }}
                              >
                                S
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate font-medium"
                                  style={{ color: "var(--gray-800)" }}
                                >
                                  {r.name}
                                </p>
                                {r.subtitle && (
                                  <p
                                    className="truncate text-[11px]"
                                    style={{ color: "var(--gray-400)" }}
                                  >
                                    {r.subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                      </>
                    )}
                    {results.filter((r) => r.type === "investor").length >
                      0 && (
                      <>
                        <div
                          className="px-3 py-1.5 text-[11px] font-medium"
                          style={{ color: "var(--gray-400)" }}
                        >
                          투자자
                        </div>
                        {results
                          .filter((r) => r.type === "investor")
                          .map((r) => (
                            <button
                              key={r.id}
                              onClick={() => handleResultClick(r)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-slate-50"
                            >
                              <span
                                className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                                style={{
                                  backgroundColor: "#ecfdf5",
                                  color: "var(--accent-emerald)",
                                }}
                              >
                                V
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate font-medium"
                                  style={{ color: "var(--gray-800)" }}
                                >
                                  {r.name}
                                </p>
                                {r.subtitle && (
                                  <p
                                    className="truncate text-[11px]"
                                    style={{ color: "var(--gray-400)" }}
                                  >
                                    {r.subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href="/login"
            className="rounded-md px-3 py-1 text-[12px] font-medium transition"
            style={{ color: "var(--gray-400)" }}
          >
            로그인
          </Link>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex size-8 items-center justify-center rounded md:hidden"
          style={{ color: "var(--gray-400)" }}
          aria-label="메뉴"
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div
          className="border-t px-4 pb-4 pt-2 md:hidden"
          style={{
            backgroundColor: "var(--navy-900)",
            borderColor: "var(--navy-700)",
          }}
        >
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="기업, 투자자 검색..."
              className="w-full rounded-md px-3 py-2 text-[13px] text-white outline-none placeholder:text-gray-500"
              style={{
                backgroundColor: "var(--navy-800)",
                border: "1px solid var(--navy-700)",
              }}
            />
            {searchQuery.length > 0 && results.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      handleResultClick(r);
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px]"
                    style={{ color: "var(--gray-300)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--gray-500)" }}
                    >
                      {r.type === "company" ? "기업" : "투자"}
                    </span>
                    <span className="truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    color: isActive(href) ? "#ffffff" : "var(--gray-400)",
                    backgroundColor: isActive(href)
                      ? "var(--navy-800)"
                      : "transparent",
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
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
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
