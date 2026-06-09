"use client";

// ============================================================
// src/app/programs/page.tsx
// 프로그램(공고) 목록 — 새 디자인 + 검색
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePublicPrograms } from "@/src/hooks/usePrograms";
import type { Program } from "@/src/types/program";

export default function ProgramsContent() {
  const searchParams = useSearchParams();
  const companyParam = searchParams.get("company");
  const { data: programs, isLoading, error } = usePublicPrograms();
  const [search, setSearch] = useState("");

  const filtered = (programs ?? []).filter((p: Program) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.organizations?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-high"
        style={{color : "#fff"}}>
          지원하기
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          스타트업 지원 프로그램에 지원하세요
        </p>
      </div>

      {/* 기업 상세에서 진입한 경우 안내 */}
      {companyParam && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            기업 프로필에서 이동했습니다. 아래 프로그램 중 원하는 공고를 선택하여
            지원하세요.
          </p>
        </div>
      )}

      {/* 검색 */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="프로그램명, 기관명으로 검색..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-md text-white"
        />
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="py-20 text-center text-red-500">
          공고 목록을 불러오지 못했습니다.
        </div>
      )}

      {/* 프로그램 목록 */}
      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white">
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  {search
                    ? `"${search}" 검색 결과가 없습니다.`
                    : "진행 중인 공고가 없습니다."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((program: Program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  companyId={companyParam}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProgramCard({
  program,
  companyId,
}: {
  program: Program;
  companyId: string | null;
}) {
  const now = new Date();
  const deadline = program.deadline ? new Date(program.deadline) : null;
  const isDeadlinePassed = deadline !== null && deadline < now;
  const daysRemaining =
    deadline !== null
      ? Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const hasFormSchema =
    program.form_schema && program.form_schema.fields.length > 0;

  // companyId가 있으면 지원 링크에 쿼리 파라미터 추가
  const href = companyId
    ? `/programs/${program.id}?company=${companyId}`
    : `/programs/${program.id}`;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-gray-200  p-6 transition-all hover:border-blue-300 hover:shadow-md"
    >
      {/* 뱃지 */}
      <div className="mb-3 flex items-center gap-2">
        {!hasFormSchema && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            양식 준비 중
          </span>
        )}
        {isDeadlinePassed ? (
          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700">
            접수 마감
          </span>
        ) : daysRemaining !== null && daysRemaining <= 7 ? (
          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700">
            D-{daysRemaining}
          </span>
        ) : daysRemaining !== null ? (
          <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            D-{daysRemaining}
          </span>
        ) : null}
      </div>

      {/* 기관명 */}
      {program.organizations && (
        <p className="mb-1 text-xs text-gray-500">
          {program.organizations.name}
        </p>
      )}

      {/* 제목 */}
      <h2 className="line-clamp-2 text-lg font-semibold text-gray-100">
        {program.title}
      </h2>

      {/* 설명 */}
      {program.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
          {program.description}
        </p>
      )}

      {/* 마감일 */}
      {deadline && (
        <p className="mt-3 text-xs text-gray-400">
          접수 마감: {deadline.toLocaleDateString("ko-KR")}
        </p>
      )}
    </Link>
  );
}