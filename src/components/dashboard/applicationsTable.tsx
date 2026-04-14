'use client';

import {
  Application,
  APPLICATION_STATUS_LABEL,
} from '@/src/types/applications';

interface ApplicationsTableProps {
  applications: Application[];
}

/**
 * 지원서 목록 테이블
 * - 지원자 / 상태 / 제출일 / 작성일 표시
 * - 빈 상태 처리
 * - 행 클릭은 일단 비활성 - 운영기관용 지원서 상세 페이지가 아직 없음
 *   (B-5 이후 작업으로 미룸)
 */
export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm text-gray-500">
          아직 접수된 지원서가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 테이블 헤더 - 작은 화면에서는 가로 스크롤 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                지원자
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                상태
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                제출일
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                작성 시작일
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 개별 행
 * - user_id의 앞 8자리만 표시 (실제 이름 표시는 추후 profiles 테이블 도입 후)
 * - 상태별 뱃지 색상은 목록 페이지와 동일하게 통일
 */
function ApplicationRow({ application }: { application: Application }) {
  // 상태 뱃지 스타일 - /applications 목록 페이지와 동일 매핑
  // 추후 공통 컴포넌트로 분리 고려 (StatusBadge)
  const statusStyle = {
    draft: 'border-amber-300 text-amber-700 bg-amber-50',
    submitted: 'border-blue-300 text-blue-700 bg-blue-50',
    reviewing: 'border-purple-300 text-purple-700 bg-purple-50',
    accepted: 'border-green-300 text-green-700 bg-green-50',
    rejected: 'border-red-300 text-red-700 bg-red-50',
  }[application.status];

  // user_id의 앞 8자리만 표시 - UUID 첫 세그먼트
  // 운영기관이 식별할 수 있는 최소한의 정보
  const userIdShort = application.user_id.slice(0, 8);

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 font-mono text-xs">지원자 #{userIdShort}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 text-xs border rounded-full ${statusStyle}`}
        >
          {APPLICATION_STATUS_LABEL[application.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {application.submitted_at
          ? new Date(application.submitted_at).toLocaleString('ko-KR')
          : '-'}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(application.created_at).toLocaleString('ko-KR')}
      </td>
    </tr>
  );
}