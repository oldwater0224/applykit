'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  uploadApplicationFile,
  deleteApplicationFile,
  getApplicationFiles,
  getFileSignedUrl,
} from '@/src/app/actions/applicationFileAction';

// 쿼리 키 - applicationKeys와 동일한 패턴
export const applicationFileKeys = {
  all: ['applicationFiles'] as const,
  byApplication: (applicationId: string) =>
    [...applicationFileKeys.all, 'by-application', applicationId] as const,
};

/**
 * 특정 지원서의 파일 목록 조회
 * - 작성 페이지에서 "이미 올라간 파일들" 표시용
 */
export function useApplicationFiles(applicationId: string | undefined) {
  return useQuery({
    queryKey: applicationFileKeys.byApplication(applicationId ?? ''),
    queryFn: async () => {
      const result = await getApplicationFiles(applicationId!);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!applicationId,
  });
}

/**
 * 파일 업로드 mutation
 * - File 객체를 받아서 FormData로 변환 후 Server Action 호출
 * - 호출부에서는 그냥 { applicationId, fieldKey, file }만 넘기면 됨
 */
export function useUploadApplicationFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      fieldKey,
      file,
    }: {
      applicationId: string;
      fieldKey: string;
      file: File;
    }) => {
      // Server Action은 FormData를 직접 받아야 File을 처리할 수 있음
      const formData = new FormData();
      formData.append('application_id', applicationId);
      formData.append('field_key', fieldKey);
      formData.append('file', file);

      const result = await uploadApplicationFile(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      // 해당 지원서의 파일 목록 갱신
      queryClient.invalidateQueries({
        queryKey: applicationFileKeys.byApplication(variables.applicationId),
      });
    },
  });
}

/**
 * 파일 삭제 mutation
 */
export function useDeleteApplicationFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
    }: {
      fileId: string;
      // applicationId는 mutationFn 안에서는 안 쓰지만
      // onSuccess에서 invalidate하기 위해 받아둠
      applicationId: string;
    }) => {
      const result = await deleteApplicationFile(fileId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationFileKeys.byApplication(variables.applicationId),
      });
    },
  });
}

/**
 * signed URL 생성 - 다운로드/미리보기 직전에 호출
 * - useQuery로 만들 수도 있지만, 1시간 만료라 캐싱이 까다로움
 * - mutation으로 두고 클릭 시점에 새로 발급받는 게 안전
 */
export function useFileSignedUrl() {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const result = await getFileSignedUrl(fileId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}