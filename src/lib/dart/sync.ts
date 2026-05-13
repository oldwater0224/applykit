// ============================================================
// DART → Supabase 데이터 동기화
// service_role 키를 사용하여 서버에서만 실행
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { fetchCompany, fetchFinancials, fetchDisclosures, delay } from './client';
import type {
  DartCompanyResponse,
  DartFinancialResponse,
  DartFinancialItem,
  CompanyInsert,
  FinancialInsert,
  DisclosureInsert,
} from './types';

// Supabase Admin 클라이언트 (service_role 키 → RLS 우회)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient(url, serviceKey);
}

// ============================================================
// DART 날짜 → ISO 날짜 변환
// ============================================================
function dartDateToISO(dartDate: string): string | undefined {
  // "19690113" → "1969-01-13"
  if (!dartDate || dartDate.length !== 8) return undefined;
  return `${dartDate.slice(0, 4)}-${dartDate.slice(4, 6)}-${dartDate.slice(6, 8)}`;
}

// DART 금액 문자열 → 숫자 변환
function parseAmount(amount: string): number | undefined {
  if (!amount || amount === '') return undefined;
  const cleaned = amount.replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}

// 업종코드 → 분야 매핑 (TheVC 스타일)
// 실제로는 더 세분화해야 하지만, MVP에서는 대분류만
function mapSector(industryCode: string): string {
  const code = industryCode?.slice(0, 2); // 앞 2자리 = 대분류
  const sectorMap: Record<string, string> = {
    '58': '미디어/콘텐츠',
    '59': '미디어/콘텐츠',
    '60': '미디어/콘텐츠',
    '61': '통신',
    '62': 'IT/소프트웨어',
    '63': 'IT/소프트웨어',
    '10': '음식/외식',
    '11': '음식/외식',
    '21': '바이오/의료',
    '26': '반도체/디스플레이',
    '27': '전기/전자',
    '28': '제조',
    '29': '제조',
    '30': '제조',
    '35': '환경/에너지',
    '41': '건설',
    '45': '유통/물류',
    '46': '유통/물류',
    '47': '유통/물류',
    '64': '금융',
    '65': '금융',
    '66': '금융',
    '70': '부동산',
    '71': '전문서비스',
    '72': '전문서비스',
    '73': '전문서비스',
    '85': '교육',
    '86': '바이오/의료',
  };
  return sectorMap[code] || '기타';
}

// ============================================================
// 1. 기업 동기화 (DART → companies 테이블)
// ============================================================
export async function syncCompany(corpCode: string): Promise<{
  success: boolean;
  companyId?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseAdmin();
    const dartData = await fetchCompany(corpCode);

    if (dartData.status !== '000') {
      return { success: false, error: `DART 응답: ${dartData.message}` };
    }

    const companyData: CompanyInsert = {
      corp_code: dartData.corp_code,
      corp_name: dartData.corp_name,
      corp_name_eng: dartData.corp_name_eng || undefined,
      ceo_name: dartData.ceo_nm || undefined,
      corp_cls: dartData.corp_cls || undefined,
      bizr_no: dartData.bizr_no || undefined,
      jurir_no: dartData.jurir_no || undefined,
      address: dartData.adres || undefined,
      homepage_url: dartData.hm_url || undefined,
      ir_url: dartData.ir_url || undefined,
      phone: dartData.phn_no || undefined,
      industry_code: dartData.induty_code || undefined,
      sector: mapSector(dartData.induty_code),
      established_date: dartDateToISO(dartData.est_dt),
      data_source: 'dart',
    };

    // upsert: corp_code가 같으면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'corp_code' })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, companyId: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ============================================================
// 2. 재무제표 동기화 (DART → financials 테이블)
// ============================================================
export async function syncFinancials(
  corpCode: string,
  years: number[] = [2024, 2023, 2022]
): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // 먼저 company_id 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('corp_code', corpCode)
      .single();

    if (companyError || !company) {
      return {
        success: false,
        synced: 0,
        error: '기업을 먼저 동기화해주세요.',
      };
    }

    let syncedCount = 0;

    for (const year of years) {
      await delay(200); // DART API rate limit 대응

      try {
        const dartData = await fetchFinancials(corpCode, String(year));

        if (dartData.status === '013') continue; // 데이터 없음 → 다음 연도
        if (dartData.status !== '000') continue;

        // 연결재무제표(CFS) 우선, 없으면 개별(OFS)
        const items = dartData.list || [];
        const cfsItems = items.filter((i) => i.fs_div === 'CFS');
        const targetItems = cfsItems.length > 0 ? cfsItems : items;

        // 주요 계정 추출
        const findAmount = (accountName: string): number | undefined => {
          const item = targetItems.find((i) => i.account_nm === accountName);
          return item ? parseAmount(item.thstrm_amount) : undefined;
        };

        const financialData: FinancialInsert = {
          company_id: company.id,
          fiscal_year: year,
          report_code: '11011', // 사업보고서
          revenue: findAmount('매출액') ?? findAmount('수익(매출액)'),
          operating_income: findAmount('영업이익') ?? findAmount('영업이익(손실)'),
          net_income: findAmount('당기순이익') ?? findAmount('당기순이익(손실)'),
          total_assets: findAmount('자산총계'),
          total_equity: findAmount('자본총계'),
          total_debt: findAmount('부채총계'),
          data_source: 'dart',
        };

        // upsert: company_id + fiscal_year + report_code가 같으면 업데이트
        const { error } = await supabase
          .from('financials')
          .upsert(financialData, {
            onConflict: 'company_id,fiscal_year,report_code',
          });

        if (!error) syncedCount++;
      } catch {
        // 개별 연도 실패는 스킵하고 계속 진행
        continue;
      }
    }

    return { success: true, synced: syncedCount };
  } catch (err) {
    return { success: false, synced: 0, error: String(err) };
  }
}

// ============================================================
// 3. 공시 동기화 (DART → disclosures 테이블)
// ============================================================
export async function syncDisclosures(
  corpCode: string,
  startDate?: string // YYYYMMDD, 기본값: 1년 전
): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // company_id 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('corp_code', corpCode)
      .single();

    if (companyError || !company) {
      return {
        success: false,
        synced: 0,
        error: '기업을 먼저 동기화해주세요.',
      };
    }

    // 기본: 최근 1년 공시
    if (!startDate) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');
    }

    const dartData = await fetchDisclosures(corpCode, {
      startDate,
      pageCount: 100,
    });

    if (dartData.status === '013' || !dartData.list) {
      return { success: true, synced: 0 }; // 공시 없음
    }

    const disclosures: DisclosureInsert[] = dartData.list.map((item) => ({
      company_id: company.id,
      rcept_no: item.rcept_no,
      disclosure_date: dartDateToISO(item.rcept_dt) || item.rcept_dt,
      title: item.report_nm,
      disclosure_type: item.rm || undefined,
      dart_url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
      data_source: 'dart',
    }));

    // 배치 upsert (rcept_no UNIQUE)
    const { error } = await supabase
      .from('disclosures')
      .upsert(disclosures, { onConflict: 'rcept_no' });

    if (error) {
      return { success: false, synced: 0, error: error.message };
    }

    return { success: true, synced: disclosures.length };
  } catch (err) {
    return { success: false, synced: 0, error: String(err) };
  }
}

// ============================================================
// 4. 전체 동기화 (기업 + 재무 + 공시 한 번에)
// ============================================================
export async function syncAll(corpCode: string): Promise<{
  company: { success: boolean; companyId?: string; error?: string };
  financials: { success: boolean; synced: number; error?: string };
  disclosures: { success: boolean; synced: number; error?: string };
}> {
  // 1) 기업 기본정보
  const companyResult = await syncCompany(corpCode);
  await delay(200);

  // 2) 재무제표 (최근 3년)
  const financialResult = await syncFinancials(corpCode);
  await delay(200);

  // 3) 공시 내역 (최근 1년)
  const disclosureResult = await syncDisclosures(corpCode);

  return {
    company: companyResult,
    financials: financialResult,
    disclosures: disclosureResult,
  };
}