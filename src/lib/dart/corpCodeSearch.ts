// ============================================================
// src/lib/dart/corpCodeSearch.ts
// DART 고유번호 전체 목록 다운로드 + 기업명 검색
// adm-zip 라이브러리로 안정적인 ZIP 처리
// ============================================================

import AdmZip from 'adm-zip';
import { fetchCorpCodeZip } from './client';
import type { DartCorpCode } from './types';

// ZIP → XML → 파싱
async function parseCorpCodeZip(buffer: ArrayBuffer): Promise<DartCorpCode[]> {
  const zip = new AdmZip(Buffer.from(buffer));
  const entries = zip.getEntries();

  // ZIP 안의 첫 번째 XML 파일 찾기 (CORPCODE.xml)
  const xmlEntry = entries.find(
    (e) => e.entryName.endsWith('.xml') && !e.isDirectory
  );

  if (!xmlEntry) {
    throw new Error('ZIP 안에 XML 파일이 없습니다.');
  }

  const xmlString = xmlEntry.getData().toString('utf-8');

  // XML 파싱 (정규식 기반 — 외부 라이브러리 불필요)
  const results: DartCorpCode[] = [];
  const listRegex = /<list>([\s\S]*?)<\/list>/g;
  let match;

  while ((match = listRegex.exec(xmlString)) !== null) {
    const item = match[1];
    const getValue = (tag: string): string => {
      const tagMatch = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return tagMatch ? tagMatch[1].trim() : '';
    };

    results.push({
      corp_code: getValue('corp_code'),
      corp_name: getValue('corp_name'),
      stock_code: getValue('stock_code'),
      modify_date: getValue('modify_date'),
    });
  }

  return results;
}

// 메모리 캐시 (서버 프로세스 내 1회 다운로드 후 재사용)
let cachedCorpCodes: DartCorpCode[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1시간

export async function getCorpCodeList(): Promise<DartCorpCode[]> {
  const now = Date.now();

  if (cachedCorpCodes && now - cacheTime < CACHE_TTL) {
    return cachedCorpCodes;
  }

  console.log('[DART] 고유번호 전체 목록 다운로드 중...');
  const buffer = await fetchCorpCodeZip();
  cachedCorpCodes = await parseCorpCodeZip(buffer);
  cacheTime = now;
  console.log(`[DART] ${cachedCorpCodes.length}개 기업 고유번호 로드 완료`);

  return cachedCorpCodes;
}

// 기업명으로 검색 (부분 매칭)
export async function searchCorpCode(
  keyword: string
): Promise<DartCorpCode[]> {
  const allCodes = await getCorpCodeList();
  const lowerKeyword = keyword.toLowerCase();

  return allCodes
    .filter((c) => c.corp_name.toLowerCase().includes(lowerKeyword))
    .slice(0, 20); // 최대 20건
}

// 기업명 정확 매칭
export async function findCorpCode(
  corpName: string
): Promise<DartCorpCode | undefined> {
  const allCodes = await getCorpCodeList();
  return allCodes.find((c) => c.corp_name === corpName);
}

// 여러 기업명으로 corp_code 일괄 조회
export async function findCorpCodes(
  corpNames: string[]
): Promise<Map<string, DartCorpCode>> {
  const allCodes = await getCorpCodeList();
  const result = new Map<string, DartCorpCode>();

  for (const name of corpNames) {
    // 정확 매칭 우선
    let found = allCodes.find((c) => c.corp_name === name);

    // 없으면 (주), (주식회사) 등 접미사 포함 검색
    if (!found) {
      found = allCodes.find(
        (c) =>
          c.corp_name === `${name}(주)` ||
          c.corp_name === `(주)${name}` ||
          c.corp_name === `주식회사 ${name}` ||
          c.corp_name === `${name} 주식회사`
      );
    }

    // 그래도 없으면 부분 매칭 (첫 번째 결과)
    if (!found) {
      found = allCodes.find((c) =>
        c.corp_name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (found) {
      result.set(name, found);
    }
  }

  return result;
}