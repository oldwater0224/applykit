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
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <h2 className="text-xl font-bold mb-2">공고 삭제</h2>
        <p className="text-gray-600 mb-6">
          <span>{selectedProgram.title}</span> 공고를 삭제하시겠습니까?
          <br />
          <span className="text-sm text-red-600">이 작업은 되돌릴 수 없습니다.</span>
        </p>

        {deleteProgram.error && (
          <p className="text-red-600 text-sm mb-4">
            오류: {deleteProgram.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProgram.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleteProgram.isPending ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}