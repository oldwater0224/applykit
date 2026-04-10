'use client'

import { usePrograms } from '@/src/hooks/usePrograms'
import { useProgramStore } from '@/src/stores/programstore'
import { useAuth } from '@/src/hooks/useAuth'
import { Program } from '@/src/types/program'
import Link from 'next/link'
import { CreateProgramModal } from './createProgramModal'
import { EditProgramModal } from './editProgramModal'
import { DeleteProgramModal } from './deleteProgramModal'

export default function ProgramsPage() {
  const { isAuthenticated } = useAuth()
  const { data: programs, isLoading, error } = usePrograms()
  const { openCreateModal, openEditModal, openDeleteModal } = useProgramStore()

  if (!isAuthenticated) {
    return <div className="p-8">로딩 중...</div>
  }

  if (isLoading) {
    return <div className="p-8">프로그램 목록을 불러오는 중...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">에러: {error.message}</div>
  }

  // programs가 없거나 빈 배열이면 빈 목록 표시
  const programList = Array.isArray(programs) ? programs : []

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← 대시보드
          </Link>
          <h1 className="text-2xl font-bold mt-2">공고 관리</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + 새 공고 만들기
        </button>
      </div>

      {programList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">등록된 공고가 없습니다.</p>
          <button
            onClick={openCreateModal}
            className="text-blue-600 hover:underline"
          >
            첫 번째 공고 만들기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {programList.map((program) => {
            // 각 항목이 유효한지 체크
            if (!program || !program.id) return null
            
            return (
              <ProgramCard
                key={program.id}
                program={program}
                onEdit={() => openEditModal(program)}
                onDelete={() => openDeleteModal(program)}
              />
            )
          })}
        </div>
      )}

      <CreateProgramModal />
      <EditProgramModal />
      <DeleteProgramModal />
    </div>
  )
}

function ProgramCard({
  program,
  onEdit,
  onDelete,
}: {
  program: Program
  onEdit: () => void
  onDelete: () => void
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    open: 'bg-green-100 text-green-600',
    closed: 'bg-red-100 text-red-600',
  }

  const statusLabels: Record<string, string> = {
    draft: '작성 중',
    open: '모집 중',
    closed: '마감',
  }

  const title = program.title || '제목 없음'
  const status = program.status || 'draft'

  return (
   <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {/* 제목 클릭 시 상세 페이지로 이동 */}
            <Link 
              href={`/dashboard/programs/${program.id}`}
              className="text-lg font-semibold hover:text-blue-600 transition"
            >
              {title}
            </Link>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          {program.description && (
            <p className="text-gray-600 text-sm mb-3">{program.description}</p>
          )}
          {program.deadline && (
            <p className="text-sm text-gray-500">
              마감: {new Date(program.deadline).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* 양식 편집 버튼 추가 */}
          <Link
            href={`/dashboard/programs/${program.id}`}
            className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50"
          >
            양식 편집
          </Link>
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

  )
}