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
        <h1
          className="text-2xl font-bold tracking-high"
          style={{ color: "var(--gray-100)" }}
        >
          지원하기
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-500)" }}>
          스타트업 지원 프로그램에 지원하세요
        </p>
      </div>

      {/* 기업 상세에서 진입한 경우 안내 */}
      {companyParam && (
        <div
          className="mb-6 rounded-lg border px-4 py-3"
          style={{
            borderColor: "var(--brand-500)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--brand-500)" }}>
            기업 프로필에서 이동했습니다. 아래 프로그램 중 원하는 공고를
            선택하여 지원하세요.
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
          className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--brand-500) sm:max-w-md"
          style={{
            backgroundColor: "var(--navy-800)",
            borderColor: "var(--navy-600)",
            color: "var(--gray-100)",
          }}
        />
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="size-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--brand-500)" }}
          />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div
          className="py-20 text-center"
          style={{ color: "var(--accent-rose)" }}
        >
          로그인 후 이용 가능합니다.
        </div>
      )}

      {/* 프로그램 목록 */}
      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <div
              className="flex h-48 items-center justify-center rounded-lg border border-dashed"
              style={{ borderColor: "var(--navy-600)" }}
            >
              <div className="text-center">
                <p className="text-sm" style={{ color: "var(--gray-500)" }}>
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
      ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const hasFormSchema =
    program.form_schema && program.form_schema.fields.length > 0;

  const href = companyId
    ? `/programs/${program.id}?company=${companyId}`
    : `/programs/${program.id}`;

  return (
    <Link
      href={href}
      className="block rounded-xl border p-6 transition-all"
      style={{ borderColor: "var(--card-border)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--brand-500)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--card-border)")
      }
    >
      {/* 뱃지 */}
      <div className="mb-3 flex items-center gap-2">
        {!hasFormSchema && (
          <span
            className="rounded-full border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--accent-amber)",
              color: "var(--accent-amber)",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
            }}
          >
            양식 준비 중
          </span>
        )}
        {isDeadlinePassed ? (
          <span
            className="rounded-full border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--accent-rose)",
              color: "var(--accent-rose)",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
            }}
          >
            접수 마감
          </span>
        ) : daysRemaining !== null && daysRemaining <= 7 ? (
          <span
            className="rounded-full border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--accent-rose)",
              color: "var(--accent-rose)",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
            }}
          >
            D-{daysRemaining}
          </span>
        ) : daysRemaining !== null ? (
          <span
            className="rounded-full border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--brand-500)",
              color: "var(--brand-500)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
            }}
          >
            D-{daysRemaining}
          </span>
        ) : null}
      </div>

      {/* 기관명 */}
      {program.organizations && (
        <p className="mb-1 text-xs" style={{ color: "var(--gray-500)" }}>
          {program.organizations.name}
        </p>
      )}

      {/* 제목 */}
      <h2
        className="line-clamp-2 text-lg font-semibold"
        style={{ color: "var(--gray-100)" }}
      >
        {program.title}
      </h2>

      {/* 설명 */}
      {program.description && (
        <p
          className="mt-2 line-clamp-2 text-sm"
          style={{ color: "var(--gray-500)" }}
        >
          {program.description}
        </p>
      )}

      {/* 마감일 */}
      {deadline && (
        <p className="mt-3 text-xs" style={{ color: "var(--gray-500)" }}>
          접수 마감: {deadline.toLocaleDateString("ko-KR")}
        </p>
      )}
    </Link>
  );
}
