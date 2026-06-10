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

const editorInputStyle: React.CSSProperties = {
  backgroundColor: "var(--navy-800)",
  borderColor: "var(--navy-600)",
  color: "var(--gray-100)",
};

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

  useEffect(() => {
    if (!isLoading) {
      initChecklist(checklist ?? null);
    }
  }, [checklist, isLoading, initChecklist, programId]);

  const maxTotal = calcMaxTotal(items);

  function handleAddItem() {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: "새 항목",
      max_score: 10,
    };
    addItem(newItem);
  }

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
      markSaved();
    } catch (e) {
      console.error("[ChecklistEditor.handleSave]", e);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--gray-400)" }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6 space-y-6"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <header>
        <h2 className="text-lg font-semibold" style={{ color: "var(--gray-100)" }}>
          심사 체크리스트
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
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
          <div
            className="p-6 border border-dashed rounded-md text-sm text-center"
            style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
          >
            아직 항목이 없습니다. 아래 버튼으로 항목을 추가하세요.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-2 border border-dashed rounded-md text-sm transition"
        style={{ borderColor: "var(--navy-600)", color: "var(--gray-400)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        + 항목 추가
      </button>

      {/* 합격 기준점 + 만점 요약 */}
      <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--navy-700)" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>만점</span>
          <span className="text-sm" style={{ color: "var(--gray-200)" }}>{maxTotal}점</span>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="passing-score" className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>
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
              style={editorInputStyle}
            />
            <span className="text-sm" style={{ color: "var(--gray-400)" }}>점 이상</span>
          </div>
        </div>
      </div>

      {/* 저장 */}
      <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: "var(--navy-700)" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || upsertMutation.isPending}
          className="px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--brand-600)" }}
        >
          {upsertMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>

      {upsertMutation.error && (
        <div
          className="p-3 border rounded-md text-sm"
          style={{ borderColor: "var(--accent-rose)", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)" }}
        >
          {upsertMutation.error instanceof Error
            ? upsertMutation.error.message
            : "저장 중 오류가 발생했습니다."}
        </div>
      )}
    </div>
  );
}

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
      <span className="text-sm w-6 text-right" style={{ color: "var(--gray-500)" }}>
        {index + 1}.
      </span>

      <input
        type="text"
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="예: 팀 구성 및 역량"
        className="flex-1 px-3 py-2 border rounded-md text-sm"
        style={{ backgroundColor: "var(--navy-800)", borderColor: "var(--navy-600)", color: "var(--gray-100)" }}
      />

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          max={100}
          value={item.max_score}
          onChange={(e) => onChange({ max_score: Number(e.target.value) || 0 })}
          className="w-20 px-2 py-2 border rounded-md text-sm text-right"
          style={{ backgroundColor: "var(--navy-800)", borderColor: "var(--navy-600)", color: "var(--gray-100)" }}
        />
        <span className="text-sm" style={{ color: "var(--gray-400)" }}>점</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="px-3 py-2 text-sm border rounded-md"
        style={{ borderColor: "var(--accent-rose)", color: "var(--accent-rose)" }}
        aria-label={`${index + 1}번 항목 삭제`}
      >
        삭제
      </button>
    </div>
  );
}
