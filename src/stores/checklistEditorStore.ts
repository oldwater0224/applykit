"use client";

import { create } from "zustand";
import type { ChecklistItem, ReviewChecklist } from "@/src/types/review";

// 체크리스트 편집 중 상태 관리 스토어
// formbuilderstore와 동일한 패턴:
// - 편집 중에는 로컬 state, 저장 버튼 누를 때 Server Action 호출
// - 저장 성공 시 markSaved()로 isDirty 리셋 (명시적)
// - 자동 저장 없음 - 검증 타이밍을 저장 시점 한 번으로 단순화

interface ChecklistEditorStore {
  items: ChecklistItem[];
  passingScore: number;
  isDirty: boolean;

  // 스키마 초기화 (DB 값 또는 기본값으로)
  // formbuilderstore의 initSchema와 대칭
  initChecklist: (checklist: ReviewChecklist | null) => void;

  // 항목 CRUD
  // id는 호출부에서 생성 (SSR 하이드레이션 안전성)
  addItem: (item: ChecklistItem) => void;
  updateItem: (id: string, updates: Partial<Omit<ChecklistItem, "id">>) => void;
  removeItem: (id: string) => void;

  // 순서 변경 - MVP에선 안 쓰지만 폼 빌더 moveField와 대칭으로 미리 준비
  moveItem: (fromIndex: number, toIndex: number) => void;

  // 합격 기준점
  setPassingScore: (score: number) => void;

  // 저장 상태
  // formbuilderstore의 markSaved와 동일
  markSaved: () => void;
}

// 체크리스트 처음 만들 때 샘플로 보여주는 기본값
// 완전 빈 상태보다 "편집해서 쓰세요" 제공이 UX 좋음
const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "team", label: "팀 구성 및 역량", max_score: 25 },
  { id: "tech", label: "기술/제품 완성도", max_score: 25 },
  { id: "market", label: "시장성", max_score: 25 },
  { id: "biz", label: "사업 계획", max_score: 25 },
];

const DEFAULT_PASSING_SCORE = 70;

export const useChecklistEditorStore = create<ChecklistEditorStore>((set) => ({
  items: [],
  passingScore: 0,
  isDirty: false,

  initChecklist: (checklist) =>
    set(
      checklist
        ? {
            // DB에 체크리스트 있음 - 그대로 로드
            items: checklist.items,
            passingScore: checklist.passing_score,
            isDirty: false,
          }
        : {
            // DB에 없음 - 기본값으로 초기화
            // 기본값은 "변경된 상태"로 표시해 저장 유도
            items: DEFAULT_ITEMS,
            passingScore: DEFAULT_PASSING_SCORE,
            isDirty: true,
          },
    ),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
      isDirty: true,
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      isDirty: true,
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      isDirty: true,
    })),

  moveItem: (fromIndex, toIndex) =>
    set((state) => {
      const items = [...state.items];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      return { items, isDirty: true };
    }),

  setPassingScore: (score) =>
    set({ passingScore: score, isDirty: true }),

  markSaved: () => set({ isDirty: false }),
}));

// 파생 상태 계산 헬퍼 - 컴포넌트에서 selector로 쓰거나 유틸로 쓰거나
// 예: const maxTotal = useChecklistEditorStore((s) => calcMaxTotal(s.items))
export function calcMaxTotal(items: ChecklistItem[]): number {
  return items.reduce((sum, i) => sum + (i.max_score || 0), 0);
}