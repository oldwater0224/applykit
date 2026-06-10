"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyApplications } from "@/src/hooks/useApplication";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_STYLE,
  ApplicationWithProgram,
} from "@/src/types/applications";


export default function MyApplicationsPage() {
  const { data: applications, isLoading, error } = useMyApplications();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center" style={{ color: "var(--gray-400)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center" style={{ color: "var(--accent-rose)" }}>
          {error instanceof Error
            ? error.message
            : "지원서 목록을 불러오지 못했습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header>
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-100)" }}>
            내 지원서
          </h1>
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

function ApplicationCard({
  application,
}: {
  application: ApplicationWithProgram;
}) {
  const router = useRouter();
  const program = application.programs;

  if (!program) {
    return (
      <li
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          삭제된 공고의 지원서입니다 (ID: {application.id})
        </p>
      </li>
    );
  }

  function handleClick() {
    if (!application.is_complete) {
      router.push(`/programs/${program?.id}/apply`);
    } else {
      router.push(`/programs/${program?.id}/apply`);
    }
  }

  return (
    <li
      onClick={handleClick}
      className="rounded-lg border p-6 cursor-pointer transition"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-500)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate" style={{ color: "var(--gray-200)" }}>
            {program.title}
          </h2>
          {program.deadline && (
            <p className="text-sm mt-1" style={{ color: "var(--gray-500)" }}>
              접수 마감:{" "}
              {new Date(program.deadline).toLocaleDateString("ko-KR")}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--gray-500)" }}>
            {application.is_complete && application.submitted_at
              ? `제출일: ${new Date(application.submitted_at).toLocaleString("ko-KR")}`
              : `최근 작성: ${new Date(application.created_at).toLocaleString("ko-KR")}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 text-xs border rounded-full ${APPLICATION_STATUS_STYLE[application.status]}`}
          >
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-lg border p-12 text-center"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--gray-100)" }}>
        아직 작성한 지원서가 없습니다
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--gray-500)" }}>
        관심 있는 공고에 지원해보세요.
      </p>
      <Link
        href="/programs"
        className="inline-block px-4 py-2 text-white rounded-md transition"
        style={{ backgroundColor: "var(--brand-600)" }}
      >
        공고보기
      </Link>
    </div>
  );
}
