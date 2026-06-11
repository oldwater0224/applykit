// ============================================================
// src/scripts/seed-investments.ts
// 주요 한국 스타트업 투자자 + 투자 라운드 시드 데이터
//
// 실행 방법:
//   npx tsx src/scripts/seed-investments.ts
//
// 공개 뉴스 기반으로 큐레이션한 데이터입니다.
// 금액 단위: 억 원
// ============================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// .env.local 수동 로딩 (dotenv 없이)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local 없으면 기존 환경변수 사용
  }
}

loadEnv();

// DART 기업 검색 + 동기화를 위한 import
import { findCorpCode } from '../lib/dart/corpCodeSearch';
import { syncCompany } from '../lib/dart/sync';
import { delay } from '../lib/dart/client';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  return createClient(url, serviceKey);
}

// ============================================================
// 투자자 시드 데이터
// ============================================================

interface InvestorSeed {
  name: string;
  name_eng?: string;
  investor_type: string;
  description?: string;
  homepage_url?: string;
}

const INVESTORS: InvestorSeed[] = [
  // --- VC ---
  { name: '알토스벤처스', name_eng: 'Altos Ventures', investor_type: 'VC', homepage_url: 'https://altos.vc' },
  { name: '소프트뱅크벤처스', name_eng: 'SoftBank Ventures Asia', investor_type: 'VC', homepage_url: 'https://softbankventures.com' },
  { name: '한국투자파트너스', name_eng: 'Korea Investment Partners', investor_type: 'VC', homepage_url: 'https://www.kipvc.com' },
  { name: '스마일게이트인베스트먼트', name_eng: 'Smilegate Investment', investor_type: 'VC', homepage_url: 'https://www.smilegateinvestment.com' },
  { name: '캡스톤파트너스', name_eng: 'Capstone Partners', investor_type: 'VC', homepage_url: 'https://www.capstonepartners.co.kr' },
  { name: 'IMM인베스트먼트', name_eng: 'IMM Investment', investor_type: 'VC', homepage_url: 'https://www.imm.co.kr' },
  { name: '스틱인베스트먼트', name_eng: 'STIC Investments', investor_type: 'VC', homepage_url: 'https://www.sticinvestments.com' },
  { name: '미래에셋벤처투자', name_eng: 'Mirae Asset Venture Investment', investor_type: 'VC' },
  { name: 'KB인베스트먼트', name_eng: 'KB Investment', investor_type: 'VC', homepage_url: 'https://www.kbic.co.kr' },
  { name: '산업은행캐피탈', name_eng: 'KDB Capital', investor_type: 'VC' },
  { name: '에이티넘인베스트먼트', name_eng: 'Atinum Investment', investor_type: 'VC', homepage_url: 'https://www.atinum.com' },
  { name: 'DSC인베스트먼트', name_eng: 'DSC Investment', investor_type: 'VC', homepage_url: 'https://www.dscinv.com' },
  { name: '퀄컴벤처스', name_eng: 'Qualcomm Ventures', investor_type: 'VC' },

  // --- CVC ---
  { name: '카카오벤처스', name_eng: 'Kakao Ventures', investor_type: 'CVC', homepage_url: 'https://www.kakaoventures.com' },
  { name: '네이버D2SF', name_eng: 'Naver D2SF', investor_type: 'CVC', homepage_url: 'https://d2startup.com' },
  { name: '현대자동차그룹', name_eng: 'Hyundai Motor Group', investor_type: 'CVC' },
  { name: '삼성벤처투자', name_eng: 'Samsung Venture Investment', investor_type: 'CVC' },
  { name: 'LB인베스트먼트', name_eng: 'LB Investment', investor_type: 'CVC', homepage_url: 'https://www.lbinvestment.com' },

  // --- Accelerator ---
  { name: '프라이머', name_eng: 'Primer', investor_type: 'Accelerator', homepage_url: 'https://www.primer.kr' },
  { name: '스파크랩', name_eng: 'SparkLabs', investor_type: 'Accelerator', homepage_url: 'https://www.sparklabs.co.kr' },
  { name: '본엔젤스', name_eng: 'BonAngels', investor_type: 'Accelerator', homepage_url: 'https://bonangels.net' },
  { name: '매쉬업엔젤스', name_eng: 'Mashup Angels', investor_type: 'Accelerator', homepage_url: 'https://www.mashupangels.com' },
  { name: '퓨처플레이', name_eng: 'FuturePlay', investor_type: 'Accelerator', homepage_url: 'https://futureplay.co' },

  // --- PE ---
  { name: 'MBK파트너스', name_eng: 'MBK Partners', investor_type: 'PE', homepage_url: 'https://www.mbkpartners.com' },
  { name: '어피니티에쿼티파트너스', name_eng: 'Affinity Equity Partners', investor_type: 'PE' },

  // --- Government ---
  { name: '한국벤처투자', name_eng: 'Korea Venture Investment Corp', investor_type: 'Government', homepage_url: 'https://www.kvic.or.kr' },
  { name: '중소벤처기업진흥공단', name_eng: 'KOSMES', investor_type: 'Government', homepage_url: 'https://www.kosmes.or.kr' },
  { name: '한국성장금융투자운용', name_eng: 'Korea Growth Investment Corp', investor_type: 'Government' },

  // --- Global ---
  { name: '세쿼이아캐피탈', name_eng: 'Sequoia Capital', investor_type: 'VC', homepage_url: 'https://www.sequoiacap.com' },
  { name: '타이거글로벌', name_eng: 'Tiger Global Management', investor_type: 'VC' },
  { name: 'GIC', name_eng: 'GIC Private Limited', investor_type: 'PE' },
];

// ============================================================
// 투자 라운드 시드 데이터
// ============================================================

interface FundingRoundSeed {
  company_name: string;
  round_name: string;
  amount: number | null; // 억 원
  announced_date: string; // YYYY-MM-DD
  investors: { name: string; is_lead: boolean }[];
}

const FUNDING_ROUNDS: FundingRoundSeed[] = [
  // --- 비바리퍼블리카 (토스) ---
  { company_name: '비바리퍼블리카', round_name: 'Seed', amount: 10, announced_date: '2013-08-01', investors: [{ name: '알토스벤처스', is_lead: true }] },
  { company_name: '비바리퍼블리카', round_name: 'Series A', amount: 45, announced_date: '2015-09-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: '퀄컴벤처스', is_lead: false }] },
  { company_name: '비바리퍼블리카', round_name: 'Series B', amount: 120, announced_date: '2017-04-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }, { name: '알토스벤처스', is_lead: false }] },
  { company_name: '비바리퍼블리카', round_name: 'Series C', amount: 500, announced_date: '2018-12-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }, { name: 'DSC인베스트먼트', is_lead: false }] },
  { company_name: '비바리퍼블리카', round_name: 'Series D', amount: 810, announced_date: '2021-06-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },

  // --- 야놀자 ---
  { company_name: '야놀자', round_name: 'Series A', amount: 100, announced_date: '2015-06-01', investors: [{ name: '한국투자파트너스', is_lead: true }] },
  { company_name: '야놀자', round_name: 'Series B', amount: 350, announced_date: '2017-08-01', investors: [{ name: '한국투자파트너스', is_lead: true }, { name: 'IMM인베스트먼트', is_lead: false }] },
  { company_name: '야놀자', round_name: 'Series C', amount: 1000, announced_date: '2019-06-01', investors: [{ name: 'GIC', is_lead: true }, { name: '스마일게이트인베스트먼트', is_lead: false }] },
  { company_name: '야놀자', round_name: 'Series D', amount: 2000, announced_date: '2021-08-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }, { name: 'GIC', is_lead: false }] },

  // --- 당근 ---
  { company_name: '당근', round_name: 'Seed', amount: 5, announced_date: '2015-07-01', investors: [{ name: '본엔젤스', is_lead: true }] },
  { company_name: '당근', round_name: 'Series A', amount: 40, announced_date: '2018-03-01', investors: [{ name: '캡스톤파트너스', is_lead: true }] },
  { company_name: '당근', round_name: 'Series B', amount: 170, announced_date: '2019-08-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: '캡스톤파트너스', is_lead: false }] },
  { company_name: '당근', round_name: 'Series C', amount: 400, announced_date: '2021-08-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: 'DSC인베스트먼트', is_lead: false }] },
  { company_name: '당근', round_name: 'Series D', amount: 1800, announced_date: '2022-08-01', investors: [{ name: '타이거글로벌', is_lead: true }, { name: '알토스벤처스', is_lead: false }] },

  // --- 컬리 ---
  { company_name: '컬리', round_name: 'Series A', amount: 60, announced_date: '2016-09-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }] },
  { company_name: '컬리', round_name: 'Series B', amount: 200, announced_date: '2018-05-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }, { name: 'IMM인베스트먼트', is_lead: false }] },
  { company_name: '컬리', round_name: 'Series C', amount: 1100, announced_date: '2019-10-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }, { name: 'IMM인베스트먼트', is_lead: false }] },
  { company_name: '컬리', round_name: 'Series D', amount: 2100, announced_date: '2020-11-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }] },

  // --- 무신사 ---
  { company_name: '무신사', round_name: 'Series A', amount: 200, announced_date: '2019-11-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },
  { company_name: '무신사', round_name: 'Series B', amount: 1300, announced_date: '2021-11-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }, { name: 'IMM인베스트먼트', is_lead: false }] },

  // --- 쏘카 ---
  { company_name: '쏘카', round_name: 'Series A', amount: 50, announced_date: '2014-06-01', investors: [{ name: '스마일게이트인베스트먼트', is_lead: true }] },
  { company_name: '쏘카', round_name: 'Series B', amount: 300, announced_date: '2016-05-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: '스마일게이트인베스트먼트', is_lead: false }] },
  { company_name: '쏘카', round_name: 'Series C', amount: 600, announced_date: '2018-09-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }] },

  // --- 두나무 (업비트) ---
  { company_name: '두나무', round_name: 'Series A', amount: 1500, announced_date: '2018-10-01', investors: [{ name: '한국투자파트너스', is_lead: true }] },

  // --- 채널코퍼레이션 (채널톡) ---
  { company_name: '채널코퍼레이션', round_name: 'Seed', amount: 8, announced_date: '2015-03-01', investors: [{ name: '프라이머', is_lead: true }] },
  { company_name: '채널코퍼레이션', round_name: 'Series A', amount: 35, announced_date: '2018-01-01', investors: [{ name: '캡스톤파트너스', is_lead: true }] },
  { company_name: '채널코퍼레이션', round_name: 'Series B', amount: 280, announced_date: '2020-11-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }, { name: '캡스톤파트너스', is_lead: false }] },
  { company_name: '채널코퍼레이션', round_name: 'Series C', amount: 600, announced_date: '2022-04-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }] },

  // --- 리디 ---
  { company_name: '리디', round_name: 'Series A', amount: 120, announced_date: '2017-03-01', investors: [{ name: '미래에셋벤처투자', is_lead: true }] },
  { company_name: '리디', round_name: 'Series B', amount: 350, announced_date: '2019-12-01', investors: [{ name: '미래에셋벤처투자', is_lead: true }, { name: '에이티넘인베스트먼트', is_lead: false }] },

  // --- 직방 ---
  { company_name: '직방', round_name: 'Series A', amount: 90, announced_date: '2015-05-01', investors: [{ name: '알토스벤처스', is_lead: true }] },
  { company_name: '직방', round_name: 'Series B', amount: 380, announced_date: '2018-06-01', investors: [{ name: 'GIC', is_lead: true }, { name: '알토스벤처스', is_lead: false }] },
  { company_name: '직방', round_name: 'Series C', amount: 800, announced_date: '2021-04-01', investors: [{ name: 'GIC', is_lead: true }] },

  // --- 에이블리 ---
  { company_name: '에이블리', round_name: 'Series A', amount: 65, announced_date: '2019-06-01', investors: [{ name: 'KB인베스트먼트', is_lead: true }] },
  { company_name: '에이블리', round_name: 'Series B', amount: 340, announced_date: '2021-03-01', investors: [{ name: 'KB인베스트먼트', is_lead: true }, { name: '소프트뱅크벤처스', is_lead: false }] },
  { company_name: '에이블리', round_name: 'Series C', amount: 730, announced_date: '2022-03-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }] },

  // --- 뤼튼테크놀로지스 ---
  { company_name: '뤼튼테크놀로지스', round_name: 'Seed', amount: 15, announced_date: '2021-10-01', investors: [{ name: '매쉬업엔젤스', is_lead: true }] },
  { company_name: '뤼튼테크놀로지스', round_name: 'Pre-A', amount: 50, announced_date: '2022-09-01', investors: [{ name: '카카오벤처스', is_lead: true }] },
  { company_name: '뤼튼테크놀로지스', round_name: 'Series A', amount: 100, announced_date: '2023-05-01', investors: [{ name: '알토스벤처스', is_lead: true }, { name: '카카오벤처스', is_lead: false }] },
  { company_name: '뤼튼테크놀로지스', round_name: 'Series B', amount: 250, announced_date: '2024-03-01', investors: [{ name: '알토스벤처스', is_lead: true }] },

  // --- 센드버드 ---
  { company_name: '센드버드', round_name: 'Series A', amount: 150, announced_date: '2017-06-01', investors: [{ name: 'KB인베스트먼트', is_lead: true }] },
  { company_name: '센드버드', round_name: 'Series B', amount: 500, announced_date: '2019-04-01', investors: [{ name: '타이거글로벌', is_lead: true }] },
  { company_name: '센드버드', round_name: 'Series C', amount: 1200, announced_date: '2021-04-01', investors: [{ name: '타이거글로벌', is_lead: true }, { name: 'DSC인베스트먼트', is_lead: false }] },

  // --- 오늘의집 (버킷플레이스) ---
  { company_name: '버킷플레이스', round_name: 'Series A', amount: 80, announced_date: '2018-07-01', investors: [{ name: 'DSC인베스트먼트', is_lead: true }] },
  { company_name: '버킷플레이스', round_name: 'Series B', amount: 250, announced_date: '2019-12-01', investors: [{ name: '캡스톤파트너스', is_lead: true }, { name: 'DSC인베스트먼트', is_lead: false }] },
  { company_name: '버킷플레이스', round_name: 'Series C', amount: 1100, announced_date: '2021-07-01', investors: [{ name: '세쿼이아캐피탈', is_lead: true }] },

  // --- 클래스101 ---
  { company_name: '클래스101', round_name: 'Series A', amount: 55, announced_date: '2019-03-01', investors: [{ name: '스마일게이트인베스트먼트', is_lead: true }] },
  { company_name: '클래스101', round_name: 'Series B', amount: 280, announced_date: '2021-06-01', investors: [{ name: '소프트뱅크벤처스', is_lead: true }, { name: '스마일게이트인베스트먼트', is_lead: false }] },

  // --- 마이리얼트립 ---
  { company_name: '마이리얼트립', round_name: 'Series A', amount: 35, announced_date: '2016-07-01', investors: [{ name: '캡스톤파트너스', is_lead: true }] },
  { company_name: '마이리얼트립', round_name: 'Series B', amount: 180, announced_date: '2019-01-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }] },
  { company_name: '마이리얼트립', round_name: 'Series C', amount: 650, announced_date: '2021-09-01', investors: [{ name: 'IMM인베스트먼트', is_lead: true }, { name: 'LB인베스트먼트', is_lead: false }] },
];

// ============================================================
// 메인 시드 로직
// ============================================================

async function main() {
  console.log('🌱 투자 시드 데이터 삽입 시작\n');

  const supabase = getSupabaseAdmin();

  // 1) 투자자 upsert
  console.log('📌 Step 1: 투자자 데이터 삽입...');
  const investorIdMap = new Map<string, string>();

  for (const inv of INVESTORS) {
    const { data: existing } = await supabase
      .from('investors')
      .select('id')
      .eq('name', inv.name)
      .maybeSingle();

    if (existing) {
      investorIdMap.set(inv.name, existing.id);
      console.log(`   ⏩ ${inv.name} (이미 존재)`);
      continue;
    }

    // DB 스키마에 맞게 존재하는 컬럼만 전달
    const insertData: Record<string, unknown> = {
      name: inv.name,
      investor_type: inv.investor_type,
    };
    if (inv.description) insertData.description = inv.description;
    if (inv.homepage_url) insertData.homepage_url = inv.homepage_url;

    const { data, error } = await supabase
      .from('investors')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ ${inv.name}: ${error.message}`);
      continue;
    }

    investorIdMap.set(inv.name, data.id);
    console.log(`   ✅ ${inv.name}`);
  }

  console.log(`\n   총 ${investorIdMap.size}개 투자자 준비 완료\n`);

  // 2) 투자 라운드 + 투자자 연결
  console.log('📌 Step 2: 투자 라운드 데이터 삽입...');

  let roundsInserted = 0;
  let linksInserted = 0;
  let skipped = 0;

  for (const round of FUNDING_ROUNDS) {
    // company_id 조회
    let { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('corp_name', round.company_name)
      .maybeSingle();

    // DB에 없으면 DART에서 검색 후 자동 동기화
    if (!company) {
      console.log(`   🔍 기업 미발견: ${round.company_name} — DART 검색 중...`);
      try {
        const corpCode = await findCorpCode(round.company_name);
        if (corpCode) {
          await delay(300);
          const result = await syncCompany(corpCode.corp_code);
          if (result.success && result.companyId) {
            company = { id: result.companyId };
            console.log(`   📥 ${round.company_name} DART 동기화 완료`);
            await delay(300);
          }
        }
      } catch (err) {
        console.log(`   ⚠️  DART 검색 실패: ${round.company_name} — ${err}`);
      }
    }

    if (!company) {
      console.log(`   ⚠️  기업 미발견: ${round.company_name} — 건너뜀`);
      skipped++;
      continue;
    }

    // 중복 체크 (같은 회사 + 같은 라운드명 + 같은 날짜)
    const { data: existingRound } = await supabase
      .from('funding_rounds')
      .select('id')
      .eq('company_id', company.id)
      .eq('round_name', round.round_name)
      .eq('announced_date', round.announced_date)
      .maybeSingle();

    if (existingRound) {
      console.log(`   ⏩ ${round.company_name} ${round.round_name} (이미 존재)`);
      continue;
    }

    // funding_rounds insert
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

    if (roundError) {
      console.error(`   ❌ ${round.company_name} ${round.round_name}: ${roundError.message}`);
      continue;
    }

    roundsInserted++;
    console.log(`   ✅ ${round.company_name} ${round.round_name} (${round.amount ?? '비공개'}억)`);

    // funding_investors 연결
    for (const inv of round.investors) {
      const investorId = investorIdMap.get(inv.name);
      if (!investorId) {
        console.log(`      ⚠️  투자자 미발견: ${inv.name}`);
        continue;
      }

      const { error: linkError } = await supabase
        .from('funding_investors')
        .insert({
          investor_id: investorId,
          funding_round_id: newRound.id,
          is_lead: inv.is_lead,
        });

      if (linkError) {
        console.error(`      ❌ 연결 실패: ${inv.name} → ${linkError.message}`);
        continue;
      }

      linksInserted++;
    }
  }

  console.log('\n========================================');
  console.log('🏁 시드 데이터 삽입 완료!');
  console.log(`   투자자: ${investorIdMap.size}개`);
  console.log(`   투자 라운드: ${roundsInserted}건 삽입`);
  console.log(`   투자자-라운드 연결: ${linksInserted}건`);
  console.log(`   건너뜀 (기업 미발견): ${skipped}건`);
  console.log('========================================');
}

main().catch(console.error);
