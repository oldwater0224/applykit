// ============================================================
// src/hooks/useCompanies.ts
// 기업 데이터 TanStack Query 커스텀 훅
// 기존 useApplications.ts 패턴과 동일
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCompanies,
  getCompanyDetail,
  getCompanySectors,
} from '@/src/app/actions/companyAction';

// 쿼리 키
export const companyKeys = {
  all: ['companies'] as const,
  list: (filters: Record<string, unknown>) =>
    [...companyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
  sectors: () => [...companyKeys.all, 'sectors'] as const,
};

// --- 기업 목록 ---
export function useCompanies(options?: {
  sector?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'corp_name' | 'established_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}) {
  const { sector, search, page = 1, pageSize = 12, sortBy, sortOrder } = options || {};

  return useQuery({
    queryKey: companyKeys.list({ sector, search, page, pageSize, sortBy, sortOrder }),
    queryFn: async () => {
      const result = await getCompanies({ sector, search, page, pageSize, sortBy, sortOrder });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
  });
}

// --- 기업 상세 ---
export function useCompanyDetail(companyId: string | undefined) {
  return useQuery({
    queryKey: companyKeys.detail(companyId ?? ''),
    queryFn: async () => {
      const result = await getCompanyDetail(companyId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!companyId,
  });
}

// --- 업종 목록 (필터 탭용) ---
export function useCompanySectors() {
  return useQuery({
    queryKey: companyKeys.sectors(),
    queryFn: async () => {
      const result = await getCompanySectors();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 (자주 안 바뀜)
  });
}