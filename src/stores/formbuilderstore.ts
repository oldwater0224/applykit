import { create } from 'zustand'
import { FormField, FormSchema, DEFAULT_FORM_SCHEMA } from '@/src/types/form'

interface FormBuilderStore {
  schema: FormSchema
  selectedFieldId: string | null
  isDirty: boolean
  
  // 스키마 초기화
  initSchema: (schema: FormSchema | null) => void
  
  // 필드 CRUD
  addField: (field: FormField) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  removeField: (id: string) => void
  
  // 순서 변경
  moveField: (fromIndex: number, toIndex: number) => void
  
  // 선택
  selectField: (id: string | null) => void
  
  // 저장 상태
  markSaved: () => void
}

export const useFormBuilderStore = create<FormBuilderStore>((set) => ({
  schema: DEFAULT_FORM_SCHEMA,
  selectedFieldId: null,
  isDirty: false,

  initSchema: (schema) => set({
    schema: schema || DEFAULT_FORM_SCHEMA,
    selectedFieldId: null,
    isDirty: false,
  }),

  addField: (field) => set((state) => ({
    schema: {
      ...state.schema,
      fields: [...state.schema.fields, field],
    },
    selectedFieldId: field.id,
    isDirty: true,
  })),

  updateField: (id, updates) => set((state) => ({
    schema: {
      ...state.schema,
      fields: state.schema.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    },
    isDirty: true,
  })),

  removeField: (id) => set((state) => ({
    schema: {
      ...state.schema,
      fields: state.schema.fields.filter((f) => f.id !== id),
    },
    selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    isDirty: true,
  })),

  moveField: (fromIndex, toIndex) => set((state) => {
    const fields = [...state.schema.fields]
    const [removed] = fields.splice(fromIndex, 1)
    fields.splice(toIndex, 0, removed)
    return {
      schema: { ...state.schema, fields },
      isDirty: true,
    }
  }),

  selectField: (id) => set({ selectedFieldId: id }),

  markSaved: () => set({ isDirty: false }),
}))