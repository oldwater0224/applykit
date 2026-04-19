'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApplication } from '@/src/hooks/useApplication';
import { useApplicationFiles } from '@/src/hooks/useApplicationFiles';
import { ApplicationReadOnlyView } from '@/src/components/application/applicationReadOnlyView';
import { APPLICATION_STATUS_LABEL } from '@/src/types/applications';
import { FormSchema } from '@/src/types/form';

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
  } = useApplication(applicationId);

  // 파일 목록 조회 - applicationId 있을 때만
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
          지원서를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const program = application.programs;

  // 삭제된 프로그램 케이스
  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center text-gray-500">
          이 지원서가 속한 공고가 삭제되었습니다.
        </div>
      </div>
    );
  }

  

  // form_schema는 Program 타입에서 FormSchema | null
  // 여기서는 application.programs의 부분 조회 결과라 form_schema가 없음
  // -> useProgram으로 별도 조회가 필요하지만, 일단 빈 스키마로 폴백
  // (개선 여지: useApplications의 select에 form_schema도 포함)
  const schema: FormSchema = application.programs?.form_schema ?? { fields: [], version: 1 }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/applications"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 내 지원서 목록
          </Link>
          <div className="mt-2 flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{program.title}</h1>
              {application.submitted_at && (
                <p className="text-sm text-gray-500 mt-1">
                  제출일:{' '}
                  {new Date(application.submitted_at).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm border rounded-full shrink-0 `}
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