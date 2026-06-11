// ============================================================
// src/lib/dart/disclosureFundingParser.ts
// DART 공시 제목에서 투자 관련 이벤트를 감지하여
// funding_rounds 테이블에 자동 생성
// ============================================================

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }
  return createClient(url, serviceKey);
}

interface FundingSignal {
  roundName: string;
  priority: number; // 높을수록 투자 관련성 높음
}

const FUNDING_PATTERNS: { pattern: RegExp; signal: FundingSignal }[] = [
  { pattern: /제3자배정.*유상증자/, signal: { roundName: '유상증자', priority: 3 } },
  { pattern: /유상증자.*제3자배정/, signal: { roundName: '유상증자', priority: 3 } },
  { pattern: /전환사채.*발행/, signal: { roundName: 'CB', priority: 2 } },
  { pattern: /신주인수권부사채/, signal: { roundName: 'BW', priority: 2 } },
  { pattern: /유상증자/, signal: { roundName: '유상증자', priority: 1 } },
];

// 정정보고서, 기재정정 등 제외 패턴
const EXCLUDE_PATTERNS = [/정정/, /기재정정/, /취소/, /철회/];

function detectFundingSignal(title: string): FundingSignal | null {
  if (EXCLUDE_PATTERNS.some((p) => p.test(title))) {
    return null;
  }
  for (const { pattern, signal } of FUNDING_PATTERNS) {
    if (pattern.test(title)) {
      return signal;
    }
  }
  return null;
}

export async function parseFundingFromDisclosures(companyId?: string): Promise<{
  created: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = getSupabaseAdmin();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 투자 관련 키워드가 포함된 공시 조회
  let query = supabase
    .from('disclosures')
    .select('id, company_id, title, disclosure_date, dart_url')
    .or('title.ilike.%유상증자%,title.ilike.%전환사채%,title.ilike.%신주인수권부사채%')
    .order('disclosure_date', { ascending: false });

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data: disclosures, error: fetchError } = await query;

  if (fetchError) {
    return { created: 0, skipped: 0, errors: [fetchError.message] };
  }

  if (!disclosures || disclosures.length === 0) {
    return { created: 0, skipped: 0, errors: [] };
  }

  for (const disc of disclosures) {
    const signal = detectFundingSignal(disc.title);
    if (!signal) {
      skipped++;
      continue;
    }

    // 중복 체크: 같은 company_id + 30일 이내 + 같은 round_name
    const discDate = new Date(disc.disclosure_date);
    const windowStart = new Date(discDate);
    windowStart.setDate(windowStart.getDate() - 30);
    const windowEnd = new Date(discDate);
    windowEnd.setDate(windowEnd.getDate() + 30);

    const { data: existing } = await supabase
      .from('funding_rounds')
      .select('id')
      .eq('company_id', disc.company_id)
      .eq('round_name', signal.roundName)
      .gte('announced_date', windowStart.toISOString().slice(0, 10))
      .lte('announced_date', windowEnd.toISOString().slice(0, 10))
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase
      .from('funding_rounds')
      .insert({
        company_id: disc.company_id,
        round_name: signal.roundName,
        amount: null,
        currency: 'KRW',
        announced_date: disc.disclosure_date,
        news_url: disc.dart_url,
        data_source: 'dart_disclosure',
      });

    if (insertError) {
      errors.push(`${disc.company_id}: ${insertError.message}`);
      continue;
    }

    created++;
  }

  return { created, skipped, errors };
}
