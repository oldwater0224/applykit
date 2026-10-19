"use client";

// ============================================================
// src/app/programs/[id]/page.tsx


import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProgram } from "@/src/hooks/usePrograms";
import { useMyApplicationByProgram } from "@/src/hooks/useApplication";
import {
  AVAILABILITY_BADGE_STYLE,
  getProgramAvailabilityView,
  type ProgramAvailabilityView,
} from "@/src/components/programs/programAvailability";
import { PROGRAM_AVAILABILITY_ERROR } from "@/src/lib/application/deadline";

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

    // Loading
  if (isProgramLoading || isAppLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-t-transparent bg-blue-500" 
          
        />
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4" style={{ color: "var(--gray-500)" }}>
          공고를 찾을 수 없습니다.
        </p>
        <Link
          href="/programs"
          className="hover:underline"
          style={{ color: "var(--brand-500)" }}
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const now = new Date();
  const deadline = program.deadline ? new Date(program.deadline) : null;
  // 서버(checkProgramAcceptingApplications)와 같은 기준으로 접수 가능 여부 판정
  const availability = getProgramAvailabilityView(program, now);
  const canApply = availability.accepting;

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
        className="mb-6 inline-flex items-center text-sm transition"
        style={{ color: "var(--gray-400)" }}
      >
        ← 공고 목록
      </Link>

      <div
        className="rounded-xl border p-8"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {/* 상태 뱃지 */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={AVAILABILITY_BADGE_STYLE[availability.tone]}
          >
            {availability.label}
          </span>
          {daysRemaining !== null &&
            daysRemaining >= 0 &&
            canApply && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{ borderColor: "var(--brand-500)", color: "var(--brand-500)", backgroundColor: "rgba(59, 130, 246, 0.1)" }}
              >
                D-{daysRemaining}
              </span>
            )}
        </div>

        {/* 기관명 */}
        {program.organizations && (
          <p className="mb-1 text-sm" style={{ color: "var(--gray-500)" }}>
            {program.organizations.name}
          </p>
        )}

        {/* 제목 */}
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-100)" }}>
          {program.title}
        </h1>

        {/* 마감 정보 */}
        {deadline && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span style={{ color: "var(--gray-500)" }}>접수 마감:</span>
            <span style={{ color: "var(--gray-100)" }}>
              {deadline.toLocaleDateString("ko-KR")}
            </span>
          </div>
        )}

        {/* 공고 설명 */}
        {program.description && (
          <div
            className="mt-6 border-t pt-6"
            style={{ borderColor: "var(--navy-700)" }}
          >
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--gray-300)" }}>
              공고 내용
            </h2>
            <p
              className="whitespace-pre-wrap wrap-break-word text-sm"
              style={{ color: "var(--gray-400)" }}
            >
              {program.description}
            </p>
          </div>
        )}

        {/* 액션 */}
        <div
          className="mt-8 border-t pt-6"
          style={{ borderColor: "var(--navy-700)" }}
        >
          <ApplyButton
            canApply={canApply}
            hasFormSchema={!!hasFormSchema}
            availability={availability}
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
  availability,
  existingApplication,
  onApply,
}: {
  canApply: boolean;
  hasFormSchema: boolean;
  availability: ProgramAvailabilityView;
  existingApplication: { id: string; is_complete: boolean } | null | undefined;
  onApply: () => void;
}) {
  if (existingApplication?.is_complete) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--accent-emerald)" }}>
          이미 이 공고에 지원서를 제출하셨습니다.
        </p>
        <Link
          href={`/applications/${existingApplication.id}`}
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--brand-600)" }}
        >
          내 지원서 보기
        </Link>
      </div>
    );
  }

  if (existingApplication && !existingApplication.is_complete) {
    // 접수가 끝난 공고의 작성 중 지원서는 서버가 저장·제출을 거부하므로 이어서 작성 불가
    if (!canApply) {
      return (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--gray-400)" }}>
            작성 중인 지원서가 있지만 더 이상 작성할 수 없습니다.{" "}
            {!availability.availability.ok &&
              PROGRAM_AVAILABILITY_ERROR[availability.availability.reason]}
          </p>
          <button
            disabled
            className="cursor-not-allowed rounded-lg border px-6 py-2.5 text-sm"
            style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
          >
            마감됨
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--accent-amber)" }}>
          작성 중인 지원서가 있습니다.
        </p>
        <button
          onClick={onApply}
          className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--brand-600)" }}
        >
          이어서 작성하기
        </button>
      </div>
    );
  }

  // 접수 불가 안내가 양식 준비 중보다 먼저 (apply 페이지·서버 판정 순서와 동일)
  if (!canApply) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border px-6 py-2.5 text-sm"
        style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
      >
        {availability.disabledLabel}
      </button>
    );
  }

  if (!hasFormSchema) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border px-6 py-2.5 text-sm"
        style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
      >
        지원 양식 준비 중
      </button>
    );
  }

  return (
    <button
      onClick={onApply}
      className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition"
      style={{ backgroundColor: "var(--brand-600)" }}
    >
      지원하기
    </button>
  );
}
