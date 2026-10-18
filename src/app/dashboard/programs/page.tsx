"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { usePrograms } from "@/src/hooks/usePrograms";
import { useProgramStore } from "@/src/stores/programstore";
import { useAuth } from "@/src/hooks/useAuth";
import { Program } from "@/src/types/program";
import { CreateProgramModal } from "./createProgramModal";
import { EditProgramModal } from "./editProgramModal";
import { DeleteProgramModal } from "./deleteProgramModal";
import { DashboardPageHeader } from "@/src/components/dashboard/pageHeader";
import { DashboardPanel } from "@/src/components/dashboard/dashboardPanel";
import {
  DataTable,
  type DataTableColumn,
} from "@/src/components/dashboard/dataTable";
import { ProgramStatusBadge } from "@/src/components/dashboard/statusBadge";
import {
  formatDeadline,
  formatKstIso,
} from "@/src/components/dashboard/formatters";

export default function ProgramsPage() {
  const { isAuthenticated } = useAuth();
  const { data: programs, error } = usePrograms();
  const { openCreateModal, openEditModal, openDeleteModal } = useProgramStore();

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="size-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  // 데이터도 에러도 없으면 로딩 (orgId 대기로 쿼리가 비활성인 동안 포함 — 홈과 같은 규칙)
  const isLoading = programs === undefined && !error;
  const programList = (Array.isArray(programs) ? programs : []).filter(
    (p): p is Program => Boolean(p?.id)
  );

  const columns: DataTableColumn<Program>[] = [
    {
      key: "title",
      header: "공고명",
      primary: true,
      cell: (p) => (
        <span className="block min-w-0">
          <span className="line-clamp-1 break-all">{p.title || "제목 없음"}</span>
          {p.description && (
            <span className="mt-0.5 line-clamp-1 text-xs sm:text-[11px] font-normal break-all text-(--dash-text-subtle)">
              {p.description}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "92px",
      cell: (p) => <ProgramStatusBadge status={p.status} />,
    },
    {
      key: "deadline",
      header: "마감일",
      nowrap: true,
      width: "148px",
      cell: (p) => (
        <span className="tabular-nums">
          {formatDeadline(p.deadline, { withYear: true })}
        </span>
      ),
    },
    {
      key: "created",
      header: "생성일",
      nowrap: true,
      width: "104px",
      cell: (p) => (
        <time
          dateTime={p.created_at}
          className="tabular-nums text-(--dash-text-muted)"
        >
          {formatKstIso(p.created_at, { withYear: true })}
        </time>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">관리</span>,
      align: "right",
      width: "132px",
      nowrap: true,
      cell: (p) => (
        <div className="flex justify-end gap-1.5">
          <RowActionButton
            onClick={() => openEditModal(p)}
            label={`${p.title || "제목 없음"} 공고 수정`}
          >
            <Pencil className="size-3" aria-hidden />
            수정
          </RowActionButton>
          <RowActionButton
            onClick={() => openDeleteModal(p)}
            label={`${p.title || "제목 없음"} 공고 삭제`}
            danger
          >
            <Trash2 className="size-3" aria-hidden />
            삭제
          </RowActionButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="공고 관리"
        subtitle="공고를 눌러 지원 양식과 접수 현황을 확인합니다"
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-8 items-center gap-1 rounded-md bg-(--brand-600) px-3 text-[12px] font-semibold text-white transition-colors hover:bg-(--brand-500) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)"
          >
            <Plus className="size-3.5" aria-hidden />새 공고
          </button>
        }
      />

      <div className="mx-auto w-full max-w-(--max-width) p-4 lg:p-6">
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-(--accent-rose)/30 bg-(--accent-rose)/[0.06] px-6 py-10 text-center text-[13px] text-(--dash-negative-text)"
          >
            에러: {error.message}
          </div>
        ) : (
          <DashboardPanel
            title="전체 공고"
            meta={isLoading ? undefined : `${programList.length.toLocaleString("ko-KR")}개`}
            description="생성일 최신순 · 행을 누르면 공고 상세(양식 편집)로 이동"
            flush
          >
            <DataTable
              caption="공고 목록"
              columns={columns}
              rows={programList}
              getRowKey={(p) => p.id}
              getRowHref={(p) => `/dashboard/programs/${p.id}`}
              loading={isLoading}
              minWidth="640px"
              emptyMessage={
                <>
                  등록된 공고가 없습니다.{" "}
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="font-medium text-(--dash-active-text) underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-(--brand-500)"
                  >
                    첫 번째 공고 만들기
                  </button>
                </>
              }
            />
          </DashboardPanel>
        )}
      </div>

      <CreateProgramModal />
      <EditProgramModal />
      <DeleteProgramModal />
    </div>
  );
}

/** 행 안의 관리 버튼 — DataTable이 button 클릭은 행 이동에서 제외함 */
function RowActionButton({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        danger
          ? "flex h-7 items-center gap-1 rounded-md border border-(--accent-rose)/40 px-2 text-[12px] font-medium text-(--dash-negative-text) transition-colors hover:bg-(--accent-rose)/10 focus-visible:outline-2 focus-visible:outline-(--brand-500)"
          : "flex h-7 items-center gap-1 rounded-md border border-(--dash-border) px-2 text-[12px] font-medium text-(--dash-text-secondary) transition-colors hover:bg-(--dash-hover-bg) hover:text-(--dash-text) focus-visible:outline-2 focus-visible:outline-(--brand-500)"
      }
    >
      {children}
    </button>
  );
}
