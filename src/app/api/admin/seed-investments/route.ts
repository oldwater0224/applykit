// ============================================================
// POST /api/admin/seed-investments
// 투자자 + 투자 라운드 시드 데이터 실행 엔드포인트
//
// CLI 없이 브라우저/Postman에서 실행 가능
// Bearer 토큰 인증 (DART_SYNC_SECRET)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.DART_SYNC_SECRET;
  if (!adminKey) return true;
  return authHeader === `Bearer ${adminKey}`;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

interface InvestorSeed {
  name: string;
  name_eng?: string;
  investor_type: string;
  homepage_url?: string;
  founded_year?: number;
}

interface FundingRoundSeed {
  company_name: string;
  round_name: string;
  amount: number | null;
  announced_date: string;
  investors: { name: string; is_lead: boolean }[];
}

const INVESTORS: InvestorSeed[] = [
  { name: '알토스벤처스', name_eng: 'Altos Ventures', investor_type: 'VC', homepage_url: 'https://altos.vc', founded_year: 1996 },
  { name: '소프트뱅크벤처스', name_eng: 'SoftBank Ventures Asia', investor_type: 'VC', founded_year: 2000 },
  { name: '한국투자파트너스', name_eng: 'Korea Investment Partners', investor_type: 'VC', founded_year: 1986 },
  { name: '세쿼이아캐피탈', name_eng: 'Sequoia Capital', investor_type: 'VC', founded_year: 1972 },
  { name: 'IMM인베스트먼트', name_eng: 'IMM Investment', investor_type: 'VC', founded_year: 1999 },
  { name: '캡스톤파트너스', name_eng: 'Capstone Partners', investor_type: 'VC', founded_year: 2008 },
  { name: 'DSC인베스트먼트', name_eng: 'DSC Investment', investor_type: 'VC', founded_year: 2009 },
  { name: 'KB인베스트먼트', name_eng: 'KB Investment', investor_type: 'VC', founded_year: 2008 },
  { name: '타이거글로벌', name_eng: 'Tiger Global Management', investor_type: 'VC', founded_year: 2001 },
  { name: 'GIC', name_eng: 'GIC Private Limited', investor_type: 'PE', founded_year: 1981 },
  { name: '카카오벤처스', name_eng: 'Kakao Ventures', investor_type: 'CVC', founded_year: 2012 },
  { name: '스마일게이트인베스트먼트', name_eng: 'Smilegate Investment', investor_type: 'VC', founded_year: 2012 },
  { name: '미래에셋벤처투자', name_eng: 'Mirae Asset Venture Investment', investor_type: 'VC', founded_year: 2000 },
  { name: '에이티넘인베스트먼트', name_eng: 'Atinum Investment', investor_type: 'VC', founded_year: 1999 },
  { name: 'LB인베스트먼트', name_eng: 'LB Investment', investor_type: 'CVC', founded_year: 1997 },
  { name: '본엔젤스', name_eng: 'BonAngels', investor_type: 'Accelerator', founded_year: 2010 },
  { name: '프라이머', name_eng: 'Primer', investor_type: 'Accelerator', founded_year: 2010 },
  { name: '매쉬업엔젤스', name_eng: 'Mashup Angels', investor_type: 'Accelerator', founded_year: 2012 },
  { name: '퀄컴벤처스', name_eng: 'Qualcomm Ventures', investor_type: 'VC', founded_year: 2000 },
];

const FUNDING_ROUNDS: FundingRoundSeed[] = [
  { company_name: '비바리퍼블리카', round_name: 'Seed', amount: 10, announced_date: '2013-08-01', investors: [{ name: '알토스벤처스', is_lead: true }] },
  { company_name: '비바리퍼블리카', round_name: 'Series A', amount: 45, announced_date: '2015-09-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: '퀄컴벤처스', is_lead: false }] },
  { company_name: '비바리퍼블리카', round_name: 'Series B', amount: 120, announced_date: '2017-04-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '비바리퍼블리카', round_name: 'Series C', amount: 500, announced_date: '2018-12-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '비바리퍼블리카', round_name: 'Series D', amount: 810, announced_date: '2021-06-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '야놀자', round_name: 'Series A', amount: 100, announced_date: '2015-06-01', investors: [{ name: '한국투자파트너스', is_lead: true }] },
  { company_name: '야놀자', round_name: 'Series B', amount: 350, announced_date: '2017-08-01', investors: [{ name: '한국투자파트너스', is_lead: true }] },
  { company_name: '야놀자', round_name: 'Series C', amount: 1000, announced_date: '2019-06-01', investors: [{ name: 'GIC', is_lead: true }] },
  { company_name: '야놀자', round_name: 'Series D', amount: 2000, announced_date: '2021-08-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }] },
  { company_name: '당근', round_name: 'Seed', amount: 5, announced_date: '2015-07-01', investors: [{ name: '본엔젤스', is_lead: true }] },
  { company_name: '당근', round_name: 'Series A', amount: 40, announced_date: '2018-03-01', investors: [{ name: '캡스톤파트너스', is_lead: true }] },
  { company_name: '당근', round_name: 'Series C', amount: 400, announced_date: '2021-08-01', investors: [{ name: '알토스벤처스', is_lead: true }] },
  { company_name: '당근', round_name: 'Series D', amount: 1800, announced_date: '2022-08-01', investors: [{ name: '타이거글로벌', is_lead: true }] },
  { company_name: '컬리', round_name: 'Series A', amount: 60, announced_date: '2016-09-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }] },
  { company_name: '컬리', round_name: 'Series B', amount: 200, announced_date: '2018-05-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '무신사', round_name: 'Series A', amount: 200, announced_date: '2019-11-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '무신사', round_name: 'Series B', amount: 1300, announced_date: '2021-11-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '쏘카', round_name: 'Series A', amount: 50, announced_date: '2014-06-01', investors: [{ name: '스마일게이트인베스트먼트', is_lead: true }] },
  { company_name: '쏘카', round_name: 'Series B', amount: 300, announced_date: '2016-05-01', investors: [{ name: '알토스벤처스', is_lead: true }] },
  { company_name: '두나무', round_name: 'Series A', amount: 1500, announced_date: '2018-10-01', investors: [{ name: '한국투자파트너스', is_lead: true }] },
];

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const investorIdMap = new Map<string, string>();

  // 1) 투자자 upsert
  for (const inv of INVESTORS) {
    const { data: existing } = await supabase
      .from('investors')
      .select('id')
      .eq('name', inv.name)
      .maybeSingle();

    if (existing) {
      investorIdMap.set(inv.name, existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from('investors')
      .insert({
        name: inv.name,
        name_eng: inv.name_eng,
        investor_type: inv.investor_type,
        homepage_url: inv.homepage_url,
        founded_year: inv.founded_year,
      })
      .select('id')
      .single();

    if (!error && data) {
      investorIdMap.set(inv.name, data.id);
    }
  }

  // 2) 투자 라운드 insert
  let roundsInserted = 0;
  let linksInserted = 0;
  let skipped = 0;

  for (const round of FUNDING_ROUNDS) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('corp_name', round.company_name)
      .maybeSingle();

    if (!company) {
      skipped++;
      continue;
    }

    const { data: existingRound } = await supabase
      .from('funding_rounds')
      .select('id')
      .eq('company_id', company.id)
      .eq('round_name', round.round_name)
      .eq('announced_date', round.announced_date)
      .maybeSingle();

    if (existingRound) continue;

    const { data: newRound, error: roundError } = await supabase
      .from('funding_rounds')
      .insert({
        company_id: company.id,
        round_name: round.round_name,
        amount: round.amount,
        currency: 'KRW',
        announced_date: round.announced_date,
        data_source: 'seed',
      })
      .select('id')
      .single();

    if (roundError || !newRound) continue;
    roundsInserted++;

    for (const inv of round.investors) {
      const investorId = investorIdMap.get(inv.name);
      if (!investorId) continue;

      const { error: linkError } = await supabase
        .from('funding_investors')
        .insert({
          investor_id: investorId,
          funding_round_id: newRound.id,
          is_lead: inv.is_lead,
        });

      if (!linkError) linksInserted++;
    }
  }

  return NextResponse.json({
    success: true,
    investors: investorIdMap.size,
    roundsInserted,
    linksInserted,
    skipped,
  });
}
