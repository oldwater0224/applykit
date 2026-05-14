// ============================================================
// src/app/actions/companyAction.ts
// 기업 데이터 조회 Server Actions
// 기존 applicationAction.ts 패턴과 동일
// ============================================================

'use server';

import { createClient } from '@/src/lib/supabase/server';

// --- 기업 목록 조회 (필터 + 검색 + 페이지네이션) ---
export async function getCompanies(options?: {
  sector?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'corp_name' | 'established_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const supabase = await createClient();
    const {
      sector,
      search,
      page = 1,
      pageSize = 12,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options || {};

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' });

    // 업종 필터
    if (sector && sector !== '전체') {
      query = query.eq('sector', sector);
    }

    // 기업명 검색 (trigram 부분 매칭)
    if (search && search.trim()) {
      query = query.ilike('corp_name', `%${search.trim()}%`);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false as const, error: error.message };
    }

    return {
      success: true as const,
      data: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 기업 상세 조회 (기본정보 + 재무제표 + 최근 공시) ---
export async function getCompanyDetail(companyId: string) {
  try {
    const supabase = await createClient();

    // 기업 기본정보
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) {
      return { success: false as const, error: companyError.message };
    }

    // 재무제표 (최근 연도순)
    const { data: financials } = await supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false });

    // 최근 공시 10건
    const { data: disclosures } = await supabase
      .from('disclosures')
      .select('*')
      .eq('company_id', companyId)
      .order('disclosure_date', { ascending: false })
      .limit(10);

    return {
      success: true as const,
      data: {
        ...company,
        financials: financials || [],
        disclosures: disclosures || [],
      },
    };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}

// --- 업종 목록 조회 (필터 탭용) ---
export async function getCompanySectors() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('companies')
      .select('sector')
      .not('sector', 'is', null);

    if (error) {
      return { success: false as const, error: error.message };
    }

    // 중복 제거 + 카운트
    const sectorCounts = (data || []).reduce(
      (acc: Record<string, number>, item) => {
        const s = item.sector || '기타';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {}
    );

    const sectors = Object.entries(sectorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true as const, data: sectors };
  } catch (err) {
    return { success: false as const, error: String(err) };
  }
}