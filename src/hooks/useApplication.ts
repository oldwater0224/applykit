// src/hooks/useApplications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/src/lib/supabase/client";
import {
  createApplication,
  updateApplication,
  deleteApplication,
  getProgramApplications,
  getApplicationForOperator
} from "@/src/app/actions/applicationAction";
import type {
  Application,
  ApplicationWithProgram,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/src/types/applications";

// 쿼리 키를 한곳에서 관리
// 문자열 배열을 직접 쓰면 오타/불일치로 캐시 무효화가 꼬이기 쉬워서
// factory 패턴으로 중앙화 - 계층 구조로 만들어서 부분 무효화도 쉬움
// 예: applicationKeys.all로 모든 지원서 쿼리 한 번에 무효화 가능

export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (filters?: { programId?: string }) =>
    [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  byProgram: (programId: string) =>
    [...applicationKeys.all, "by-program", programId] as const,
  // 운영기관용 - 특정 프로그램의 모든 지원서
  // byProgram(지원자용)과 다름 - 이건 모든 사용자의 지원서를 봄
  programApplications: (programId: string) =>
    [...applicationKeys.all, "program-applications", programId] as const,
  // 운영기관용 단건 상세 - 지원자용 detail(id)과 구분
  // 같은 applicationId라도 권한 컨텍스트가 다르므로 별도 캐시 키
  operatorDetail: (id: string) =>
    [...applicationKeys.all, "operator-detail", id] as const,
};

/**
 * 내 지원서 목록 조회 (프로그램 정보 포함)
 * - "내 지원 현황" 페이지에서 사용
 * - 프로그램 정보를 조인해서 "어떤 공고에 지원했는지"를 함께 보여줌
 */
export function useMyApplications() {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: async (): Promise<ApplicationWithProgram[]> => {
      const supabase = createClient();

      // 현재 유저 확인 - RLS가 막아주지만 명시적으로 필터링
      // (RLS만 믿고 eq를 생략하면 쿼리 의도가 불분명해짐)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // programs 테이블 조인 - 목록에서 공고명/마감일 함께 표시
      // Supabase의 관계 쿼리 문법: '*, programs(컬럼들)'
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          programs (
            id,
            title,
            deadline,
            org_id,
            form_schema
          )
          `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApplicationWithProgram[];
    },
  });
}

/**
 * 특정 지원서 단건 조회 (상세 페이지용)
 * - enabled 옵션으로 id가 있을 때만 실행
 */
export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ""),
    queryFn: async (): Promise<ApplicationWithProgram> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          programs (
            id,
            title,
            deadline,
            org_id,
            form_schema
          )
          `,
        )
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as ApplicationWithProgram;
    },
    // id가 없으면 쿼리 실행 안 함 (라우팅 직후 id가 undefined일 때 대비)
    enabled: !!id,
  });
}

/**
 * 특정 프로그램에 대한 내 지원서 조회
 * - 프로그램 상세 페이지에서 "이미 지원했는지" 확인용
 * - 중복 지원 방지 UI 표시에 사용
 * - 없으면 null 반환 (404가 아님)
 */
export function useMyApplicationByProgram(programId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.byProgram(programId ?? ""),
    queryFn: async (): Promise<Application | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // maybeSingle - 결과가 없어도 에러가 아니라 null 반환
      // single은 0건일 때 에러를 던지는데, 여기서는 "아직 지원 안 함"이 정상 케이스
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("program_id", programId!)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Application | null;
    },
    enabled: !!programId,
  });
}

/**
 * 지원서 생성 mutation
 * - Server Action을 TanStack Query mutation으로 감쌈
 * - 성공 시 관련 쿼리 무효화로 UI 자동 갱신
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const result = await createApplication(input);
      // Server Action의 { success, error } 패턴을
      // TanStack Query의 에러 플로우로 변환
      // 이렇게 해야 onError 핸들러에서 잡을 수 있음
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      // 지원서 목록 전체 무효화
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      // 해당 프로그램의 "내 지원서" 쿼리도 무효화
      // (프로그램 상세 페이지에서 "이미 지원함" 상태로 바뀌도록)
      queryClient.invalidateQueries({
        queryKey: applicationKeys.byProgram(variables.program_id),
      });
    },
  });
}

/**
 * 지원서 수정 mutation (임시저장/제출 모두 처리)
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateApplicationInput;
    }) => {
      const result = await updateApplication(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      // 수정된 지원서 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.id),
      });
      // 목록도 함께 무효화 (상태/내용 변경이 목록 뷰에 반영되어야 함)
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

/**
 * 지원서 삭제 mutation
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteApplication(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // 삭제 후에는 all로 싹 무효화 - 어느 프로그램 것이었는지 모르니까
      // (mutationFn에 programId를 받아서 정확히 타겟팅하는 것도 가능하지만,
      //  삭제는 빈도가 낮으므로 넓게 무효화하는 게 단순함)
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
/**
 * 특정 프로그램의 모든 지원서 조회 (운영기관용)
 * - useMyApplicationByProgram(지원자용)과 구분 -
 *   이건 본인 것 1건이 아니라 해당 프로그램의 전체 지원서 N건
 * - Server Action에서 권한 검증 (org_members 멤버십)
 */
export function useProgramApplications(programId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.programApplications(programId ?? ""),
    queryFn: async () => {
      const result = await getProgramApplications(programId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!programId,
  });
}
/**
 * 운영기관용 지원서 단건 조회 (상세 페이지)
 * - useApplication과 구분 - 권한 체크 방식이 다름
 * - form_schema 포함 (양식 렌더링용)
 */
export function useOperatorApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.operatorDetail(applicationId ?? ""),
    queryFn: async () => {
      const result = await getApplicationForOperator(applicationId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!applicationId,
  });
}