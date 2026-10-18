// KST(UTC+9) 일시 변환 유틸 - 순수 함수, 실행 환경 TZ와 무관
//
// 한국은 DST가 없으므로 UTC+9 고정 오프셋으로 계산한다.
// 런타임 TZ에 의존하는 Date 메서드(getHours, toLocaleString 등)는 쓰지 않고
// Date.UTC / getUTC* / toISOString만 사용한다.
//
// 용어
// - datetime-local 문자열: <input type="datetime-local">의 값. 'YYYY-MM-DDTHH:mm'(초 선택), 오프셋 없음
// - ISO 문자열: 오프셋(Z 또는 ±HH:MM)이 붙은 절대 시각. DB(timestamptz) 응답은 '...+00:00' 형식

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const HAS_ZONE_RE = /(Z|[+-]\d{2}(:?\d{2})?)$/i;

// 저장 전 검증용 엄격한 형식: 날짜 [+ 시각 [+ 초[.소수]]] [+ 오프셋]
const STRICT_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;

/** 문자열 끝에 타임존(Z 또는 ±HH[:MM])이 붙어 있는지 */
// 'YYYY-MM-DD'는 끝의 '-DD'가 오프셋처럼 보이므로 먼저 제외한다
export function hasTimeZone(value: string): boolean {
  const s = value.trim();
  if (DATE_ONLY_RE.test(s)) return false;
  return HAS_ZONE_RE.test(s.replace(" ", "T"));
}

/**
 * 일시 문자열 → UTC epoch ms. 해석 불가면 null
 * - 'YYYY-MM-DD'         : KST 그날 00:00
 * - 오프셋 없는 일시      : KST로 해석 (datetime-local 원본 등)
 * - 오프셋/Z 있는 일시    : 그대로 해석
 */
export function parseKstDateTimeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;

  if (DATE_ONLY_RE.test(s)) {
    const ms = Date.parse(`${s}T00:00:00+09:00`);
    return Number.isNaN(ms) ? null : ms;
  }

  const normalized = s.replace(" ", "T");
  const ms = HAS_ZONE_RE.test(normalized)
    ? Date.parse(normalized)
    : Date.parse(`${normalized}+09:00`);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * 마감일 문자열 → UTC epoch ms. 해석 불가면 null
 * - 'YYYY-MM-DD'        : KST 그날 23:59:59.999 (그날 하루 종일 마감 전으로 간주)
 * - 오프셋 없는 일시     : KST로 해석
 * - 오프셋/Z 있는 일시   : 그대로 해석
 * 관리자 대시보드 집계와 지원서 서버 마감 판정이 같은 규칙을 쓰도록 여기 둔다.
 */
export function parseDeadlineMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;

  if (DATE_ONLY_RE.test(s)) {
    const start = parseKstDateTimeMs(s);
    return start === null ? null : start + DAY_MS - 1;
  }

  return parseKstDateTimeMs(s);
}

/**
 * 형식과 달력 값(2월 30일, 25시 등)까지 엄격하게 검증.
 * Date.parse는 '2026-02-30'을 3월 2일로 넘겨버리므로 저장 전에는 이 검사를 거친다.
 */
export function isValidDateTimeString(value: string): boolean {
  const m = STRICT_RE.exec(value.trim());
  if (!m) return false;
  const [, y, mo, d, h = "0", mi = "0", sec = "0"] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(sec);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * datetime-local 문자열(KST로 간주) → UTC ISO 문자열 ('...Z')
 * - 예: '2026-06-18T09:21' → '2026-06-18T00:21:00.000Z'
 * - 이미 오프셋이 붙은 값은 그 시각 그대로 ISO로 변환
 * - 빈 값/잘못된 값은 null
 */
export function kstLocalInputToIso(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  if (!isValidDateTimeString(value)) return null;
  const ms = parseKstDateTimeMs(value);
  return ms === null ? null : new Date(ms).toISOString();
}

/**
 * 저장된 일시(ISO, 오프셋 포함) → KST datetime-local 문자열 'YYYY-MM-DDTHH:mm'
 * - 예: '2026-06-18T00:21:00+00:00' → '2026-06-18T09:21'
 * - 오프셋 없는 값은 KST로 간주 (parseKstDateTimeMs 규칙)
 * - 초 이하는 버림 (datetime-local 기본 step=60)
 * - null/빈 값/잘못된 값은 '' (입력 칸을 비움)
 */
export function isoToKstLocalInput(value: string | null | undefined): string {
  const ms = parseKstDateTimeMs(value);
  if (ms === null) return "";
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 16);
}

export type DeadlineNormalizeResult =
  | { ok: true; value: string | null | undefined }
  | { ok: false };

/**
 * 서버 저장 직전 마감일 정규화 (timestamptz 컬럼용)
 * - undefined          : undefined (partial update에서 필드 미변경)
 * - null / 빈 문자열    : null (마감일 없음)
 * - 오프셋/Z 포함 값    : 검증만 하고 원본 그대로 (이중 변환 방지)
 * - 오프셋 없는 값      : KST로 해석해 UTC ISO('...Z')로 변환
 * - 형식 오류          : { ok: false }
 */
export function normalizeDeadlineForStorage(
  value: string | null | undefined,
): DeadlineNormalizeResult {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };
  const s = value.trim();
  if (!s) return { ok: true, value: null };
  if (!isValidDateTimeString(s)) return { ok: false };

  if (hasTimeZone(s)) {
    return parseKstDateTimeMs(s) === null ? { ok: false } : { ok: true, value: s };
  }
  const iso = kstLocalInputToIso(s);
  return iso === null ? { ok: false } : { ok: true, value: iso };
}
