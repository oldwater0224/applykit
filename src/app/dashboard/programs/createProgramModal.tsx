'use client'

import { useState } from 'react'
import { useProgramStore } from '@/src/stores/programstore'
import { useCreateProgram } from '@/src/hooks/usePrograms'

const modalInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--navy-800)',
  borderColor: 'var(--navy-600)',
  color: 'var(--gray-100)',
}

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
      <div
        className="rounded-lg w-full max-w-md p-6 border"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--gray-100)' }}>
          새 공고 만들기
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-300)' }}>
              공고 제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-(--brand-500)"
              style={modalInputStyle}
              placeholder="스타트업 지원 프로그램"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-300)' }}>
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
              placeholder="프로그램에 대한 간단한 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-300)' }}>
              마감일
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-300)' }}>
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            >
              <option value="draft">작성 중</option>
              <option value="active">모집 중</option>
              <option value="closed">마감</option>
            </select>
          </div>

          {createProgram.error && (
            <p className="text-sm" style={{ color: 'var(--accent-rose)' }}>
              오류: {createProgram.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded-md transition"
              style={{ borderColor: 'var(--navy-600)', color: 'var(--gray-300)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--navy-800)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createProgram.isPending}
              className="px-4 py-2 text-white rounded-md disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-600)' }}
            >
              {createProgram.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
