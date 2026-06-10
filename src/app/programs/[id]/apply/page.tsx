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

  const [currentApplicationId, setCurrentApplicationId] = useState<
    string | null
  >(null);

  const { data: uploadedFiles = [] } = useApplicationFiles(
    currentApplicationId ?? undefined,
  );

  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set(),
  );

  const [formData, setFormData] = useState<ApplicationFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const progress = useMemo(() => {
    const requiredFields = schema.fields.filter((f) => f.required);
    if (requiredFields.length === 0) return 100;

    const filledCount = requiredFields.filter((f) => {
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

  async function handleFileUpload(fieldKey: string, file: File) {
    setUploadingFields((prev) => new Set(prev).add(fieldKey));

    try {
      let appId = currentApplicationId;

      if (!appId) {
        const created = await createMutation.mutateAsync({
          program_id: programId,
          form_data: formData,
          is_complete: false,
        });
        appId = created.id;
        setCurrentApplicationId(appId);
      }

      await uploadFileMutation.mutateAsync({
        applicationId: appId,
        fieldKey,
        file,
      });

      if (errors[fieldKey]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
    } catch (err) {
      console.error("[handleFileUpload]", err);
      throw err;
    } finally {
      setUploadingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });
    }
  }

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
    return (
      <div className="p-8 text-center" style={{ color: "var(--gray-400)" }}>
        로딩 중...
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--accent-rose)" }}>
        프로그램을 찾을 수 없습니다.
      </div>
    );
  }

  if (existingApplication?.is_complete) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "var(--page-bg)" }}>
        <div
          className="max-w-2xl mx-auto rounded-lg border p-8 text-center"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--gray-100)" }}>
            이미 제출된 지원서입니다
          </h1>
          <p className="mb-6" style={{ color: "var(--gray-400)" }}>
            {program.title}에 이미 지원하셨습니다.<br/>
            이미 지원한 지원서는 수정이
            불가합니다.
          </p>

          <Link
            href="/applications"
            className="inline-block px-4 py-2 text-white rounded-md transition"
            style={{ backgroundColor: "var(--brand-600)" }}
          >
            내 지원목록 보기
          </Link>
        </div>
      </div>
    );
  }

  if (schema.fields.length === 0) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "var(--page-bg)" }}>
        <div
          className="max-w-2xl mx-auto rounded-lg border p-8 text-center"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--gray-100)" }}>
            아직 준비 중입니다
          </h1>
          <p style={{ color: "var(--gray-400)" }}>
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

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    uploadFileMutation.error ||
    deleteFileMutation.error;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: "var(--navy-900)", borderColor: "var(--navy-700)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-100)" }}>
            {program.title}
          </h1>
          {program.deadline && (
            <p className="text-sm mt-1" style={{ color: "var(--gray-500)" }}>
              접수 마감:{" "}
              {new Date(program.deadline).toLocaleDateString("ko-KR")}
            </p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--gray-400)" }}>
              <span>작성 진행률</span>
              <span>{progress}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--navy-700)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: "var(--brand-500)" }}
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
          <div
            className="mt-4 p-3 border rounded-md text-sm"
            style={{ borderColor: "var(--accent-rose)", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)" }}
          >
            필수 항목 {Object.keys(errors).length}개를 입력해주세요.
          </div>
        )}

        {mutationError && (
          <div
            className="mt-4 p-3 border rounded-md text-sm"
            style={{ borderColor: "var(--accent-rose)", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)" }}
          >
            {mutationError instanceof Error
              ? mutationError.message
              : "저장 중 오류가 발생했습니다."}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{ backgroundColor: "var(--brand-600)" }}
          >
            {isPending ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
