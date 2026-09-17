// ============================================================
// GET /api/news — 뉴스 목록 조회 API
// 커서 페이지네이션, 라운드 필터, 캐시 헤더
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ROUND_NAME_LIST } from "@/src/types/funding";

function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rawLimit = Number(searchParams.get("limit") ?? 10);
  const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit));

  const cursor = searchParams.get("cursor");
  if (cursor) {
    const parsed = new Date(cursor);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "잘못된 요청", detail: "cursor가 유효한 ISO 8601 날짜가 아닙니다." },
        { status: 400 }
      );
    }
  }

  const round = searchParams.get("round");
  if (round && !(ROUND_NAME_LIST as readonly string[]).includes(round)) {
    return NextResponse.json(
      { error: "잘못된 요청", detail: `유효하지 않은 라운드: ${round}` },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAnon();

    let query = supabase
      .from("startup_news")
      .select("id, title, description, url, naver_url, press, published_at, round_name, amount_text")
      .order("published_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("published_at", cursor);
    }

    if (round) {
      query = query.eq("round_name", round);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    const hasMore = (data?.length ?? 0) > limit;
    const items = (data ?? []).slice(0, limit).map((row) => ({
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

    const nextCursor = hasMore ? items[items.length - 1]?.publishedAt : null;

    const response = NextResponse.json({ items, nextCursor });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    return response;
  } catch {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
