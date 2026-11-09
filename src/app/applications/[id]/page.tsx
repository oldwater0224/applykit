'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { useApplication } from '@/src/hooks/useApplication';
import { useApplicationFiles } from '@/src/hooks/useApplicationFiles';
import { ApplicationReadOnlyView } from '@/src/components/application/applicationReadOnlyView';
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_STYLE } from '@/src/types/applications';
import { FormSchema } from '@/src/types/form';
import { PAGE_TITLE_CLASS } from "@/src/components/layout/pageTitle";

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
  } = useApplication(applicationId);

  const { data: files = [], isLoading: isFilesLoading } =
    useApplicationFiles(applicationId);

  if (isAppLoading || isFilesLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--accent-rose)" }}>
          지원서를 찾을 수 없습니다
        </div>
      </div>
    );
  }

  const program = application.programs;

  if (!program) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center" style={{ color: "var(--text-secondary)" }}>
          이 지원서가 속한 공고가 삭제되었습니다
        </div>
      </div>
    );
  }

  const schema: FormSchema = application.programs?.form_schema ?? { fields: [], version: 1 }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <header
        className="border-b"
        style={{ backgroundColor: "var(--navy-900)", borderColor: "var(--navy-700)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/applications"
            className="inline-flex items-center gap-1 text-sm transition"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            내 지원서 목록
          </Link>
          <div className="mt-2 flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={`${PAGE_TITLE_CLASS} truncate`}>
                {program.title}
              </h1>
              {application.submitted_at && (
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  제출일:{' '}
                  {new Date(application.submitted_at).toLocaleString('ko-KR')}
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <ApplicationReadOnlyView
          schema={schema}
          value={application.form_data}
          files={files}
        />
      </div>
    </div>
  );
}
