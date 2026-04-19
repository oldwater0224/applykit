'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMyApplications } from '@/src/hooks/useApplication';
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_STYLE,
  ApplicationWithProgram,
} from '@/src/types/applications';

export default function MyApplicationsPage() {
  const { data: applications, isLoading, error } = useMyApplications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center text-red-600">
          {error instanceof Error
            ? error.message
            : '지원서 목록을 불러오지 못했습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">내 지원서</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            대시보드로
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {applications && applications.length > 0 ? (
          <ul className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/**
 * 지원서 한 건을 표시하는 카드
 * - is_complete 여부에 따라 "이어서 작성" / "상세 보기" 액션 분기
 * - 상태에 따라 뱃지 색상 다르게 표시
 */
function ApplicationCard({
  application,
}: {
  application: ApplicationWithProgram;
}) {
  const router = useRouter();
  const program = application.programs;

  // 프로그램이 삭제된 경우 - 방어적으로 처리
  // FK가 없거나 programs가 null로 오는 엣지 케이스 대비
  if (!program) {
    return (
      <li className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">
          삭제된 공고의 지원서입니다 (ID: {application.id})
        </p>
      </li>
    );
  }

  

  function handleClick() {
    if (!application.is_complete) {
      // 작성 중 - 작성 페이지로 이동해서 이어서 작성
      router.push(`/programs/${program?.id}/apply`);
    } else {
      // 제출 완료 - 상세 페이지로 이동
      // 상세 페이지는 아직 미구현이라 일단 작성 페이지로 보냄
      // (작성 페이지가 is_complete 체크해서 "이미 제출됨" 화면을 보여줌)
      router.push(`/programs/${program?.id}/apply`);
    }
  }

  return (
    <li
      onClick={handleClick}
      className="bg-white rounded-lg shadow p-6 cursor-pointer transition hover:shadow-md"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{program.title}</h2>
          {program.deadline && (
            <p className="text-sm text-gray-500 mt-1">
              접수 마감:{' '}
              {new Date(program.deadline).toLocaleDateString('ko-KR')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {application.is_complete && application.submitted_at
              ? `제출일: ${new Date(application.submitted_at).toLocaleString('ko-KR')}`
              : `최근 작성: ${new Date(application.created_at).toLocaleString('ko-KR')}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* 상태 뱃지 */}
          <span
            className={`px-2 py-0.5 text-xs border rounded-full ${APPLICATION_STATUS_STYLE[application.status]}`}
          >
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>

          {/* 액션 버튼 - 카드 클릭과 동일한 동작이지만 명시적으로 표시 */}
          <span className="text-sm text-blue-600">
            {application.is_complete ? '상세 보기 →' : '이어서 작성 →'}
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * 지원서가 하나도 없을 때 빈 상태
 */
function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <h2 className="text-lg font-semibold mb-2">
        아직 작성한 지원서가 없습니다
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        관심 있는 공고에 지원해보세요.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}