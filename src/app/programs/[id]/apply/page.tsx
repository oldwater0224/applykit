"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useProgram } from "@/src/hooks/usePrograms";
import {
  useMyApplicationByProgram,
  useCreateApplication,
  useUpdateApplication,
} from "@/src/hooks/useApplication";
import {
  useApplicationFiles,
  useUploadApplicationFile,
  useDeleteApplicationFile,
} from "@/src/hooks/useApplicationFiles";
import { ApplicationFormRenderer } from "@/src/components/application/applicationFormRenderer";
import { ApplicationFormData } from "@/src/types/applications";
import { FormSchema } from "@/src/types/form";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const {
    data: program,
    isLoading: isProgramLoading,
    error: programError,
  } = useProgram(programId);

  const { data: existingApplication, isLoading: isApplicationLoading } =
    useMyApplicationByProgram(programId);

  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const uploadFileMutation = useUploadApplicationFile();
  const deleteFileMutation = useDeleteApplicationFile();

  // 현재 작업 중인 application의 id
  // - 기존 draft가 있으면 그 id
  // - 없으면 null이었다가, 첫 파일 업로드 또는 임시저장 시점에 생성되어 채워짐
  // - 한번 생성되면 페이지를 떠나기 전까지 동일 id 유지
  const [currentApplicationId, setCurrentApplicationId] = useState<
    string | null
  >(null);

  // 파일 목록 - currentApplicationId가 있을 때만 조회
  const { data: uploadedFiles = [] } = useApplicationFiles(
    currentApplicationId ?? undefined,
  );

  // 업로드 중인 필드 추적 - 해당 필드 input을 disable
  // Set 사용 - 여러 필드가 동시에 업로드될 수 있음 (드물지만)
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set(),
  );

  const [formData, setFormData] = useState<ApplicationFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 기존 지원서 로드 시 초기화
  // - existingApplication이 도착하면 currentApplicationId와 formData 동시 세팅
  useEffect(() => {
    if (existingApplication) {
      setCurrentApplicationId(existingApplication.id);
      setFormData(existingApplication.form_data || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingApplication?.id]);

  const schema: FormSchema = useMemo(
    () => program?.form_schema ?? { fields: [], version: 1 },
    [program?.form_schema],
  );

  // 진행률 계산 
  const progress = useMemo(() => {
    const requiredFields = schema.fields.filter((f) => f.required);
    if (requiredFields.length === 0) return 100;

    const filledCount = requiredFields.filter((f) => {
      // 파일 필드는 업로드된 파일이 있는지로 판단
      if (f.type === "file") {
        return uploadedFiles.some((file) => file.field_key === f.id);
      }
      const v = formData[f.id];
      if (v === null || v === undefined || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }).length;

    return Math.round((filledCount / requiredFields.length) * 100);
  }, [schema.fields, formData, uploadedFiles]);

  function handleFieldChange(
    fieldId: string,
    value: ApplicationFormData[string],
  ) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  /**
   * 파일 업로드 핸들러
   * - draft가 없으면 먼저 빈 draft 생성 후 그 id로 업로드
   * - 한 번 생성된 draft는 currentApplicationId에 캐시되어 재사용
   */
  async function handleFileUpload(fieldKey: string, file: File) {
    // 업로드 중 표시
    setUploadingFields((prev) => new Set(prev).add(fieldKey));

    try {
      let appId = currentApplicationId;

      // draft가 없으면 먼저 생성
      // - 현재 formData를 함께 저장 (사용자가 텍스트 필드도 입력했을 수 있음)
      if (!appId) {
        const created = await createMutation.mutateAsync({
          program_id: programId,
          form_data: formData,
          is_complete: false,
        });
        appId = created.id;
        setCurrentApplicationId(appId);
      }

      // 파일 업로드
      await uploadFileMutation.mutateAsync({
        applicationId: appId,
        fieldKey,
        file,
      });

      // 파일 필드 에러가 있었으면 제거
      if (errors[fieldKey]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
    } catch (err) {
      // 에러는 mutation.error로 surface됨 - 여기서는 throw해서 자식 컴포넌트도 알 수 있게
      console.error("[handleFileUpload]", err);
      throw err;
    } finally {
      // 업로드 중 표시 해제
      setUploadingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });
    }
  }

  /**
   * 파일 삭제 핸들러
   */
  async function handleFileDelete(fileId: string) {
    if (!currentApplicationId) return;

    try {
      await deleteFileMutation.mutateAsync({
        fileId,
        applicationId: currentApplicationId,
      });
    } catch (err) {
      console.error("[handleFileDelete]", err);
    }
  }

  function validate(): Record<string, string> {
    const newErrors: Record<string, string> = {};

    for (const field of schema.fields) {
      if (!field.required) continue;

      // 파일 필드는 uploadedFiles로 검증
      if (field.type === "file") {
        const hasFile = uploadedFiles.some((f) => f.field_key === field.id);
        if (!hasFile) {
          newErrors[field.id] = "파일을 업로드해주세요.";
        }
        continue;
      }

      const v = formData[field.id];
      const isEmpty =
        v === null ||
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);

      if (isEmpty) {
        newErrors[field.id] = "필수 항목입니다.";
      }
    }

    return newErrors;
  }

  async function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (currentApplicationId) {
        await updateMutation.mutateAsync({
          id: currentApplicationId,
          input: { form_data: formData, is_complete: true },
        });
      } else {
        // draft가 없는 상태에서 바로 제출하는 케이스
        // (파일 필드 없이 텍스트만 입력하고 바로 제출)
        await createMutation.mutateAsync({
          program_id: programId,
          form_data: formData,
          is_complete: true,
        });
      }
      router.push("/applications");
    } catch (err) {
      console.error("[handleSubmit]", err);
    }
  }

  // === 렌더링 분기 ===

  if (isProgramLoading || isApplicationLoading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  if (programError || !program) {
    return (
      <div className="p-8 text-center text-red-600">
        프로그램을 찾을 수 없습니다.
      </div>
    );
  }

  if (existingApplication?.is_complete) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-xl font-bold mb-2">이미 제출된 지원서입니다</h1>
          <p className="text-gray-600 mb-6">
            {program.title}에 이미 지원하셨습니다.<br/>
            이미 지원한 지원서는 수정이
            불가합니다.
          </p>

          <Link
            href="/applications"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            내 지원목록 보기
          </Link>
        </div>
      </div>
    );
  }

  if (schema.fields.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-xl font-bold mb-2">아직 준비 중입니다</h1>
          <p className="text-gray-600">
            이 공고의 지원 양식이 아직 등록되지 않았습니다.
          </p>
        </div>
      </div>
    );
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadFileMutation.isPending ||
    deleteFileMutation.isPending;

  // 모든 mutation의 에러 중 가장 최근 것 표시
  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    uploadFileMutation.error ||
    deleteFileMutation.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">{program.title}</h1>
          {program.deadline && (
            <p className="text-sm text-gray-500 mt-1">
              접수 마감:{" "}
              {new Date(program.deadline).toLocaleDateString("ko-KR")}
            </p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>작성 진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <ApplicationFormRenderer
          schema={schema}
          value={formData}
          onChange={handleFieldChange}
          errors={errors}
          applicationId={currentApplicationId}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          uploadingFields={uploadingFields}
        />

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 border border-red-300 rounded-md bg-red-50 text-sm text-red-700">
            필수 항목 {Object.keys(errors).length}개를 입력해주세요.
          </div>
        )}

        {mutationError && (
          <div className="mt-4 p-3 border border-red-300 rounded-md bg-red-50 text-sm text-red-700">
            {mutationError instanceof Error
              ? mutationError.message
              : "저장 중 오류가 발생했습니다."}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
