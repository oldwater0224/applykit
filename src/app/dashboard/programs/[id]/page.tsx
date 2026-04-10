"use client";

import { useParams } from "next/navigation";
import { useProgram, useUpdateProgram } from "@/src/hooks/usePrograms";
import { useFormBuilderStore } from "@/src/stores/formbuilderstore";
import { useEffect } from "react";
import Link from "next/link";
import { FormBuilder } from "./formBuilder";
import { FormPreview } from "./formPreview";
import { FormSchema } from "@/src/types/form";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.id as string;

  const { data: program, isLoading, error } = useProgram(programId);
  const updateProgram = useUpdateProgram();
  const { schema, isDirty, initSchema, markSaved } = useFormBuilderStore();

  // 프로그램 로드 시 폼 스키마 초기화
  useEffect(() => {
    if (program?.form_schema) {
      initSchema(program.form_schema as unknown as FormSchema);
    } else {
      initSchema(null);
    }
  }, [program?.id, program?.form_schema, initSchema]);

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (error || !program) {
    return <div className="p-8 text-red-600">프로그램을 찾을 수 없습니다.</div>;
  }

  async function handleSave() {
    try {
      await updateProgram.mutateAsync({
        id: programId,
        form_schema: schema,
      } as never);
      markSaved();
      alert("저장되었습니다.");
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard/programs"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 공고 목록
              </Link>
              <h1 className="text-xl font-bold mt-1">{program.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-sm text-amber-600">
                  저장되지 않은 변경사항
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty || updateProgram.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProgram.isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">양식 편집</h2>
            <FormBuilder />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">미리보기</h2>
            <FormPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
