"use client";

// ============================================================
// src/hooks/useInvestors.ts
// 투자자 데이터 TanStack Query 커스텀 훅
// ============================================================

import { useQuery } from "@tanstack/react-query";
import {
  getInvestors,
  getInvestorDetail,
  getInvestorTypes,
} from "@/src/app/actions/investorAction";

export const investorKeys = {
  all: ["investors"] as const,
  list: (filters: Record<string, unknown>) =>
    [...investorKeys.all, "list", filters] as const,
  detail: (id: string) => [...investorKeys.all, "detail", id] as const,
  types: () => [...investorKeys.all, "types"] as const,
};

export function useInvestors(options?: {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { type, search, page = 1, pageSize = 20 } = options || {};

  return useQuery({
    queryKey: investorKeys.list({ type, search, page, pageSize }),
    queryFn: async () => {
      const result = await getInvestors({ type, search, page, pageSize });
      if (!result.success) throw new Error(result.error);
      return result;
    },
  });
}

export function useInvestorDetail(investorId: string | undefined) {
  return useQuery({
    queryKey: investorKeys.detail(investorId ?? ""),
    queryFn: async () => {
      const result = await getInvestorDetail(investorId!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!investorId,
  });
}

export function useInvestorTypes() {
  return useQuery({
    queryKey: investorKeys.types(),
    queryFn: async () => {
      const result = await getInvestorTypes();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}