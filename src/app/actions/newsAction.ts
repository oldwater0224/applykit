// ============================================================
// 뉴스 서버 액션 — 홈 화면 등에서 호출
// 쿠키 미사용 anon 클라이언트로 캐시 호환
// ============================================================

"use server";

import { createClient } from "@supabase/supabase-js";
import type { StartupNews } from "@/src/types/news";

function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

export async function getRecentNews(limit?: number): Promise<StartupNews[]> {
  const clampedLimit = Math.min(50, Math.max(1, limit ?? 10));

  const supabase = getSupabaseAnon();

  const { data, error } = await supabase
    .from("startup_news")
    .select("id, title, description, url, naver_url, press, published_at, round_name, amount_text")
    .order("published_at", { ascending: false })
    .limit(clampedLimit);

  if (error) {
    console.error("뉴스 조회 실패:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    naverUrl: row.naver_url,
    press: row.press,
    publishedAt: row.published_at,
    roundName: row.round_name,
    amountText: row.amount_text,
  }));
}
