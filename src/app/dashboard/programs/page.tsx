"use client";

import { usePrograms } from "@/src/hooks/usePrograms";
import { useProgramStore } from "@/src/stores/programstore";
import { useAuth } from "@/src/hooks/useAuth";
import { Program } from "@/src/types/program";
import Link from "next/link";
import { CreateProgramModal } from "./createProgramModal";
import { EditProgramModal } from "./editProgramModal";
import { DeleteProgramModal } from "./deleteProgramModal";
import { DashboardPageHeader } from "@/src/components/dashboard/pageHeader";

export default function ProgramsPage() {
  const { isAuthenticated } = useAuth();
  const { data: programs, isLoading, error } = usePrograms();
  const { openCreateModal, openEditModal, openDeleteModal } = useProgramStore();

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--brand-500)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-[13px]" style={{ color: "var(--accent-rose)" }}>
        에러: {error.message}
      </div>
    );
  }

  const programList = Array.isArray(programs) ? programs : [];

  return (
    <div>
      <DashboardPageHeader
        backHref="/dashboard"
        backLabel="← 대시보드"
        title="공고 관리"
        actions={
          <button
            onClick={openCreateModal}
            className="rounded-md px-3.5 py-1.5 text-[12px] font-medium text-white transition"
            style={{ backgroundColor: "var(--brand-600)" }}
          >
            + 새 공고
          </button>
        }
      />

      <div className="p-6">
        {programList.length === 0 ? (
          <div
            className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed"
            style={{ borderColor: "var(--gray-300)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--gray-400)" }}>
              등록된 공고가 없습니다
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 text-[12px] font-medium"
              style={{ color: "var(--brand-600)" }}
            >
              첫 번째 공고 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {programList.map((program) => {
              if (!program?.id) return null;
              return (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onEdit={() => openEditModal(program)}
                  onDelete={() => openDeleteModal(program)}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateProgramModal />
      <EditProgramModal />
      <DeleteProgramModal />
    </div>
  );
}

function ProgramCard({
  program,
  onEdit,
  onDelete,
}: {
  program: Program;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: "var(--gray-500)", color: "var(--gray-600)", label: "작성 중" },
    active: { bg: "var(--gray-500)", color: "var(--accent-emerald)", label: "모집 중" },
    closed: { bg: "var(--gray-500)", color: "var(--accent-rose)", label: "마감" },
  };

  const s = statusStyle[program.status || "draft"] ?? statusStyle.draft;

  return (
    <div
      className="rounded-lg border p-4 transition hover:shadow-sm"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/programs/${program.id}`}
              className="text-[14px] font-semibold transition hover:underline"
              style={{ color: "var(--gray-200)" }}
            >
              {program.title || "제목 없음"}
            </Link>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.label}
            </span>
          </div>
          {program.description && (
            <p className="mt-1 line-clamp-1 text-[12px]" style={{ color: "var(--gray-500)" }}>
              {program.description}
            </p>
          )}
          {program.deadline && (
            <p className="mt-1 text-[11px]" style={{ color: "var(--gray-400)" }}>
              마감: {new Date(program.deadline).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>
        <div className="ml-4 flex shrink-0 gap-1.5">
          <Link
            href={`/dashboard/programs/${program.id}`}
            className="rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:shadow-sm"
            style={{ borderColor: "var(--brand-500)", color: "var(--brand-600)" }}
          >
            양식 편집
          </Link>
          <button
            onClick={onEdit}
            className="rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:shadow-sm"
            style={{ borderColor: "var(--gray-200)", color: "var(--gray-300)" }}
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:shadow-sm"
            style={{ borderColor: "var(--accent-rose)", color: "var(--accent-rose)" }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}