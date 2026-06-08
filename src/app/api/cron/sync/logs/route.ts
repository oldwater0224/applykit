// ============================================================
// src/app/api/cron/sync/logs/route.ts
// 동기화 로그 조회 API
// GET /api/cron/sync/logs?limit=10
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 10),
    50
  );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "로그 조회 실패", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}