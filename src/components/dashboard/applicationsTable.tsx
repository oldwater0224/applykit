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
      <div
        className="rounded-lg border p-12 text-center"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          아직 접수된 지원서가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead
            className="border-b"
            style={{ backgroundColor: "var(--navy-800)", borderColor: "var(--navy-700)" }}
          >
            <tr>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--gray-300)" }}>
                지원자
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--gray-300)" }}>
                상태
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--gray-300)" }}>
                제출일
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--gray-300)" }}>
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

function ApplicationRow({
  application,
  schema,
}: {
  application: Application;
  schema: FormSchema | null;
}) {
  const companyName = schema
    ? extractCompanyName(schema, application.form_data)
    : null;

  const userIdShort = application.user_id.slice(0, 8);
  const displayName = companyName ?? `지원자 #${userIdShort}`;

  const href = `/dashboard/programs/${application.program_id}/applications/${application.id}`;

  return (
    <tr
      className="border-b last:border-0 transition-colors"
      style={{ borderColor: "var(--navy-700)" }}
    >
      <td className="p-0">
        <Link
          href={href}
          className="block px-4 py-3 transition-colors"
          style={{ color: "var(--gray-200)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {companyName ? (
            <span className="font-medium">{displayName}</span>
          ) : (
            <span className="font-mono text-xs" style={{ color: "var(--gray-500)" }}>
              {displayName}
            </span>
          )}
        </Link>
      </td>
      <td className="p-0">
        <Link
          href={href}
          className="block px-4 py-3 transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <span
            className={`inline-block px-2 py-0.5 text-xs border rounded-full ${APPLICATION_STATUS_STYLE[application.status]}`}
          >
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>
        </Link>
      </td>
      <td className="p-0">
        <Link
          href={href}
          className="block px-4 py-3 transition-colors"
          style={{ color: "var(--gray-400)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {application.submitted_at
            ? new Date(application.submitted_at).toLocaleString("ko-KR")
            : "-"}
        </Link>
      </td>
      <td className="p-0">
        <Link
          href={href}
          className="block px-4 py-3 transition-colors"
          style={{ color: "var(--gray-400)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {new Date(application.created_at).toLocaleString("ko-KR")}
        </Link>
      </td>
    </tr>
  );
}
