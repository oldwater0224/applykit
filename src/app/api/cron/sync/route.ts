// ============================================================
// src/app/api/cron/sync/route.ts
// Vercel Cron Job — 매일 새벽 자동 동기화
//
// vercel.json에서 스케줄 등록:
// { "crons": [{ "path": "/api/cron/sync", "schedule": "0 3 * * *" }] }
//
// 로직:
// 1. companies 테이블의 모든 corp_code 조회
// 2. 각 기업의 공시를 최근 7일 기준으로 delta 수집
// 3. sync_logs에 결과 기록
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncCompany, syncFinancials, syncDisclosures } from "@/src/lib/dart/sync";
import { delay } from "@/src/lib/dart/client";
import { parseFundingFromDisclosures } from "@/src/lib/dart/disclosureFundingParser";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// Vercel Cron 인증 — CRON_SECRET 검증
function isAuthorizedCron(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 로컬 개발 시에는 DART_SYNC_SECRET으로 대체
  if (!cronSecret) {
    const adminKey = process.env.DART_SYNC_SECRET;
    if (!adminKey) return true; // 키 없으면 개발 환경
    return authHeader === `Bearer ${adminKey}`;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const startTime = new Date();

  // sync_logs에 시작 기록
  const { data: logEntry } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "daily_cron",
      started_at: startTime.toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  let companiesSynced = 0;
  let financialsSynced = 0;
  let disclosuresSynced = 0;
  let fundingParsed = 0;
  const errors: { corpCode: string; error: string }[] = [];

  try {
    // 1) 모든 기업의 corp_code 조회
    const { data: companies } = await supabase
      .from("companies")
      .select("corp_code")
      .not("corp_code", "is", null);

    if (!companies || companies.length === 0) {
      await updateLog(supabase, logId, {
        status: "success",
        summary: "동기화할 기업 없음",
        companiesSynced: 0,
        financialsSynced: 0,
        disclosuresSynced: 0,
        errors: [],
      });
      return NextResponse.json({ success: true, message: "No companies to sync" });
    }

    // 2) 최근 7일 공시 delta 기준 날짜
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10).replace(/-/g, "");

    // 3) 각 기업 순회하며 동기화
    for (const company of companies) {
      const corpCode = company.corp_code;
      if (!corpCode) continue;

      try {
        // 기업 기본 정보 업데이트
        const companyResult = await syncCompany(corpCode);
        if (companyResult.success) companiesSynced++;
        await delay(300);

        // 최근 7일 공시만 수집 (delta)
        const discResult = await syncDisclosures(corpCode, startDate);
        if (discResult.success) disclosuresSynced += discResult.synced;
        await delay(300);
      } catch (err) {
        errors.push({ corpCode, error: String(err) });
      }
    }

    // 4) 공시에서 투자 이벤트 자동 감지
    try {
      const fundingResult = await parseFundingFromDisclosures();
      fundingParsed = fundingResult.created;
      if (fundingResult.errors.length > 0) {
        errors.push({ corpCode: 'funding_parser', error: fundingResult.errors.join('; ') });
      }
    } catch (err) {
      errors.push({ corpCode: 'funding_parser', error: String(err) });
    }

    // 5) 재무제표는 매월 1일에만 동기화 (빈도 줄이기)
    const today = new Date();
    if (today.getDate() === 1) {
      for (const company of companies) {
        const corpCode = company.corp_code;
        if (!corpCode) continue;

        try {
          const finResult = await syncFinancials(corpCode, [today.getFullYear()]);
          if (finResult.success) financialsSynced += finResult.synced;
          await delay(300);
        } catch (err) {
          errors.push({ corpCode, error: `financials: ${String(err)}` });
        }
      }
    }

    // 6) 로그 업데이트
    await updateLog(supabase, logId, {
      status: "success",
      summary: `기업 ${companiesSynced}건, 공시 ${disclosuresSynced}건, 재무 ${financialsSynced}건, 투자감지 ${fundingParsed}건 동기화 완료`,
      companiesSynced,
      financialsSynced,
      disclosuresSynced,
      errors,
    });

    return NextResponse.json({
      success: true,
      companiesSynced,
      financialsSynced,
      disclosuresSynced,
      fundingParsed,
      errors: errors.length,
      duration: `${Math.round((Date.now() - startTime.getTime()) / 1000)}s`,
    });
  } catch (err) {
    await updateLog(supabase, logId, {
      status: "error",
      summary: String(err),
      companiesSynced,
      financialsSynced,
      disclosuresSynced,
      errors,
    });

    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateLog(supabase: any, logId: string | undefined, data: {
  status: string;
  summary: string;
  companiesSynced: number;
  financialsSynced: number;
  disclosuresSynced: number;
  errors: { corpCode: string; error: string }[];
}) {
  if (!logId) return;
  await supabase
    .from("sync_logs")
    .update({
      finished_at: new Date().toISOString(),
      status: data.status,
      companies_synced: data.companiesSynced,
      financials_synced: data.financialsSynced,
      disclosures_synced: data.disclosuresSynced,
      errors: data.errors,
      summary: data.summary,
    })
    .eq("id", logId);
}