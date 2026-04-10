'use client'

import { useState } from 'react'
import { useProgramStore } from '@/src/stores/programstore'
import { useCreateProgram } from '@/src/hooks/usePrograms'

export function CreateProgramModal() {
  const { isCreateModalOpen, closeModal } = useProgramStore()
  const createProgram = useCreateProgram()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'draft',
  })

  if (!isCreateModalOpen) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await createProgram.mutateAsync(formData)
      setFormData({
        title: '',
        description: '',
        deadline: '',
        status: 'draft',
      })
      closeModal()
    } catch (error) {
      console.error('프로그램 생성 실패:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">새 공고 만들기</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              공고 제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="스타트업 지원 프로그램"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로그램에 대한 간단한 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              마감일
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">작성 중</option>
              <option value="open">모집 중</option>
              <option value="closed">마감</option>
            </select>
          </div>

          {createProgram.error && (
            <p className="text-red-600 text-sm">
              오류: {createProgram.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createProgram.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createProgram.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}