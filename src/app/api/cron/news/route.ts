// ============================================================
// 뉴스 전용 크론 라우트
// Vercel Cron Job으로 매일 실행, DART 동기화와 분리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncStartupNews } from "@/src/lib/naver/sync";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

function isAuthorizedCron(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    const adminKey = process.env.DART_SYNC_SECRET;
    if (!adminKey) return true;
    return authHeader === `Bearer ${adminKey}`;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const startTime = new Date();

  const { data: logEntry } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "news_cron",
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
      { error: "News sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}
