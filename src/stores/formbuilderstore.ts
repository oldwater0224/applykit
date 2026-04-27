import { create } from "zustand";
import { FormField, FormSchema, DEFAULT_FORM_SCHEMA } from "@/src/types/form";

interface FormBuilderStore {
  schema: FormSchema;
  selectedFieldId: string | null;
  isDirty: boolean;

  // 스키마 초기화
  initSchema: (schema: FormSchema | null) => void;

  // 필드 CRUD
  addField: (field: FormField) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  removeField: (id: string) => void;

  // 순서 변경
  moveField: (fromIndex: number, toIndex: number) => void;

  // 선택
  selectField: (id: string | null) => void;

  // 저장 상태
  markSaved: () => void;

  
  // 한 폼에서 isCompanyName=true는 하나의 필드만 가능
  // 운영기관이 한 필드를 회사명으로 지정하면 다른 필드는 자동 해제
  setCompanyNameField: (id: string, isCompanyName: boolean) => void;
}

export const useFormBuilderStore = create<FormBuilderStore>((set) => ({
  schema: DEFAULT_FORM_SCHEMA,
  selectedFieldId: null,
  isDirty: false,

  initSchema: (schema) =>
    set({
      schema: schema || DEFAULT_FORM_SCHEMA,
      selectedFieldId: null,
      isDirty: false,
    }),

  addField: (field) =>
    set((state) => ({
      schema: {
        ...state.schema,
        fields: [...state.schema.fields, field],
      },
      selectedFieldId: field.id,
      isDirty: true,
    })),

  updateField: (id, updates) =>
    set((state) => ({
      schema: {
        ...state.schema,
        fields: state.schema.fields.map((f) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
      },
      isDirty: true,
    })),

  removeField: (id) =>
    set((state) => ({
      schema: {
        ...state.schema,
        fields: state.schema.fields.filter((f) => f.id !== id),
      },
      selectedFieldId:
        state.selectedFieldId === id ? null : state.selectedFieldId,
      isDirty: true,
    })),

  moveField: (fromIndex, toIndex) =>
    set((state) => {
      const fields = [...state.schema.fields];
      const [removed] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, removed);
      return {
        schema: { ...state.schema, fields },
        isDirty: true,
      };
    }),

  selectField: (id) => set({ selectedFieldId: id }),

  setCompanyNameField: (id, isCompanyName) =>
    set((state) => {
      // 체크 해제 - 단순히 해당 필드의 플래그만 false로
      if (!isCompanyName) {
        return {
          schema: {
            ...state.schema,
            fields: state.schema.fields.map((f) =>
              f.id === id ? { ...f, isCompanyName: false } : f,
            ),
          },
          isDirty: true,
        };
      }

      // 체크 - 다른 모든 필드의 isCompanyName을 false로 만들면서
      // 지정된 필드만 true로 (한 폼에 단 하나만 회사명 필드)
      return {
        schema: {
          ...state.schema,
          fields: state.schema.fields.map((f) =>
            f.id === id
              ? { ...f, isCompanyName: true }
              : f.isCompanyName
                ? { ...f, isCompanyName: false }
                : f,
          ),
        },
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),
}));
