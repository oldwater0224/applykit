// ============================================================
// 스타트업 뉴스 동기화 파이프라인
// 네이버 API → 필터링 → 중복 제거 → DB 저장
// service_role 키 사용, 서버 사이드 전용
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { searchNews, NaverRateLimitError, NaverAuthError } from "./client";
import { NEWS_KEYWORDS } from "./constants";
import { stripHtml, hashUrl, chooseUrl, normalizeUrl } from "./sanitize";
import { filterArticle } from "./filter";
import { resolvePress } from "./press";
import type { NaverNewsItem } from "./types";
import { delay } from "@/src/lib/dart/client";

export interface NewsSyncResult {
  fetched: number;
  filtered: number;
  deduped: number;
  inserted: number;
  deleted: number;
  durationMs: number;
  errors: { keyword: string; error: string }[];
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE 환경변수가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey);
}

async function getLastSuccessAt(
  supabase: SupabaseClient
): Promise<Date | null> {
  const { data } = await supabase
    .from("sync_logs")
    .select("started_at")
    .eq("sync_type", "news_cron")
    .in("status", ["success", "partial"])
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  return data ? new Date(data.started_at) : null;
}

function calcSinceDays(lastSuccess: Date | null): number {
  if (!lastSuccess) return 7;
  const elapsed = (Date.now() - lastSuccess.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(30, Math.max(2, Math.ceil(elapsed) + 1));
}

async function loadExistingHashes(
  supabase: SupabaseClient,
  sinceIso: string
): Promise<{ urlHashes: Set<string>; contentKeys: Set<string> }> {
  const urlHashes = new Set<string>();
  const contentKeys = new Set<string>();

  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data } = await supabase
      .from("startup_news")
      .select("url_hash, content_key")
      .gte("published_at", sinceIso)
      .range(from, from + pageSize - 1);

    if (!data || data.length === 0) break;

    for (const row of data) {
      urlHashes.add(row.url_hash);
      contentKeys.add(row.content_key);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { urlHashes, contentKeys };
}

interface ProcessedArticle {
  title: string;
  description: string | null;
  url: string;
  naver_url: string | null;
  press: string | null;
  published_at: string;
  keyword: string;
  round_name: string | null;
  amount_text: string | null;
  score: number;
  url_hash: string;
  content_key: string;
}

function processItem(
  item: NaverNewsItem,
  keyword: string,
  sinceCutoff: Date,
  seenUrlHashes: Set<string>,
  seenContentKeys: Set<string>
): ProcessedArticle | null {
  const pubDate = new Date(item.pubDate);
  if (isNaN(pubDate.getTime()) || pubDate < sinceCutoff) return null;

  const cleanTitle = stripHtml(item.title);
  const cleanDesc = stripHtml(item.description);

  const result = filterArticle(cleanTitle, cleanDesc);
  if (!result.passed) return null;

  const rawUrl = chooseUrl(item.originallink, item.link);
  const urlHash = hashUrl(rawUrl);

  if (seenUrlHashes.has(urlHash)) return null;

  if (seenContentKeys.has(result.contentKey)) return null;

  seenUrlHashes.add(urlHash);
  seenContentKeys.add(result.contentKey);

  const naverUrl = item.link !== item.originallink ? item.link : null;

  return {
    title: cleanTitle,
    description: cleanDesc || null,
    url: normalizeUrl(rawUrl),
    naver_url: naverUrl,
    press: resolvePress(item.originallink),
    published_at: pubDate.toISOString(),
    keyword,
    round_name: result.roundName,
    amount_text: result.amountText,
    score: result.score,
    url_hash: urlHash,
    content_key: result.contentKey,
  };
}

async function deleteOldNews(supabase: SupabaseClient): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180);

  const { data } = await supabase
    .from("startup_news")
    .delete()
    .lt("published_at", cutoff.toISOString())
    .select("id")
    .limit(1000);

  return data?.length ?? 0;
}

export async function syncStartupNews(
  supabaseOverride?: SupabaseClient,
  options?: { keywords?: string[]; sinceDays?: number }
): Promise<NewsSyncResult> {
  const startTime = Date.now();
  const supabase = supabaseOverride ?? getSupabaseAdmin();
  const keywords = options?.keywords ?? [...NEWS_KEYWORDS];

  const lastSuccess = await getLastSuccessAt(supabase);
  const sinceDays = options?.sinceDays ?? calcSinceDays(lastSuccess);

  const sinceCutoff = new Date();
  sinceCutoff.setDate(sinceCutoff.getDate() - sinceDays);
  const sinceIso = sinceCutoff.toISOString();

  const { urlHashes: seenUrlHashes, contentKeys: seenContentKeys } =
    await loadExistingHashes(supabase, sinceIso);

  let fetched = 0;
  let filtered = 0;
  let deduped = 0;
  let inserted = 0;
  const errors: { keyword: string; error: string }[] = [];
  const rows: ProcessedArticle[] = [];

  for (const keyword of keywords) {
    try {
      const response = await searchNews(keyword);
      fetched += response.items.length;

      for (const item of response.items) {
        const processed = processItem(
          item,
          keyword,
          sinceCutoff,
          seenUrlHashes,
          seenContentKeys
        );

        if (processed) {
          filtered++;
          rows.push(processed);
        }
      }

      if (keywords.indexOf(keyword) < keywords.length - 1) {
        await delay(100);
      }
    } catch (err) {
      if (err instanceof NaverRateLimitError) {
        errors.push({ keyword, error: err.message });
        break;
      }
      if (err instanceof NaverAuthError) {
        errors.push({ keyword, error: err.message });
        break;
      }
      errors.push({ keyword, error: String(err) });
    }
  }

  deduped = fetched - filtered - (fetched - filtered - rows.length + filtered);

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data } = await supabase
      .from("startup_news")
      .upsert(batch, { onConflict: "url_hash", ignoreDuplicates: true })
      .select("id");

    inserted += data?.length ?? 0;
  }

  const deleted = await deleteOldNews(supabase);

  return {
    fetched,
    filtered,
    deduped: fetched - filtered,
    inserted,
    deleted,
    durationMs: Date.now() - startTime,
    errors,
  };
}
