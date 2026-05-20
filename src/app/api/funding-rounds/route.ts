// ============================================================
// src/app/api/funding-rounds/route.ts
// POST /api/funding-rounds — 투자 라운드 수동 등록
// GET  /api/funding-rounds — 투자 라운드 목록 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, round_name, amount, currency, announced_date, news_url } = body;

    // 필수값 검증
    if (!company_id || !round_name) {
      return NextResponse.json(
        { error: "company_id와 round_name은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("funding_rounds")
      .insert({
        company_id,
        round_name,
        amount: amount ?? null,
        currency: currency ?? "KRW",
        announced_date: announced_date ?? null,
        news_url: news_url ?? null,
        data_source: "manual",
      })
      .select()
      .single();

    if (error) {
      console.error("[Funding Round Insert Error]", error);
      return NextResponse.json(
        { error: "투자 라운드 등록 실패", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Funding Round API Error]", error);
    return NextResponse.json(
      { error: "서버 오류", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const round = searchParams.get("round"); // 라운드 필터
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    let query = supabase
      .from("funding_rounds")
      .select(
        "id, round_name, amount, currency, announced_date, news_url, data_source, created_at, companies(id, corp_name, sector, industry_name, logo_url)",
        { count: "exact" }
      )
      .order("announced_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (round) {
      query = query.eq("round_name", round);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "조회 실패", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, total: count });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류", detail: String(error) },
      { status: 500 }
    );
  }
}