'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '../stores/authstore';
import {
  createProgram,
  deleteProgram,
  getProgram,
  getPrograms,
  updateProgram,
} from '@/src/app/actions/programActions';
import { CreateProgramData, UpdateProgramData } from '../types/program';

// 쿼리 키 상수
export const programKeys = {
  all: ['programs'] as const,
  list: (orgId: string) => [...programKeys.all, 'list', orgId] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
};

// 프로그램 목록 조회
export function usePrograms() {
  const { orgId } = useAuthStore();

  return useQuery({
    queryKey: programKeys.list(orgId || ''),
    queryFn: async () => {
      // Server Action은 ActionResult를 반환 -
      // TanStack Query 에러 플로우로 태우기 위해 throw로 변환
      const result = await getPrograms(orgId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!orgId,
  });
}

// 프로그램 상세 조회
export function useProgram(id: string) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: async () => {
      const result = await getProgram(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

// 프로그램 생성
export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthStore();

  return useMutation({
    mutationFn: async (programData: CreateProgramData) => {
      const result = await createProgram(orgId!, programData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) });
    },
  });
}

// 프로그램 수정
// - 폼 빌더의 "폼 저장"도 이 훅을 그대로 사용 (form_schema만 partial update)
export function useUpdateProgram() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UpdateProgramData) => {
      const result = await updateProgram(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) });
      queryClient.invalidateQueries({
        queryKey: programKeys.detail(variables.id),
      });
    },
  });
}

// 프로그램 삭제
export function useDeleteProgram() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProgram(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) });
    },
  });
}