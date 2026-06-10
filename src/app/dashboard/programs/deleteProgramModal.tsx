'use client'

import { useProgramStore } from '@/src/stores/programstore'
import { useDeleteProgram } from '@/src/hooks/usePrograms'

export function DeleteProgramModal() {
  const { isDeleteModalOpen, selectedProgram, closeModal } = useProgramStore()
  const deleteProgram = useDeleteProgram()

  if (!isDeleteModalOpen || !selectedProgram) return null

  async function handleDelete() {
    if (!selectedProgram) return

    try {
      await deleteProgram.mutateAsync(selectedProgram.id)
      closeModal()
    } catch (error) {
      console.error('프로그램 삭제 실패:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg w-full max-w-sm p-6 border"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--gray-100)' }}>
          공고 삭제
        </h2>
        <p className="mb-6" style={{ color: 'var(--gray-400)' }}>
          <span style={{ color: 'var(--gray-200)' }}>{selectedProgram.title}</span> 공고를 삭제하시겠습니까?
          <br />
          <span className="text-sm" style={{ color: 'var(--accent-rose)' }}>이 작업은 되돌릴 수 없습니다.</span>
        </p>

        {deleteProgram.error && (
          <p className="text-sm mb-4" style={{ color: 'var(--accent-rose)' }}>
            오류: {deleteProgram.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 border rounded-md transition"
            style={{ borderColor: 'var(--navy-600)', color: 'var(--gray-300)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--navy-800)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProgram.isPending}
            className="px-4 py-2 text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-rose)' }}
          >
            {deleteProgram.isPending ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
