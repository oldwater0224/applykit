"use client";

import { useEffect } from "react";
import {
  useChecklistEditorStore,
  calcMaxTotal,
} from "@/src/stores/checklistEditorStore";
import { useChecklist, useUpsertChecklist } from "@/src/hooks/useReviews";
import type { ChecklistItem } from "@/src/types/review";

interface ChecklistEditorProps {
  programId: string;
}

/**
 * 체크리스트 편집 UI
 * - 프로그램 상세 페이지의 "심사" 탭에서 사용 (Day 5에 통합)
 * - Option 2 패턴: 편집은 Zustand 스토어, 저장은 명시적 버튼
 * - 검증: UI에서 1차, Server Action(upsertChecklist)에서 2차
 */
export function ChecklistEditor({ programId }: ChecklistEditorProps) {
  const { data: checklist, isLoading } = useChecklist(programId);
  const upsertMutation = useUpsertChecklist();

  const items = useChecklistEditorStore((s) => s.items);
  const passingScore = useChecklistEditorStore((s) => s.passingScore);
  const isDirty = useChecklistEditorStore((s) => s.isDirty);
  const initChecklist = useChecklistEditorStore((s) => s.initChecklist);
  const addItem = useChecklistEditorStore((s) => s.addItem);
  const updateItem = useChecklistEditorStore((s) => s.updateItem);
  const removeItem = useChecklistEditorStore((s) => s.removeItem);
  const setPassingScore = useChecklistEditorStore((s) => s.setPassingScore);
  const markSaved = useChecklistEditorStore((s) => s.markSaved);

  // DB에서 로드한 체크리스트를 스토어에 주입
  // programId가 바뀌면 다시 로드 - 다른 프로그램 체크리스트로 덮어씌우기 방지
  // isLoading 조건: 로딩 중일 때는 초기화하지 않아 이전 값 유지 → 깜빡임 방지
  useEffect(() => {
    if (!isLoading) {
      initChecklist(checklist ?? null);
    }
  }, [checklist, isLoading, initChecklist, programId]);

  const maxTotal = calcMaxTotal(items);

  // 새 항목 id 생성 - crypto.randomUUID는 모던 브라우저 지원
  // 클릭 시점(클라이언트)에 생성하므로 SSR 하이드레이션 이슈 없음
  function handleAddItem() {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: "새 항목",
      max_score: 10,
    };
    addItem(newItem);
  }

  // UI 단 검증 - Server Action에서도 동일 검증 돌지만 UX 위해 즉각 피드백
  function getValidationError(): string | null {
    if (items.length === 0) {
      return "체크리스트 항목이 1개 이상 필요합니다.";
    }
    if (items.some((i) => !i.label.trim())) {
      return "모든 항목에 이름을 입력해주세요.";
    }
    if (items.some((i) => i.max_score <= 0)) {
      return "모든 항목의 배점은 1 이상이어야 합니다.";
    }
    if (passingScore < 0) {
      return "합격 기준점은 0 이상이어야 합니다.";
    }
    if (passingScore > maxTotal) {
      return `합격 기준점(${passingScore})이 만점(${maxTotal})보다 큽니다.`;
    }
    if (items.some((i) => i.max_score > 100)) {
      return "한 항목의 배점은 100점 이하여야 합니다.";
    }
    if (passingScore < 0) {
      return "합격 기준점은 0 이상이어야 합니다.";
    }
    if (passingScore > maxTotal) {
      return `합격 기준점(${passingScore})이 만점(${maxTotal})보다 큽니다.`;
    }
    return null;
  }

  async function handleSave() {
    const err = getValidationError();
    if (err) {
      alert(err);
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        program_id: programId,
        items,
        passing_score: passingScore,
      });
      // 저장 성공 - isDirty 리셋 (formbuilderstore와 동일 패턴)
      // invalidate로 useChecklist가 refetch하면 initChecklist가 다시 돌아
      // isDirty: false로 설정되긴 하지만, 그 사이 시간차를 없애기 위해 즉시 호출
      markSaved();
    } catch (e) {
      console.error("[ChecklistEditor.handleSave]", e);
      // 에러는 mutation.error로 surface 됨 - 아래 에러 박스에서 표시
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold">심사 체크리스트</h2>
        <p className="text-sm mt-1">
          항목별 배점을 정하고, 합격 기준점을 설정하세요.
        </p>
      </header>

      {/* 항목 리스트 */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <ChecklistItemRow
            key={item.id}
            index={idx}
            item={item}
            onChange={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
          />
        ))}

        {items.length === 0 && (
          <div className="p-6 border border-dashed rounded-md text-sm text-center">
            아직 항목이 없습니다. 아래 버튼으로 항목을 추가하세요.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-2 border border-dashed rounded-md text-sm"
      >
        + 항목 추가
      </button>

      {/* 합격 기준점 + 만점 요약 */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">만점</span>
          <span className="text-sm">{maxTotal}점</span>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="passing-score" className="text-sm font-medium">
            합격 기준점
          </label>
          <div className="flex items-center gap-2">
            <input
              id="passing-score"
              type="number"
              min={0}
              max={maxTotal}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value) || 0)}
              className="w-24 px-2 py-1 border rounded-md text-right"
            />
            <span className="text-sm">점 이상</span>
          </div>
        </div>
      </div>

      {/* 저장 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || upsertMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {upsertMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>

      {upsertMutation.error && (
        <div className="p-3 border border-red-300 rounded-md bg-red-50 text-sm text-red-700">
          {upsertMutation.error instanceof Error
            ? upsertMutation.error.message
            : "저장 중 오류가 발생했습니다."}
        </div>
      )}
    </div>
  );
}

// 개별 항목 행 - label + max_score + 삭제
// 단독 추출한 이유: items.map 안의 로직이 길어지면 가독성 떨어지고
//                 label/max_score 변경이 부모 컴포넌트를 리렌더해서 성능 영향 있음
function ChecklistItemRow({
  index,
  item,
  onChange,
  onRemove,
}: {
  index: number;
  item: ChecklistItem;
  onChange: (patch: Partial<Omit<ChecklistItem, "id">>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-6 text-right">{index + 1}.</span>

      <input
        type="text"
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="예: 팀 구성 및 역량"
        className="flex-1 px-3 py-2 border rounded-md text-sm"
      />

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          max={100}
          value={item.max_score}
          onChange={(e) => onChange({ max_score: Number(e.target.value) || 0 })}
          className="w-20 px-2 py-2 border rounded-md text-sm text-right"
        />
        <span className="text-sm">점</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md"
        aria-label={`${index + 1}번 항목 삭제`}
      >
        삭제
      </button>
    </div>
  );
}
