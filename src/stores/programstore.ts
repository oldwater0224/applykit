import { create } from 'zustand'
import { Program } from '@/src/types/program'

interface ProgramStore {
  // 모달 상태
  isCreateModalOpen: boolean
  isEditModalOpen: boolean
  isDeleteModalOpen: boolean
  
  // 선택된 프로그램
  selectedProgram: Program | null
  
  // 액션
  openCreateModal: () => void
  openEditModal: (program: Program) => void
  openDeleteModal: (program: Program) => void
  closeModal: () => void
}

export const useProgramStore = create<ProgramStore>((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedProgram: null,

  openCreateModal: () => set({ isCreateModalOpen: true }),
  openEditModal: (program) => set({ isEditModalOpen: true, selectedProgram: program }),
  openDeleteModal: (program) => set({ isDeleteModalOpen: true, selectedProgram: program }),
  closeModal: () => set({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    selectedProgram: null,
  }),
}))