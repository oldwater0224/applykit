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

// 탭 식별자 - 타입으로 좁혀서 오타/잘못된 값 방지
type TabId = "form" | "applications";

// 탭 메타데이터 - 추후 평가 탭 등 추가 시 여기에 한 줄만 더 넣으면 됨
const TABS: { id: TabId; label: string }[] = [
  { id: "form", label: "양식 편집" },
  { id: "applications", label: "접수 현황" },
];

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.id as string;

  // URL의 ?tab=... 값을 탭 상태로 사용
  // - 잘못된 값이 오면 기본 탭(form)으로 폴백
  // - 새로고침해도 탭 위치 유지
  const tabParam = searchParams.get("tab");
  const activeTab: TabId =
    tabParam === "applications" ? "applications" : "form";

  const { data: program, isLoading, error } = useProgram(programId);
  const updateProgram = useUpdateProgram();
  const { schema, isDirty, initSchema, markSaved } = useFormBuilderStore();

  // 프로그램 로드 시 폼 스키마 초기화
  // program.id가 바뀔 때만 실행 - refetch로 인한 덮어쓰기 방지
  useEffect(() => {
    if (!program) return;
    initSchema(program.form_schema ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

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
      });
      markSaved();
    } catch (err) {
      console.error("[handleSave]", err);
    }
  }

  // 탭 변경 - URL query param 업데이트
  // router.push 대신 router.replace를 쓰면 뒤로가기 히스토리에 안 쌓임
  // 탭 전환은 페이지 이동이 아니므로 replace가 자연스러움
  function handleTabChange(tab: TabId) {
    const newParams = new URLSearchParams(searchParams.toString());
    if (tab === "form") {
      // 기본 탭은 query param 제거해서 URL 깔끔하게
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
            {/* 저장 버튼은 양식 편집 탭에서만 의미 있음 - 다른 탭에서는 숨김 */}
            {activeTab === "form" && (
              <div className="flex items-center gap-3">
                {updateProgram.isError && (
                  <span className="text-sm text-red-600">
                    {updateProgram.error instanceof Error
                      ? updateProgram.error.message
                      : "저장에 실패했습니다."}
                  </span>
                )}
                {!updateProgram.isError && isDirty && (
                  <span className="text-sm text-amber-600">
                    저장되지 않은 변경사항
                  </span>
                )}
                {!updateProgram.isError &&
                  !isDirty &&
                  updateProgram.isSuccess && (
                    <span className="text-sm text-green-600">저장됨</span>
                  )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || updateProgram.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProgram.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            )}
          </div>

          {/* 탭 네비게이션 */}
          {/* 헤더 안에 두는 이유: sticky header를 만들 때 탭도 함께 따라옴 */}
          <div className="mt-4 border-b border-gray-200 -mb-4">
            <nav className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 탭별 콘텐츠 분기 */}
        {activeTab === "form" && (
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
        )}

        {activeTab === "applications" && (
          <ApplicationsTab programId={programId} />
        )}
      </div>
    </div>
  );
}

/**
 * 접수 현황 탭
 * - useProgramApplications로 해당 프로그램의 모든 지원서 조회
 * - 통계 카드 + 목록 테이블 표시
 */
function ApplicationsTab({ programId }: { programId: string }) {
  const {
    data: applications = [],
    isLoading,
    error,
  } = useProgramApplications(programId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm text-red-600">
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
        <h2 className="text-lg font-semibold mb-4">지원서 목록</h2>
        <ApplicationsTable applications={applications} />
      </div>
    </div>
  );
}
