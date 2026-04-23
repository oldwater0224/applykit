"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useOperatorApplication } from "@/src/hooks/useApplication";
import { useApplicationFiles } from "@/src/hooks/useApplicationFiles";
import { ApplicationReadOnlyView } from "@/src/components/application/applicationReadOnlyView";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_STYLE,
} from "@/src/types/applications";
import type { FormSchema } from "@/src/types/form";

/**
 * 운영기관용 지원서 상세 페이지
 * - 경로: /dashboard/programs/[id]/applications/[appId]
 * - 구성:
 *   1. 상단: 공고 상세로 돌아가기 + 지원자 식별 + 상태 뱃지
 *   2. 본문: ApplicationReadOnlyView (form_data + 첨부파일)
 *   3. 하단: 심사 영역 (Day 7에 평가 UI로 채움)
 */
export default function OperatorApplicationDetailPage() {
  const params = useParams();
  const programId = params.id as string;
  const applicationId = params.appId as string;

  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
  } = useOperatorApplication(applicationId);

  const { data: files = [], isLoading: isFilesLoading } =
    useApplicationFiles(applicationId);

  if (isAppLoading || isFilesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">로딩 중...</div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center text-red-600">
          {appError instanceof Error
            ? appError.message
            : "지원서를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  const program = application.programs;

  // Server Action에서 이미 검증했지만 타입 좁히기 위해 방어
  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">
          공고 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const schema: FormSchema = program.form_schema ?? {
    fields: [],
    version: 1,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* 공고 상세 접수 현황 탭으로 돌아가기 */}
          <Link
            href={`/dashboard/programs/${programId}?tab=applications`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {program.title} 접수 현황
          </Link>

          <div className="mt-2 flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">지원서 상세</h1>
              {application.submitted_at && (
                <p className="text-sm text-gray-500 mt-1">
                  제출일:{" "}
                  {new Date(application.submitted_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>

            {/* 상태 뱃지 - 공통 APPLICATION_STATUS_STYLE 사용 */}
            <span
              className={`px-3 py-1 text-sm border rounded-full shrink-0 ${APPLICATION_STATUS_STYLE[application.status]}`}
            >
              {APPLICATION_STATUS_LABEL[application.status]}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 지원서 본문 - 읽기 전용 뷰 + 파일 다운로드 */}
        <ApplicationReadOnlyView
          schema={schema}
          value={application.form_data}
          files={files}
        />

        {/* 심사 영역 - Day 7에 평가 UI로 교체 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">심사</h2>
          <p className="text-sm text-gray-500">
            심사 기능은 준비 중입니다.
          </p>
          {/* Day 7: 여기에 체크리스트 기반 평가 UI 추가 */}
          {/* - 체크리스트 항목별 점수 입력 */}
          {/* - 코멘트 입력 */}
          {/* - 심사 저장 버튼 */}
          {/* - 이미 심사했으면 수정 폼 */}
        </section>
      </div>
    </div>
  );
}