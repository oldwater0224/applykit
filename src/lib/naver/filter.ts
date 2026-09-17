// ============================================================
// 뉴스 필터링 · 점수 · 라운드/금액 태깅 · content_key 생성
// 제목+요약 기준으로 관련성 판정 및 메타 추출
// ============================================================

import {
  EXCLUDE_KEYWORDS,
  FOREIGN_ONLY_KEYWORDS,
  ROUND_KEYWORDS,
  INVESTMENT_ACTION_KEYWORDS,
  STARTUP_KEYWORDS,
} from "./constants";
import { normalizeRoundName, ROUND_NAME_LIST } from "@/src/types/funding";

const AMOUNT_PATTERN = /(\d+(?:\.\d+)?)\s*(억|조|만\s*달러)/;

const ROUND_TAG_MAP: Record<string, string> = {
  시드: "Seed",
  "프리a": "Pre-A",
  "프리 a": "Pre-A",
  "pre-a": "Pre-A",
  "시리즈a": "Series A",
  "시리즈 a": "Series A",
  "series a": "Series A",
  "시리즈b": "Series B",
  "시리즈 b": "Series B",
  "series b": "Series B",
  "시리즈c": "Series C",
  "시리즈 c": "Series C",
  "series c": "Series C",
  "시리즈d": "Series D",
  "시리즈 d": "Series D",
  "series d": "Series D",
  "pre-ipo": "Pre-IPO",
  "프리ipo": "Pre-IPO",
  "프리 ipo": "Pre-IPO",
};

export function isExcluded(text: string): boolean {
  const lower = text.toLowerCase();

  for (const kw of EXCLUDE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return true;
  }

  const hasForeignOnly = FOREIGN_ONLY_KEYWORDS.some((kw) =>
    lower.includes(kw.toLowerCase())
  );
  if (hasForeignOnly) {
    const hasKoreanCompany = /[가-힣]{2,}[은는이가,]/.test(text);
    if (!hasKoreanCompany) return true;
  }

  return false;
}

export function scoreRelevance(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  if (ROUND_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    score += 2;
  }

  if (AMOUNT_PATTERN.test(text)) {
    score += 1;
  }

  if (
    INVESTMENT_ACTION_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
  ) {
    score += 1;
  }

  if (STARTUP_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    score += 1;
  }

  return score;
}

export function tagRound(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [keyword, roundName] of Object.entries(ROUND_TAG_MAP)) {
    if (lower.includes(keyword)) {
      const normalized = normalizeRoundName(roundName);
      if (
        (ROUND_NAME_LIST as readonly string[]).includes(normalized)
      ) {
        return normalized;
      }
      return roundName;
    }
  }

  return null;
}

export function tagAmount(text: string): string | null {
  const match = text.match(AMOUNT_PATTERN);
  if (!match) return null;
  return `${match[1]}${match[2].replace(/\s/g, "")}`;
}

export function extractCompanyName(title: string): string {
  const withoutBrackets = title.replace(/\[[^\]]*\]/g, "").trim();

  const particleMatch = withoutBrackets.match(
    /^(.+?)\s*[은는이가,]/
  );
  if (particleMatch && particleMatch[1].trim().length >= 2) {
    return particleMatch[1].trim();
  }

  const firstWord = withoutBrackets.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 2) {
    return firstWord;
  }

  const stripped = title.replace(/[\s\d!@#$%^&*()_+=\-\[\]{};':"\\|,.<>/?]/g, "");
  return stripped.slice(0, 20) || "unknown";
}

export function buildContentKey(
  title: string,
  roundName: string | null,
  amountText: string | null
): string {
  const company = extractCompanyName(title);
  const round = roundName ?? "-";

  let amount = "-";
  if (amountText) {
    const normalized = amountText.replace(/[원\s]/g, "");
    amount = normalized || "-";
  }

  return `${company}|${round}|${amount}`;
}

export interface FilterResult {
  passed: boolean;
  score: number;
  roundName: string | null;
  amountText: string | null;
  contentKey: string;
}

export function filterArticle(
  cleanTitle: string,
  cleanDescription: string
): FilterResult {
  const combined = `${cleanTitle} ${cleanDescription}`;

  const roundName = tagRound(combined);
  const amountText = tagAmount(combined);
  const score = scoreRelevance(combined);
  const contentKey = buildContentKey(cleanTitle, roundName, amountText);

  const excluded = isExcluded(combined);
  const passed = !excluded && score >= 2;

  return { passed, score, roundName, amountText, contentKey };
}
