// ============================================================
// 수동 뉴스 동기화 라우트
// POST /api/admin/sync-news
// 시크릿 미설정 시 401 반환 (기존 크론의 open-if-missing 패턴 복사 금지)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncStartupNews } from "@/src/lib/naver/sync";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.DART_SYNC_SECRET;

  if (process.env.NODE_ENV === "development" && !secret) {
    return true;
  }

  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE 환경변수가 설정되지 않았습니다.");
  }
  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const startTime = new Date();

  const { data: logEntry } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "news_manual",
      started_at: startTime.toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    const result = await syncStartupNews(supabase);

    const status =
      result.errors.length > 0
        ? result.inserted > 0
          ? "partial"
          : "failed"
        : "success";

    const summary = `수집 ${result.fetched} / 통과 ${result.filtered} / 중복 ${result.deduped} / 저장 ${result.inserted} / 삭제 ${result.deleted} / ${(result.durationMs / 1000).toFixed(1)}s`;

    if (logId) {
      await supabase
        .from("sync_logs")
        .update({
          finished_at: new Date().toISOString(),
          status,
          summary,
        })
        .eq("id", logId);
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (logId) {
      await supabase
        .from("sync_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          summary: String(err),
        })
        .eq("id", logId);
    }

    return NextResponse.json(
      { error: "동기화 실패" },
      { status: 500 }
    );
  }
}
