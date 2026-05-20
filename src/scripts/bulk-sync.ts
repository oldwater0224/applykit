// ============================================================
// src/scripts/bulk-sync.ts
// 스타트업 기업 대량 동기화 스크립트
//
// 실행 방법 (개발 서버가 돌고 있는 상태에서):
//   npx tsx src/scripts/bulk-sync.ts
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// ========================================
// 동기화할 스타트업 목록
// DART 외부감사 대상 비상장기업 중심
// ========================================

const COMPANY_BATCHES = [
  // --- 배치 1: 유니콘/대형 스타트업 ---
  [
    '비바리퍼블리카',   // 토스
    '야놀자',
    '컬리',
    '무신사',
    '두나무',          // 업비트
    '쏘카',
    '에이블리',
    '직방',
    '카카오뱅크',
    '카카오페이',
  ],

  // --- 배치 2: IT/AI/SaaS ---
  [
    '크래프톤',
    '하이퍼커넥트',
    '채널코퍼레이션',   // 채널톡
    '리디',
    '왓챠',
    '클래스101',
    '밀리의서재',
    '마이리얼트립',
    '숨고',
    '브랜디',
  ],

  // --- 배치 3: 핀테크/커머스 ---
  [
    '토스증권',
    '카카오게임즈',
    '넷마블',
    '엔씨소프트',
    '데브시스터즈',
    '펄어비스',
    '위메이드',
    '카페24',
    '다날',
    'NHN',
  ],

  // --- 배치 4: 바이오/헬스케어 스타트업 ---
  [
    '에이치엘비',
    '알테오젠',
    'SK바이오팜',
    '셀트리온',
    '유한양행',
    '메디톡스',
    '씨젠',
    '바이오니아',
    '헬릭스미스',
    '제넥신',
  ],

  // --- 배치 5: 추가 스타트업/테크 ---
  [
    '당근',
    '뤼튼테크놀로지스',
    '센드버드',
    '스푼라디오',
    '플렉스',
    '지그재그',
    '오늘의집',       // 버킷플레이스
    '더존비즈온',
    '한글과컴퓨터',
    '알서포트',
  ],
];

async function syncBatch(names: string[], batchNum: number) {
  console.log(`\n📦 배치 ${batchNum} 시작: ${names.join(', ')}`);

  try {
    const response = await fetch(`${BASE_URL}/api/dart/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ${result.synced?.length || 0}개 동기화 완료`);

      if (result.notFound?.length > 0) {
        console.log(`⚠️  미발견: ${result.notFound.join(', ')}`);
      }

      for (const item of result.synced || []) {
        const companyOk = item.company?.success ? '✓' : '✗';
        const finCount = item.financials?.synced || 0;
        const disCount = item.disclosures?.synced || 0;
        console.log(
          `   ${companyOk} ${item.dartName} (기업:${companyOk} 재무:${finCount}년 공시:${disCount}건)`
        );
      }
    } else {
      console.log(`❌ 배치 ${batchNum} 실패:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`❌ 배치 ${batchNum} 오류:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 스타트업 기업 대량 동기화 시작');
  console.log(`📡 서버: ${BASE_URL}`);
  console.log(`📊 총 ${COMPANY_BATCHES.flat().length}개 기업\n`);

  let totalSynced = 0;
  let totalNotFound = 0;

  for (let i = 0; i < COMPANY_BATCHES.length; i++) {
    const result = await syncBatch(COMPANY_BATCHES[i], i + 1);

    if (result?.success) {
      totalSynced += result.synced?.length || 0;
      totalNotFound += result.notFound?.length || 0;
    }

    // 배치 사이 3초 대기 (DART API rate limit 대응)
    if (i < COMPANY_BATCHES.length - 1) {
      console.log('\n⏳ 다음 배치까지 3초 대기...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log('\n========================================');
  console.log(`🏁 동기화 완료!`);
  console.log(`   ✅ 성공: ${totalSynced}개`);
  console.log(`   ⚠️  미발견: ${totalNotFound}개`);
  console.log('========================================');
}

main().catch(console.error);