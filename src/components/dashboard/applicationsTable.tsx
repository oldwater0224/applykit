"use client";

import Link from "next/link";
import {
  Application,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_STYLE,
} from "@/src/types/applications";

interface ApplicationsTableProps {
  applications: Application[];
}

/**
 * 지원서 목록 테이블
 * - 지원자 / 상태 / 제출일 / 작성일 표시
 * - 각 행 클릭 시 운영기관용 지원서 상세 페이지로 이동
 * - 빈 상태 처리
 *
 * draft 상태 지원서도 링크 활성 - 운영기관이 미완성 지원서를
 * 확인할 수 있어야 함 (심사는 제출된 지원서에 대해서만 가능하며
 * 이는 ReviewForm에서 차단)
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
 * - 각 td를 Link로 래핑 - tr 전체를 a로 감싸는 건 HTML 스펙 위반
 *   (ReviewResultsList와 동일 패턴)
 */
function ApplicationRow({ application }: { application: Application }) {
  // user_id의 앞 8자리만 표시 - UUID 첫 세그먼트
  // 운영기관이 식별할 수 있는 최소한의 정보
  const userIdShort = application.user_id.slice(0, 8);

  // 링크 경로 - program_id는 application row에 포함돼 있어 prop 없이 구성 가능
  const href = `/dashboard/programs/${application.program_id}/applications/${application.id}`;

  // 모든 td가 동일한 링크를 가리킴 - 행 어디를 클릭해도 상세로 이동
  const linkCell = "block px-4 py-3 hover:bg-blue-50";

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="p-0">
        <Link href={href} className={`${linkCell} font-mono text-xs`}>
          지원자 #{userIdShort}
        </Link>
      </td>
      <td className="p-0">
        <Link href={href} className={linkCell}>
          <span
            className={`inline-block px-2 py-0.5 text-xs border rounded-full ${APPLICATION_STATUS_STYLE[application.status]}`}
          >
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>
        </Link>
      </td>
      <td className="p-0">
        <Link href={href} className={`${linkCell} text-gray-600`}>
          {application.submitted_at
            ? new Date(application.submitted_at).toLocaleString("ko-KR")
            : "-"}
        </Link>
      </td>
      <td className="p-0">
        <Link href={href} className={`${linkCell} text-gray-600`}>
          {new Date(application.created_at).toLocaleString("ko-KR")}
        </Link>
      </td>
    </tr>
  );
}