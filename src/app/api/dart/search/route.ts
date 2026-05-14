// ============================================================
// src/app/api/dart/search/route.ts
// GET  /api/dart/search?q=카카오   → 기업명 검색 (corp_code 조회)
// POST /api/dart/search            → 기업명으로 동기화
//
// 사용 예시:
//   GET  /api/dart/search?q=당근
//   POST /api/dart/search { "names": ["당근", "토스", "야놀자"] }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchCorpCode, findCorpCodes } from '@/src/lib/dart/corpCodeSearch';
import { syncAll } from '@/src/lib/dart/sync';
import { delay } from '@/src/lib/dart/client';

// 간단한 관리자 인증
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.DART_SYNC_SECRET;
  if (!adminKey) return true;
  return authHeader === `Bearer ${adminKey}`;
}

// --- GET: 기업명 검색 (corp_code 조회만, 동기화 안 함) ---
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || q.trim().length < 1) {
    return NextResponse.json(
      { error: '검색어(q)를 입력해주세요.' },
      { status: 400 }
    );
  }

  try {
    const results = await searchCorpCode(q.trim());

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      results: results.map((r) => ({
        corp_code: r.corp_code,
        corp_name: r.corp_name,
        stock_code: r.stock_code || null,
        listed: r.stock_code ? true : false,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: '검색 중 오류 발생', detail: String(error) },
      { status: 500 }
    );
  }
}

// --- POST: 기업명으로 검색 + 동기화 ---
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { names } = body;

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'names 배열이 필요합니다. 예: {"names": ["당근", "토스"]}' },
        { status: 400 }
      );
    }

    // 1) 기업명 → corp_code 매핑
    const corpCodeMap = await findCorpCodes(names);

    const notFound: string[] = [];
    const found: { name: string; corp_code: string; corp_name: string }[] = [];

    for (const name of names) {
      const code = corpCodeMap.get(name);
      if (code) {
        found.push({
          name,
          corp_code: code.corp_code,
          corp_name: code.corp_name,
        });
      } else {
        notFound.push(name);
      }
    }

    // 2) 찾은 기업들 동기화
    const syncResults = [];

    for (const item of found) {
      const result = await syncAll(item.corp_code);
      syncResults.push({
        searchName: item.name,
        dartName: item.corp_name,
        corpCode: item.corp_code,
        ...result,
      });
      await delay(500); // rate limit 대응
    }

    return NextResponse.json({
      success: true,
      message: `${syncResults.length}개 기업 동기화 완료, ${notFound.length}개 미발견`,
      synced: syncResults,
      notFound,
    });
  } catch (error) {
    console.error('[DART Search Sync Error]', error);
    return NextResponse.json(
      { error: '동기화 중 오류 발생', detail: String(error) },
      { status: 500 }
    );
  }
}