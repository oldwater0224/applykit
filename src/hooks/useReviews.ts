"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  upsertChecklist,
  getChecklistByProgram,
  createReview,
  updateReview,
  getReviewByApplication,
  getProgramReviews,
  searchArchive,
} from "@/src/app/actions/reviewAction";
import type {
  ReviewChecklist,
  ReviewResult,
  UpsertChecklistInput,
  CreateReviewInput,
  UpdateReviewInput,
} from "@/src/types/review";

// 쿼리 키 factory - applicationKeys 패턴 그대로
// 심사는 체크리스트와 결과 두 종류가 있어서 네임스페이스로 구분
// checklists: 프로그램별 체크리스트 (1:1)
// results: 프로그램/지원서별 심사 결과 (1:N)
// archive: 전역 검색 (기관 소속 모든 결과)
export const reviewKeys = {
  all: ["reviews"] as const,

  // 체크리스트 관련
  checklists: () => [...reviewKeys.all, "checklist"] as const,
  checklistByProgram: (programId: string) =>
    [...reviewKeys.checklists(), "by-program", programId] as const,

  // 심사 결과 관련
  results: () => [...reviewKeys.all, "result"] as const,
  resultByApplication: (applicationId: string) =>
    [...reviewKeys.results(), "by-application", applicationId] as const,
  resultsByProgram: (programId: string) =>
    [...reviewKeys.results(), "by-program", programId] as const,

  // 아카이브 검색 (Day 9에서 주로 사용)
  archive: (query: string) =>
    [...reviewKeys.all, "archive", query] as const,
};

// ============================================
// 체크리스트 쿼리
// ============================================

/**
 * 프로그램의 체크리스트 조회
 * - 없으면 null 반환 (에러 아님 - 아직 안 만든 상태)
 * - 체크리스트 편집 UI의 초기값 로드용
 */
export function useChecklist(programId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.checklistByProgram(programId ?? ""),
    queryFn: async (): Promise<ReviewChecklist | null> => {
      const result = await getChecklistByProgram(programId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!programId,
  });
}

// ============================================
// 심사 결과 쿼리
// ============================================

/**
 * 특정 지원서의 심사 결과 조회
 * - 없으면 null (아직 심사 안 함)
 * - 지원서 상세 페이지에서 "이미 심사됨" 표시용
 */
export function useReviewByApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.resultByApplication(applicationId ?? ""),
    queryFn: async (): Promise<ReviewResult | null> => {
      const result = await getReviewByApplication(applicationId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!applicationId,
  });
}

/**
 * 프로그램의 모든 심사 결과 조회 (운영기관 심사 탭)
 * - 합격/불합격 필터링은 클라이언트에서
 */
export function useProgramReviews(programId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.resultsByProgram(programId ?? ""),
    queryFn: async (): Promise<ReviewResult[]> => {
      const result = await getProgramReviews(programId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!programId,
  });
}

/**
 * 아카이브 검색 (회사명 부분검색)
 * - Day 9 아카이브 페이지에서 사용
 * - query가 빈 문자열이면 전체 최신순 반환
 * - query를 queryKey에 포함 - 검색어 바뀔 때마다 새 캐시 엔트리
 *
 * 참고: 실시간 검색이면 useDebouncedValue 등으로 디바운싱 권장
 *       (Day 9에서 구현)
 */
export function useArchiveSearch(query: string) {
  return useQuery({
    queryKey: reviewKeys.archive(query),
    queryFn: async (): Promise<ReviewResult[]> => {
      const result = await searchArchive(query);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    // 빈 검색어로도 최신 100건 가져오는 게 의미 있어서 enabled 기본 true
    // (검색 화면 진입 시 빈 상태 대신 최근 기록 보여주기)
  });
}

// ============================================
// 뮤테이션
// ============================================

/**
 * 체크리스트 upsert mutation
 * - 생성/수정 통합 (프로그램당 1개라 구분 의미 없음)
 * - 성공 시 해당 프로그램의 체크리스트 캐시 + 심사 결과 캐시 무효화
 *   (기준점 변경이 UI 표시에 영향 주는 경우 대비)
 */
export function useUpsertChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertChecklistInput) => {
      const result = await upsertChecklist(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.checklistByProgram(variables.program_id),
      });
      // 체크리스트 기준이 바뀌면 이 프로그램의 심사 목록 뷰도 갱신 필요
      // (평균 점수, 합격률 같은 파생 지표 변하므로)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.resultsByProgram(variables.program_id),
      });
    },
  });
}

/**
 * 심사 생성 mutation
 * - 성공 시 해당 지원서/프로그램의 심사 캐시 무효화
 * - 아카이브는 전체 무효화 (새 심사가 검색 결과에 포함되어야 함)
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const result = await createReview(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      // 이 지원서의 심사 결과 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: reviewKeys.resultByApplication(variables.application_id),
      });
      // 심사 결과 전체 무효화 - program_id를 변수로 받지 않으므로 넓게 무효화
      // (createReview는 application_id만 받고 내부에서 program_id 조회하는 구조)
      queryClient.invalidateQueries({ queryKey: reviewKeys.results() });
      // 아카이브 검색 결과도 새로고침
      queryClient.invalidateQueries({
        queryKey: [...reviewKeys.all, "archive"],
      });
    },
  });
}

/**
 * 심사 수정 mutation
 * - scores 변경 시 total_score, is_passed 재계산 (서버에서)
 * - 전체 심사 캐시 무효화 (영향 범위 파악 위해 review id만으로는 부족)
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateReviewInput;
    }) => {
      const result = await updateReview(id, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // 수정된 심사가 어느 application/program 소속인지 variables로 알 수 없어
      // (id만 받음) 심사 관련 전체 무효화
      queryClient.invalidateQueries({ queryKey: reviewKeys.results() });
      queryClient.invalidateQueries({
        queryKey: [...reviewKeys.all, "archive"],
      });
    },
  });
}