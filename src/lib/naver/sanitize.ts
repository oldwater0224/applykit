// ============================================================
// HTML 정제 · URL 정규화 · 해시 생성
// 네이버 API 응답의 HTML 태그/엔티티 제거, URL 중복 제거용 해시
// ============================================================

import { createHash } from "crypto";
import { TRACKING_PARAMS } from "./constants";

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

export function stripHtml(text: string): string {
  let cleaned = text.replace(/<[^>]*>/g, "");
  cleaned = cleaned.replace(
    /&(?:amp|lt|gt|quot|apos|#39);/g,
    (match) => HTML_ENTITY_MAP[match] ?? match
  );
  cleaned = cleaned.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number(code))
  );
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    for (const param of [...url.searchParams.keys()]) {
      if (
        TRACKING_PARAMS.includes(param as (typeof TRACKING_PARAMS)[number]) ||
        param.startsWith("utm_")
      ) {
        url.searchParams.delete(param);
      }
    }

    let normalized = url.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return rawUrl;
  }
}

export function hashUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return createHash("sha256").update(normalized).digest("hex");
}

export function chooseUrl(originallink: string, link: string): string {
  return originallink || link;
}
