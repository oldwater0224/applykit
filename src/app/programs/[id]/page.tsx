"use client";

// ============================================================
// src/app/programs/[id]/page.tsx
// 프로그램 상세 페이지 — 새 디자인 + 기업 연결
// ============================================================

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProgram } from "@/src/hooks/usePrograms";
import { useMyApplicationByProgram } from "@/src/hooks/useApplication";

export default function ProgramPublicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.id as string;
  const companyId = searchParams.get("company");

  const {
    data: program,
    isLoading: isProgramLoading,
    error: programError,
  } = useProgram(programId);

  const { data: existingApplication, isLoading: isAppLoading } =
    useMyApplicationByProgram(programId);

  if (isProgramLoading || isAppLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 text-gray-500">공고를 찾을 수 없습니다.</p>
        <Link href="/programs" className="text-blue-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const now = new Date();
  const deadline = program.deadline ? new Date(program.deadline) : null;
  const isDeadlinePassed = deadline !== null && deadline < now;
  const isPublished = program.status !== "closed";
  const canApply = isPublished && !isDeadlinePassed;

  const daysRemaining =
    deadline !== null
      ? Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const hasFormSchema =
    program.form_schema && program.form_schema.fields.length > 0;

  // 지원 페이지로 이동 (company 파라미터 전달)
  const handleApply = () => {
    const applyUrl = companyId
      ? `/programs/${programId}/apply?company=${companyId}`
      : `/programs/${programId}/apply`;
    router.push(applyUrl);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* 뒤로가기 */}
      <Link
        href="/programs"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← 공고 목록
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {/* 상태 뱃지 */}
        <div className="mb-4 flex items-center gap-2">
          {isDeadlinePassed ? (
            <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              접수 마감
            </span>
          ) : isPublished ? (
            <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              접수 중
            </span>
          ) : (
            <span className="rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              마감
            </span>
          )}
          {daysRemaining !== null &&
            daysRemaining >= 0 &&
            !isDeadlinePassed && (
              <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                D-{daysRemaining}
              </span>
            )}
        </div>

        {/* 기관명 */}
        {program.organizations && (
          <p className="mb-1 text-sm text-gray-500">
            {program.organizations.name}
          </p>
        )}

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900">{program.title}</h1>

        {/* 마감 정보 */}
        {deadline && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="text-gray-500">접수 마감:</span>
            <span className="text-gray-900">
              {deadline.toLocaleDateString("ko-KR")}
            </span>
          </div>
        )}

        {/* 공고 설명 */}
        {program.description && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              공고 내용
            </h2>
            <p className="whitespace-pre-wrap wrap-break-word text-sm text-gray-600">
              {program.description}
            </p>
          </div>
        )}

        {/* 액션 */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <ApplyButton
            canApply={canApply}
            hasFormSchema={!!hasFormSchema}
            isDeadlinePassed={isDeadlinePassed}
            isPublished={isPublished}
            existingApplication={existingApplication}
            onApply={handleApply}
          />
        </div>
      </div>
    </div>
  );
}

function ApplyButton({
  canApply,
  hasFormSchema,
  isDeadlinePassed,
  isPublished,
  existingApplication,
  onApply,
}: {
  canApply: boolean;
  hasFormSchema: boolean;
  isDeadlinePassed: boolean;
  isPublished: boolean;
  existingApplication: { id: string; is_complete: boolean } | null | undefined;
  onApply: () => void;
}) {
  if (existingApplication?.is_complete) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700">
          이미 이 공고에 지원서를 제출하셨습니다.
        </p>
        <Link
          href={`/applications/${existingApplication.id}`}
          className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          내 지원서 보기
        </Link>
      </div>
    );
  }

  if (existingApplication && !existingApplication.is_complete) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-700">작성 중인 지원서가 있습니다.</p>
        <button
          onClick={onApply}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          이어서 작성하기
        </button>
      </div>
    );
  }

  if (!hasFormSchema) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-400"
      >
        지원 양식 준비 중
      </button>
    );
  }

  if (!isPublished) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-400"
      >
        접수가 마감되었습니다
      </button>
    );
  }

  if (isDeadlinePassed) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-400"
      >
        접수 기간이 지났습니다
      </button>
    );
  }

  if (canApply) {
    return (
      <button
        onClick={onApply}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        지원하기
      </button>
    );
  }

  return null;
}