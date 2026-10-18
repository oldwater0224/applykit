'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authstore';
import { getAdminDashboardOverview } from '@/src/app/actions/adminDashboardAction';

// 쿼리 키 상수
export const adminDashboardKeys = {
  all: ['adminDashboard'] as const,
  overview: (orgId: string) =>
    [...adminDashboardKeys.all, 'overview', orgId] as const,
};

// 운영기관 대시보드 개요 조회
// - usePrograms와 동일하게 authStore의 orgId 사용, orgId 없으면 비활성
// - 지원서/심사/공고 변경 후 갱신이 필요하면
//   queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all })
export function useAdminDashboard() {
  const { orgId } = useAuthStore();

  return useQuery({
    queryKey: adminDashboardKeys.overview(orgId || ''),
    queryFn: async () => {
      // ActionResult → TanStack Query 에러 플로우로 변환
      const result = await getAdminDashboardOverview(orgId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!orgId,
  });
}
