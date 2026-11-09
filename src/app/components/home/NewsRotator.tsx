"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StartupNews } from "@/src/types/news";
import { formatKstYmdFromString } from "@/src/lib/datetime/kst";

const VISIBLE_COUNT = 6;
const ROTATE_INTERVAL = 7000;
const FADE_DURATION = 300;

const ROUND_DOT_COLORS: Record<string, string> = {
  Seed: "var(--round-seed)",
  "Pre-A": "var(--round-pre-a)",
  "Series A": "var(--round-series-a)",
  "Series B": "var(--round-series-b)",
  "Series C": "var(--round-series-c)",
  "Series D": "var(--round-series-d)",
  "Pre-IPO": "var(--round-pre-ipo)",
  IPO: "var(--round-ipo)",
  "M&A": "var(--round-ma)",
};

export default function NewsRotator({ news }: { news: StartupNews[] }) {
  const totalPages = Math.ceil(news.length / VISIBLE_COUNT);
  const hasPages = totalPages > 1;

  // page: 이동 목표 페이지(버튼 활성 상태·n/N 표시 기준, 즉시 반영)
  // shownPage: 실제로 카드가 그려지는 페이지(페이드아웃이 끝난 뒤 반영)
  const [page, setPage] = useState(0);
  const [shownPage, setShownPage] = useState(0);
  const [fading, setFading] = useState(false);

  const pageRef = useRef(0);
  const hovering = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 페이지 이동은 이 함수 하나로 처리한다. 진행 중인 페이드 타이머를 먼저 취소해
  // 연속 클릭 시 이전 setTimeout이 나중에 덮어쓰지 않게 한다.
  const goTo = useCallback((next: number) => {
    pageRef.current = next;
    setPage(next);
    setFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      fadeTimeoutRef.current = null;
      setShownPage(next);
      setFading(false);
    }, FADE_DURATION);
  }, []);

  const rotate = useCallback(() => {
    if (hovering.current) return;
    goTo((pageRef.current + 1) % totalPages);
  }, [goTo, totalPages]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (!hasPages || document.hidden) return;
    intervalRef.current = setInterval(rotate, ROTATE_INTERVAL);
  }, [hasPages, rotate, stopTimer]);

  useEffect(() => {
    startTimer();

    const onVisibility = () => {
      if (document.hidden) stopTimer();
      else startTimer();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [startTimer, stopTimer]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  const handleStep = (delta: number) => {
    const next = pageRef.current + delta;
    if (next < 0 || next >= totalPages) return;
    goTo(next);
    // 버튼으로 넘긴 직후 곧바로 자동으로 넘어가지 않도록 7초 타이머를 다시 시작
    startTimer();
  };

  const handleMouseEnter = () => {
    hovering.current = true;
  };

  const handleMouseLeave = () => {
    hovering.current = false;
  };

  const visible = news.slice(
    shownPage * VISIBLE_COUNT,
    shownPage * VISIBLE_COUNT + VISIBLE_COUNT
  );

  const pagerButtonClass =
    "inline-flex min-h-11 items-center gap-1 rounded px-2.5 py-1 text-xs sm:min-h-0 sm:text-[12px] transition disabled:opacity-25 cursor-pointer disabled:cursor-default";

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          className="shrink-0 text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          스타트업 뉴스
        </h2>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {hasPages && (
            <span
              className="hidden text-xs sm:inline sm:text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              7초마다 자동 갱신
            </span>
          )}
          {hasPages && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={page <= 0}
                aria-label="이전 뉴스"
                className={pagerButtonClass}
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronLeft size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                이전
              </button>
              <span
                className="px-1 text-xs tabular-nums sm:text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                {page + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={page >= totalPages - 1}
                aria-label="다음 뉴스"
                className={pagerButtonClass}
                style={{ color: "var(--text-muted)" }}
              >
                다음
                <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {visible.map((item) => {
          // 발행일은 KST 날짜로 표시. 해석할 수 없는 값이면 ""
          const publishedDate = formatKstYmdFromString(item.publishedAt);
          return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border px-4 py-3 transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: "var(--navy-800)",
              borderColor: "var(--navy-700)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget.style.borderColor = "var(--brand-500)");
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.borderColor = "var(--navy-700)");
            }}
          >
            {item.roundName && (
              <span
                className="mb-1.5 inline-flex items-center gap-1 text-xs sm:text-[11px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      ROUND_DOT_COLORS[item.roundName] ?? "var(--gray-400)",
                  }}
                />
                {item.roundName}
                {item.amountText && (
                  <span style={{ color: "var(--text-muted)" }}>
                    · {item.amountText}
                  </span>
                )}
              </span>
            )}

            <h3
              className="text-[13px] font-medium leading-snug lg:text-[14px]"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="line-clamp-1">{item.title}</span>
            </h3>

            {item.description && (
              <p
                className="mt-1 text-[12px] leading-relaxed line-clamp-1 md:line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.description}
              </p>
            )}

            <div
              className="mt-2 flex items-center gap-1.5 text-xs sm:text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {item.press && <span>{item.press}</span>}
              {item.press && publishedDate && <span>·</span>}
              {publishedDate && <span>{publishedDate}</span>}
            </div>
          </a>
          );
        })}
      </div>
    </>
  );
}
