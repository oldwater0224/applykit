"use client";

import Link from "next/link";
import {
  Application,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_STYLE,
} from "@/src/types/applications";
import type { FormSchema } from "@/src/types/form";
import { extractCompanyName } from "@/src/lib/review/extractCompanyName";

interface ApplicationsTableProps {
  applications: Application[];
  // 한 프로그램의 지원서만 다루므로 schema도 1개
  // null인 케이스: 양식 미설정 프로그램 (방어적으로 받음)
  schema: FormSchema | null;
}

/**
 * 지원서 목록 테이블
 * - 지원자 식별자로 회사명 표시 (form_data에서 extractCompanyName으로 추출)
 * - 회사명 추출 실패 시 user_id 앞자리 fallback
 * - 각 행 클릭 시 운영기관용 지원서 상세 페이지로 이동
 */
export function ApplicationsTable({
  applications,
  schema,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-sm text-gray-500">아직 접수된 지원서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
              <ApplicationRow
                key={app.id}
                application={app}
                schema={schema}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 개별 행
 * - 표시 우선순위:
 *   1. form_data에서 회사명 추출 (isCompanyName 플래그 또는 라벨 키워드 매칭)
 *   2. fallback: user_id 앞 8자리 (#3a027c4f 같은 형태)
 * - schema가 null인 경우 (양식 미설정) 자동으로 fallback 사용
 */
function ApplicationRow({
  application,
  schema,
}: {
  application: Application;
  schema: FormSchema | null;
}) {
  // 회사명 추출 시도 - schema가 있을 때만
  const companyName = schema
    ? extractCompanyName(schema, application.form_data)
    : null;

  // fallback: user_id 첫 8자리 (UUID 첫 세그먼트)
  const userIdShort = application.user_id.slice(0, 8);

  // 표시할 라벨 결정
  // 회사명 있으면 그대로, 없으면 #해시 형태로 식별만 가능하게
  const displayName = companyName ?? `지원자 #${userIdShort}`;

  const href = `/dashboard/programs/${application.program_id}/applications/${application.id}`;
  const linkCell = "block px-4 py-3 hover:bg-blue-50";

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="p-0">
        <Link href={href} className={linkCell}>
          {/* 회사명이 있으면 일반 텍스트, 없으면 mono로 (식별 ID 느낌) */}
          {companyName ? (
            <span className="font-medium">{displayName}</span>
          ) : (
            <span className="font-mono text-xs text-gray-500">
              {displayName}
            </span>
          )}
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