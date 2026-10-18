import { parseDeadlineMs } from "@/src/lib/adminDashboard/aggregate";

/**
 * 관리자 대시보드 표시용 날짜 포맷 (모두 KST 기준으로 표시)
 * - 마감일은 집계 로직과 같은 규칙(parseDeadlineMs: 오프셋 없으면 KST)으로 해석
 */

const KST_PARTS = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function kstParts(ms: number) {
  const map: Record<string, string> = {};
  for (const p of KST_PARTS.formatToParts(new Date(ms))) map[p.type] = p.value;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    weekday: map.weekday,
    time: `${map.hour}:${map.minute}`,
  };
}

export interface KstFormatOptions {
  /** 연도 표시 (기본 false → "10.20") */
  withYear?: boolean;
  /** 요일 표시 (기본 false) */
  withWeekday?: boolean;
  /** 시각 표시 (기본 false) */
  withTime?: boolean;
}

/** epoch ms → "2026.10.20 (화) 18:00" 형태 (옵션에 따라 일부 생략) */
export function formatKst(ms: number, opts: KstFormatOptions = {}): string {
  const p = kstParts(ms);
  let out = opts.withYear ? `${p.year}.${p.month}.${p.day}` : `${p.month}.${p.day}`;
  if (opts.withWeekday) out += ` (${p.weekday})`;
  if (opts.withTime) out += ` ${p.time}`;
  return out;
}

/** ISO 문자열 → KST 표시. null/무효값은 "—" */
export function formatKstIso(
  value: string | null | undefined,
  opts: KstFormatOptions = {}
): string {
  if (!value) return "—";
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? "—" : formatKst(ms, opts);
}

/**
 * 마감일 → KST 표시. 날짜만 있는 값(23:59:59 처리)이나 자정 마감은 시각 생략
 */
export function formatDeadline(
  value: string | null | undefined,
  opts: Omit<KstFormatOptions, "withTime"> = {}
): string {
  const ms = parseDeadlineMs(value ?? null);
  if (ms === null) return "—";
  const time = kstParts(ms).time;
  const showTime = time !== "23:59" && time !== "00:00";
  return formatKst(ms, { ...opts, withTime: showTime });
}
