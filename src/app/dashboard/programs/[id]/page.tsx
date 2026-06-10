"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProgram, useUpdateProgram } from "@/src/hooks/usePrograms";
import { useFormBuilderStore } from "@/src/stores/formbuilderstore";
import { useEffect } from "react";
import Link from "next/link";
import { FormBuilder } from "./formBuilder";
import { FormPreview } from "./formPreview";
import { useProgramApplications } from "@/src/hooks/useApplication";
import { ApplicationStatsCards } from "@/src/components/dashboard/applicationStatsCards";
import { ApplicationsTable } from "@/src/components/dashboard/applicationsTable";
import { ChecklistEditor } from "@/src/components/review/checklistEditor";
import { ReviewResultsList } from "@/src/components/review/reviewResultsList";

type TabId = "form" | "applications" | "review";

const TABS: { id: TabId; label: string }[] = [
  { id: "form", label: "양식 편집" },
  { id: "applications", label: "접수 현황" },
  { id: "review", label: "심사 양식" },
];

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.id as string;

  const tabParam = searchParams.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === tabParam)
    ? (tabParam as TabId)
    : "form";

  const { data: program, isLoading, error } = useProgram(programId);
  const updateProgram = useUpdateProgram();
  const { schema, isDirty, initSchema, markSaved } = useFormBuilderStore();

  useEffect(() => {
    if (!program) return;
    initSchema(program.form_schema ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div
          className="size-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="p-8" style={{ color: "var(--accent-rose)" }}>
        프로그램을 찾을 수 없습니다.
      </div>
    );
  }

  async function handleSave() {
    try {
      await updateProgram.mutateAsync({
        id: programId,
        form_schema: schema,
      });
      markSaved();
    } catch (err) {
      console.error("[handleSave]", err);
    }
  }

  function handleTabChange(tab: TabId) {
    const newParams = new URLSearchParams(searchParams.toString());
    if (tab === "form") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", tab);
    }
    const queryString = newParams.toString();
    router.replace(
      queryString
        ? `/dashboard/programs/${programId}?${queryString}`
        : `/dashboard/programs/${programId}`,
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <header style={{ backgroundColor: "var(--navy-900)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard/programs"
                className="text-sm transition"
                style={{ color: "var(--gray-400)" }}
              >
                ← 공고 목록
              </Link>
              <h1 className="text-xl font-bold mt-1" style={{ color: "var(--gray-100)" }}>
                {program.title}
              </h1>
            </div>
            {activeTab === "form" && (
              <div className="flex items-center gap-3">
                {updateProgram.isError && (
                  <span className="text-sm" style={{ color: "var(--accent-rose)" }}>
                    {updateProgram.error instanceof Error
                      ? updateProgram.error.message
                      : "저장에 실패했습니다."}
                  </span>
                )}
                {!updateProgram.isError && isDirty && (
                  <span className="text-sm" style={{ color: "var(--accent-amber)" }}>
                    저장되지 않은 변경사항
                  </span>
                )}
                {!updateProgram.isError &&
                  !isDirty &&
                  updateProgram.isSuccess && (
                    <span className="text-sm" style={{ color: "var(--accent-emerald)" }}>
                      저장됨
                    </span>
                  )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || updateProgram.isPending}
                  className="px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ backgroundColor: "var(--brand-600)" }}
                >
                  {updateProgram.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            )}
          </div>

          {/* 탭 네비게이션 */}
          <div className="mt-4 border-b -mb-4" style={{ borderColor: "var(--navy-700)" }}>
            <nav className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="pb-3 text-sm font-medium border-b-2 transition"
                  style={{
                    borderColor: activeTab === tab.id ? "var(--brand-500)" : "transparent",
                    color: activeTab === tab.id ? "var(--brand-500)" : "var(--gray-400)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--gray-100)" }}>
                양식 편집
              </h2>
              <FormBuilder />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--gray-100)" }}>
                미리보기
              </h2>
              <FormPreview />
            </div>
          </div>
        )}

        {activeTab === "applications" && (
          <ApplicationsTab programId={programId} />
        )}
        {activeTab === "review" && <ReviewTab programId={programId} />}
      </div>
    </div>
  );
}

function ApplicationsTab({ programId }: { programId: string }) {
  const {
    data: applications = [],
    isLoading,
    error,
  } = useProgramApplications(programId);
  const { data: program } = useProgram(programId);

  if (isLoading) {
    return (
      <div
        className="rounded-lg border p-12 text-center"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border p-12 text-center"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--accent-rose)" }}>
          {error instanceof Error
            ? error.message
            : "지원서 목록을 불러오지 못했습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ApplicationStatsCards applications={applications} />
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--gray-100)" }}>
          지원서 목록
        </h2>
        <ApplicationsTable
          applications={applications}
          schema={program?.form_schema ?? null}
        />
      </div>
    </div>
  );
}

function ReviewTab({ programId }: { programId: string }) {
  return (
    <div className="space-y-6">
      <ChecklistEditor programId={programId} />
      <ReviewResultsList programId={programId} />
    </div>
  );
}
