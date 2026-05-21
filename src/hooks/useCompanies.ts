"use client";

// ============================================================
// src/hooks/useCompanies.ts
// 기업 데이터 TanStack Query 커스텀 훅 — Day 4 고도화
// ============================================================

import { useQuery } from "@tanstack/react-query";
import {
  getCompanies,
  getCompanyDetail,
  getCompanySectors,
  getFundingStages,
} from "@/src/app/actions/companyAction";

export const companyKeys = {
  all: ["companies"] as const,
  list: (filters: Record<string, unknown>) =>
    [...companyKeys.all, "list", filters] as const,
  detail: (id: string) => [...companyKeys.all, "detail", id] as const,
  sectors: () => [...companyKeys.all, "sectors"] as const,
  fundingStages: () => [...companyKeys.all, "fundingStages"] as const,
};

// --- 기업 목록 ---
export function useCompanies(options?: {
  sector?: string;
  fundingStage?: string;
  corpCls?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "corp_name" | "established_date" | "created_at";
  sortOrder?: "asc" | "desc";
}) {
  const {
    sector,
    fundingStage,
    corpCls,
    search,
    page = 1,
    pageSize = 12,
    sortBy,
    sortOrder,
  } = options || {};

  return useQuery({
    queryKey: companyKeys.list({
      sector,
      fundingStage,
      corpCls,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    queryFn: async () => {
      const result = await getCompanies({
        sector,
        fundingStage,
        corpCls,
        search,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });
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
    queryKey: companyKeys.detail(companyId ?? ""),
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

// --- 업종 목록 ---
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
    staleTime: 1000 * 60 * 5,
  });
}

// --- 투자 단계 목록 ---
export function useFundingStages() {
  return useQuery({
    queryKey: companyKeys.fundingStages(),
    queryFn: async () => {
      const result = await getFundingStages();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}