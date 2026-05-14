// ============================================================
// src/scripts/bulk-sync.ts
// 주요 기업 대량 동기화 스크립트
//
// 실행 방법 (개발 서버가 돌고 있는 상태에서):
//   npx tsx src/scripts/bulk-sync.ts
//
// 또는 curl로 직접:
//   curl -X POST http://localhost:3001/api/dart/search \
//     -H "Content-Type: application/json" \
//     -d '{"names": ["LG전자", "현대자동차", ...]}'
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// ========================================
// 동기화할 기업 목록 (기업명 기준)
// DART 고유번호 목록에서 자동 매칭
// ========================================

const COMPANY_BATCHES = [
  // --- 배치 1: 대형 IT/플랫폼 ---
  [
    'LG전자',
    '현대자동차',
    '기아',
    '셀트리온',
    '크래프톤',
    '넷마블',
    '엔씨소프트',
    '카카오게임즈',
    '카카오뱅크',
    '카카오페이',
  ],

  // --- 배치 2: IT/소프트웨어 ---
  [
    '더존비즈온',
    '한글과컴퓨터',
    '알서포트',
    '카페24',
    '다날',
    'NHN',
    '위메이드',
    '컴투스',
    '데브시스터즈',
    '펄어비스',
  ],

  // --- 배치 3: 바이오/헬스케어 ---
  [
    '삼성바이오로직스',
    'SK바이오팜',
    '에이치엘비',
    '셀트리온헬스케어',
    '유한양행',
    '녹십자',
    '종근당',
    '한미약품',
    '대웅제약',
    '알테오젠',
  ],

  // --- 배치 4: 반도체/전자 ---
  [
    'LG디스플레이',
    'LG이노텍',
    'DB하이텍',
    '리노공업',
    '에스에프에이',
    '원익IPS',
    '주성엔지니어링',
    '테스',
    '한미반도체',
    '이오테크닉스',
  ],

  // --- 배치 5: 2차전지/에너지 ---
  [
    'LG에너지솔루션',
    '삼성SDI',
    'SK이노베이션',
    '에코프로비엠',
    '에코프로',
    '포스코퓨처엠',
    '엘앤에프',
    '씨에스윈드',
    '두산에너빌리티',
    '한화솔루션',
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

      // 개별 결과 출력
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
  console.log('🚀 대량 동기화 시작');
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

    // 배치 사이 3초 대기 (DART API 부담 줄이기)
    if (i < COMPANY_BATCHES.length - 1) {
      console.log('\n⏳ 다음 배치까지 3초 대기...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log('\n========================================');
  console.log(`🏁 동기화 완료!`);
  console.log(`   ✅ 성공: ${totalSynced}개`);
  console.log(`   ⚠️  미발견: ${totalNotFound}개`);
  console.log(`   📊  총 ${totalSynced}개 기업`);
  console.log('========================================');
}

main().catch(console.error);