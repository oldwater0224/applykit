'use client';

import Link from 'next/link';
import { usePublicPrograms } from '@/src/hooks/usePrograms';
import { Program } from '@/src/types/program';

export default function PublicProgramsPage() {
  const { data: programs, isLoading, error } = usePublicPrograms();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto text-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto text-center text-red-600">
          {error instanceof Error
            ? error.message
            : '공고 목록을 불러오지 못했습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">공고 둘러보기</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            대시보드로
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {programs && programs.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
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
 * 공고 카드 - 그리드의 한 셀
 * - 카드 전체가 링크로 동작 (공개 상세 페이지로)
 * - 마감 임박 뱃지, 양식 준비 상태 표시
 */
function ProgramCard({ program }: { program: Program }) {
  // 마감 정보 계산 - 공개 상세 페이지와 동일 로직
  const now = new Date();
  const deadline = program.deadline ? new Date(program.deadline) : null;
  const isDeadlinePassed = deadline !== null && deadline < now;
  const daysRemaining =
    deadline !== null
      ? Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

  // 양식 등록 여부 - 카드에서 미리 표시해서 사용자가 상세 페이지 가기 전에 알 수 있게
  const hasFormSchema =
    program.form_schema && program.form_schema.fields.length > 0;

  return (
    <li>
      <Link
        href={`/programs/${program.id}`}
        className="block bg-white rounded-lg shadow p-6 transition hover:shadow-md"
      >
        {/* 상단 뱃지 영역 */}
        <div className="flex items-center gap-2 mb-3">
          {!hasFormSchema && (
            <span className="px-2 py-0.5 text-xs border border-amber-300 text-amber-700 bg-amber-50 rounded-full">
              양식 준비 중
            </span>
          )}
          {isDeadlinePassed ? (
            <span className="px-2 py-0.5 text-xs border border-red-300 text-red-700 bg-red-50 rounded-full">
              접수 마감
            </span>
          ) : daysRemaining !== null && daysRemaining <= 7 ? (
            // 1주일 이내 마감 - 강조 표시로 시선 유도
            <span className="px-2 py-0.5 text-xs border border-red-300 text-red-700 bg-red-50 rounded-full">
              D-{daysRemaining}
            </span>
          ) : (
            daysRemaining !== null && (
              <span className="px-2 py-0.5 text-xs border border-blue-300 text-blue-700 bg-blue-50 rounded-full">
                D-{daysRemaining}
              </span>
            )
          )}
        </div>

        {/* 기관명 - 있을 때만 */}
        {program.organizations && (
          <p className="text-xs text-gray-500 mb-1">
            {program.organizations.name}
          </p>
        )}

        {/* 제목 - 2줄 넘으면 잘림 (line-clamp-2) */}
        <h2 className="text-lg font-semibold line-clamp-2">{program.title}</h2>

        {/* 설명 - 있으면 2줄까지 미리보기 */}
        {program.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {program.description}
          </p>
        )}

        {/* 마감일 */}
        {deadline && (
          <p className="mt-3 text-xs text-gray-500">
            접수 마감: {deadline.toLocaleDateString('ko-KR')}
          </p>
        )}
      </Link>
    </li>
  );
}

/**
 * 공고가 하나도 없을 때
 */
function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <h2 className="text-lg font-semibold mb-2">
        진행 중인 공고가 없습니다
      </h2>
      <p className="text-sm text-gray-500">
        새로운 공고가 등록되면 이곳에 표시됩니다.
      </p>
    </div>
  );
}