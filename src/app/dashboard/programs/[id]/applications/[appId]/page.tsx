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
import { ReviewForm } from "@/src/components/review/reviewForm";

/**
 * 운영기관용 지원서 상세 페이지
 * - 경로: /dashboard/programs/[id]/applications/[appId]
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
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--gray-400)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--accent-rose)" }}>
          {appError instanceof Error
            ? appError.message
            : "지원서를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  const program = application.programs;

  if (!program) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--gray-500)" }}>
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
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <header
        className="border-b"
        style={{ backgroundColor: "var(--navy-900)", borderColor: "var(--navy-700)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/dashboard/programs/${programId}?tab=applications`}
            className="text-sm transition"
            style={{ color: "var(--gray-400)" }}
          >
            ← {program.title} 접수 현황
          </Link>

          <div className="mt-2 flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: "var(--gray-100)" }}>
                지원서 상세
              </h1>
              {application.submitted_at && (
                <p className="text-sm mt-1" style={{ color: "var(--gray-500)" }}>
                  제출일:{" "}
                  {new Date(application.submitted_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>

            <span
              className={`px-3 py-1 text-sm border rounded-full shrink-0 ${APPLICATION_STATUS_STYLE[application.status]}`}
            >
              {APPLICATION_STATUS_LABEL[application.status]}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <ApplicationReadOnlyView
          schema={schema}
          value={application.form_data}
          files={files}
        />

        <ReviewForm programId={programId} applicationId={applicationId} />
      </div>
    </div>
  );
}
