"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StartupNews } from "@/src/types/news";

const VISIBLE_COUNT = 6;
const ROTATE_INTERVAL = 7000;

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

function pickRandom(pool: StartupNews[], count: number): StartupNews[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function NewsRotator({ news }: { news: StartupNews[] }) {
  const [visible, setVisible] = useState<StartupNews[]>(
    news.slice(0, VISIBLE_COUNT)
  );
  const [fading, setFading] = useState(false);
  const hovering = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotate = useCallback(() => {
    if (hovering.current) return;
    setFading(true);
    setTimeout(() => {
      setVisible(pickRandom(news, VISIBLE_COUNT));
      setFading(false);
    }, 300);
  }, [news]);

  useEffect(() => {
    intervalRef.current = setInterval(rotate, ROTATE_INTERVAL);

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        intervalRef.current = setInterval(rotate, ROTATE_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rotate]);

  const handleMouseEnter = () => {
    hovering.current = true;
  };

  const handleMouseLeave = () => {
    hovering.current = false;
  };

  return (
    <div
      className={`grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {visible.map((item) => (
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
              className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: "var(--gray-400)" }}
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
                <span style={{ color: "var(--gray-500)" }}>
                  · {item.amountText}
                </span>
              )}
            </span>
          )}

          <h3
            className="text-[13px] font-semibold leading-snug lg:text-[14px]"
            style={{ color: "#fff" }}
          >
            <span className="line-clamp-1">{item.title}</span>
          </h3>

          {item.description && (
            <p
              className="mt-1 text-[12px] leading-relaxed line-clamp-1 md:line-clamp-2"
              style={{ color: "var(--gray-400)" }}
            >
              {item.description}
            </p>
          )}

          <div
            className="mt-2 flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--gray-500)" }}
          >
            {item.press && <span>{item.press}</span>}
            {item.press && <span>·</span>}
            <span>{formatDate(item.publishedAt)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
