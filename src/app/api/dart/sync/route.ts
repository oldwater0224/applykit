// ============================================================
// app/api/dart/sync/route.ts
// POST /api/dart/sync
//
// DART 데이터를 가져와서 Supabase에 저장하는 엔드포인트
//
// 요청 예시:
//   POST /api/dart/sync
//   { "corpCode": "00126380" }           → 삼성전자 전체 동기화
//   { "corpCode": "00126380", "type": "company" }  → 기업정보만
//   { "corpCodes": ["00126380", "00164779"] }  → 여러 기업 일괄
//
// ⚠️ 운영자만 호출해야 합니다 (간단한 Bearer 토큰 인증)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { syncAll, syncCompany, syncFinancials, syncDisclosures } from '@/src/lib/dart/sync';
import { delay } from '@/src/lib/dart/client';

// 간단한 관리자 인증 (환경변수에 설정한 시크릿 키)
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.DART_SYNC_SECRET;

  // 시크릿 키가 설정되지 않았으면 개발 환경으로 간주하고 허용
  if (!adminKey) return true;

  return authHeader === `Bearer ${adminKey}`;
}

export async function POST(request: NextRequest) {
  // 인증 체크
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { corpCode, corpCodes, type } = body;

    // --- 여러 기업 일괄 동기화 ---
    if (corpCodes && Array.isArray(corpCodes)) {
      const results = [];

      for (const code of corpCodes) {
        const result = await syncAll(code);
        results.push({ corpCode: code, ...result });
        await delay(500); // 기업 사이 딜레이
      }

      return NextResponse.json({
        success: true,
        message: `${results.length}개 기업 동기화 완료`,
        results,
      });
    }

    // --- 단일 기업 ---
    if (!corpCode) {
      return NextResponse.json(
        { error: 'corpCode 또는 corpCodes가 필요합니다.' },
        { status: 400 }
      );
    }

    // type에 따라 부분 동기화 가능
    switch (type) {
      case 'company': {
        const result = await syncCompany(corpCode);
        return NextResponse.json(result);
      }
      case 'financials': {
        const result = await syncFinancials(corpCode);
        return NextResponse.json(result);
      }
      case 'disclosures': {
        const result = await syncDisclosures(corpCode);
        return NextResponse.json(result);
      }
      default: {
        // type 없으면 전체 동기화
        const result = await syncAll(corpCode);
        return NextResponse.json({
          success: true,
          message: '전체 동기화 완료',
          ...result,
        });
      }
    }
  } catch (error) {
    console.error('[DART Sync Error]', error);
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}