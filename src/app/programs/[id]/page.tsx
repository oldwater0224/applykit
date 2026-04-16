"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProgram } from "@/src/hooks/usePrograms";
import { useMyApplicationByProgram } from "@/src/hooks/useApplication";

export default function ProgramPublicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const {
    data: program,
    isLoading: isProgramLoading,
    error: programError,
  } = useProgram(programId);

  // 이미 지원했는지 확인 - 버튼 상태 분기용
  const { data: existingApplication, isLoading: isAppLoading } =
    useMyApplicationByProgram(programId);

  if (isProgramLoading || isAppLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">로딩 중...</div>
      </div>
    );
  }

  if (programError || !program) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center text-red-600">
          공고를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  // 접수 가능 여부 계산
  // 결정: 'closed'가 아니면 접수 가능 (draft도 포함)
  // 추후 'published' 발행 기능 추가 시 이 로직을 정식화할 예정
  const now = new Date();
  const deadline = program.deadline ? new Date(program.deadline) : null;
  const isDeadlinePassed = deadline !== null && deadline < now;
  const isPublished = program.status !== "closed";
  const canApply = isPublished && !isDeadlinePassed;

  // D-day 계산
  // ceil로 올림 - 오늘 마감이면 D-0, 내일 마감이면 D-1
  const daysRemaining =
    deadline !== null
      ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // 폼 스키마 유무 - 양식이 없으면 지원 불가
  const hasFormSchema =
    program.form_schema && program.form_schema.fields.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* 상태 뱃지 */}
          <div className="flex items-center gap-2 mb-4">
            {isDeadlinePassed ? (
              <span className="px-2 py-0.5 text-xs border border-red-300 text-red-700 bg-red-50 rounded-full">
                접수 마감
              </span>
            ) : isPublished ? (
              <span className="px-2 py-0.5 text-xs border border-green-300 text-green-700 bg-green-50 rounded-full">
                접수 중
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs border border-gray-300 text-gray-600 bg-gray-50 rounded-full">
                마감
              </span>
            )}
          </div>

          {/* 기관명 - organizations가 있을 때만 표시 */}
          {program.organizations && (
            <p className="text-sm text-gray-500 mb-1">
              {program.organizations.name}
            </p>
          )}

          <h1 className="text-2xl font-bold">{program.title}</h1>

          {/* 마감 정보 */}
          {deadline && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-gray-500">접수 마감:</span>
              <span>{deadline.toLocaleDateString("ko-KR")}</span>
              {daysRemaining !== null &&
                daysRemaining >= 0 &&
                !isDeadlinePassed && (
                  <span className="px-2 py-0.5 text-xs border border-blue-300 text-blue-700 bg-blue-50 rounded-full">
                    D-{daysRemaining}
                  </span>
                )}
            </div>
          )}

          {/* 공고 설명 */}
          {program.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                공고 내용
              </h2>
              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                {program.description}
              </p>
            </div>
          )}

          {/* 액션 섹션 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <ApplyButton
              canApply={canApply}
              hasFormSchema={!!hasFormSchema}
              isDeadlinePassed={isDeadlinePassed}
              isPublished={isPublished}
              existingApplication={existingApplication}
              onApply={() => router.push(`/programs/${programId}/apply`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 지원하기 버튼 - 상태에 따라 6가지 분기
 * - 우선순위: 제출 완료 > 임시저장 > 양식 미등록 > 미발행 > 마감 > 정상
 */
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
  // 1. 제출 완료 - 가장 높은 우선순위
  // 마감/비발행이 와도 내 제출 이력은 먼저 보여줘야 함
  if (existingApplication?.is_complete) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700">
          이미 이 공고에 지원서를 제출하셨습니다.
        </p>
        <Link
          href={`/applications/${existingApplication.id}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          내 지원서 보기
        </Link>
      </div>
    );
  }

  // 2. 임시저장 상태 - 이어서 작성
  if (existingApplication && !existingApplication.is_complete) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-700">작성 중인 지원서가 있습니다.</p>
        <button
          onClick={onApply}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          이어서 작성하기
        </button>
      </div>
    );
  }

  // 3. 양식 미등록
  if (!hasFormSchema) {
    return (
      <button
        disabled
        className="px-6 py-3 border border-gray-300 text-gray-400 rounded-md cursor-not-allowed"
      >
        지원 양식 준비 중
      </button>
    );
  }

  // 4. 미발행(closed) 상태
  if (!isPublished) {
    return (
      <button
        disabled
        className="px-6 py-3 border border-gray-300 text-gray-400 rounded-md cursor-not-allowed"
      >
        접수가 마감되었습니다
      </button>
    );
  }

  // 5. 기간 만료
  if (isDeadlinePassed) {
    return (
      <button
        disabled
        className="px-6 py-3 border border-gray-300 text-gray-400 rounded-md cursor-not-allowed"
      >
        접수 기간이 지났습니다
      </button>
    );
  }

  // 6. 정상 - 지원 가능
  if (canApply) {
    return (
      <button
        onClick={onApply}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        지원하기
      </button>
    );
  }

  return null;
}
