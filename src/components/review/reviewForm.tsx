"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useChecklist,
  useReviewByApplication,
  useCreateReview,
  useUpdateReview,
} from "@/src/hooks/useReviews";
import type { ChecklistItem  } from "@/src/types/review";
import {
  REVIEW_RESULT_LABEL,
  REVIEW_RESULT_STYLE,
} from "@/src/types/review";

interface ReviewFormProps {
  programId: string;
  applicationId: string;
}

const reviewInputStyle: React.CSSProperties = {
  backgroundColor: "var(--navy-800)",
  borderColor: "var(--navy-600)",
  color: "var(--gray-100)",
};

export function ReviewForm({ programId, applicationId }: ReviewFormProps) {
  const { data: checklist, isLoading: isChecklistLoading } =
    useChecklist(programId);
  const { data: existingReview, isLoading: isReviewLoading } =
    useReviewByApplication(applicationId);

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isChecklistLoading || isReviewLoading) return;
    if (initialized) return;
    if (!checklist) return;

    if (existingReview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScores(existingReview.scores);
      setComment(existingReview.comment ?? "");
    } else {
      const initial: Record<string, number> = {};
      for (const item of checklist.items) {
        initial[item.id] = 0;
      }
      setScores(initial);
      setComment("");
    }
    setInitialized(true);
  }, [
    checklist,
    existingReview,
    isChecklistLoading,
    isReviewLoading,
    initialized,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialized(false);
  }, [programId, applicationId]);

  const { totalScore, isPassed } = useMemo(() => {
    if (!checklist) return { totalScore: 0, isPassed: false };
    const total = checklist.items.reduce((sum, item) => {
      const s = scores[item.id];
      if (typeof s !== "number" || s < 0) return sum;
      return sum + Math.min(s, item.max_score);
    }, 0);
    return {
      totalScore: total,
      isPassed: total >= checklist.passing_score,
    };
  }, [checklist, scores]);

  function handleScoreChange(itemId: string, value: number) {
    setScores((prev) => ({ ...prev, [itemId]: value }));
  }

  function getValidationError(): string | null {
    if (!checklist) return null;
    for (const item of checklist.items) {
      const s = scores[item.id];
      if (typeof s !== "number" || isNaN(s)) {
        return `"${item.label}" 항목에 점수를 입력해주세요.`;
      }
      if (s < 0) {
        return `"${item.label}" 점수는 0 이상이어야 합니다.`;
      }
      if (s > item.max_score) {
        return `"${item.label}" 점수가 배점(${item.max_score})을 초과합니다.`;
      }
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
      if (existingReview) {
        await updateMutation.mutateAsync({
          id: existingReview.id,
          input: {
            scores,
            comment: comment.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          application_id: applicationId,
          scores,
          comment: comment.trim() || undefined,
        });
      }
    } catch (e) {
      console.error("[ReviewForm.handleSave]", e);
    }
  }

  // === 렌더링 분기 ===

  if (isChecklistLoading || isReviewLoading) {
    return (
      <section
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm text-center" style={{ color: "var(--gray-400)" }}>
          심사 정보 로딩 중...
        </p>
      </section>
    );
  }

  if (!checklist) {
    return (
      <section
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--gray-100)" }}>심사</h2>
        <div
          className="p-6 border border-dashed rounded-md text-sm text-center"
          style={{ borderColor: "var(--navy-600)", color: "var(--gray-500)" }}
        >
          <p>이 공고의 체크리스트가 아직 설정되지 않았습니다.</p>
          <p className="mt-1">
            공고의 <b style={{ color: "var(--gray-300)" }}>심사</b> 탭에서 체크리스트를 먼저 만들어주세요.
          </p>
        </div>
      </section>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;
  const isEditMode = !!existingReview;

  return (
    <section
      className="rounded-lg border p-6 space-y-6"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <header>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--gray-100)" }}>심사</h2>
          {isEditMode && existingReview?.reviewed_at && (
            <span className="text-xs" style={{ color: "var(--gray-500)" }}>
              최종 심사:{" "}
              {new Date(existingReview.reviewed_at).toLocaleString("ko-KR")}
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
          체크리스트 항목별로 점수를 입력하세요. 저장 시 합격 여부가
          확정됩니다.
        </p>
      </header>

      {/* 항목별 점수 입력 */}
      <div className="space-y-4">
        {checklist.items.map((item, idx) => (
          <ScoreInputRow
            key={item.id}
            index={idx}
            item={item}
            value={scores[item.id] ?? 0}
            onChange={(v) => handleScoreChange(item.id, v)}
          />
        ))}
      </div>

      {/* 코멘트 */}
      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--gray-300)" }}
        >
          코멘트 (선택)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="심사 사유나 참고사항을 기록하세요."
          className="w-full px-3 py-2 border rounded-md text-sm"
          style={reviewInputStyle}
        />
      </div>

      {/* 총점 + 합격 여부 요약 */}
      <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--navy-700)" }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>합계</span>
          <span className="text-sm" style={{ color: "var(--gray-200)" }}>
            {totalScore} / {checklist.items.reduce((s, i) => s + i.max_score, 0)}점
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>합격 기준점</span>
          <span className="text-sm" style={{ color: "var(--gray-200)" }}>
            {checklist.passing_score}점 이상
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>판정</span>
          <span
            className={`px-3 py-1 text-sm border rounded-full ${
              REVIEW_RESULT_STYLE[isPassed ? "passed" : "failed"]
            }`}
          >
            {REVIEW_RESULT_LABEL[isPassed ? "passed" : "failed"]}
          </span>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end border-t pt-4" style={{ borderColor: "var(--navy-700)" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--brand-600)" }}
        >
          {isPending
            ? "저장 중..."
            : isEditMode
              ? "심사 수정"
              : "심사 저장"}
        </button>
      </div>

      {mutationError && (
        <div
          className="p-3 border rounded-md text-sm"
          style={{ borderColor: "var(--accent-rose)", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)" }}
        >
          {mutationError instanceof Error
            ? mutationError.message
            : "저장 중 오류가 발생했습니다."}
        </div>
      )}
    </section>
  );
}

function ScoreInputRow({
  index,
  item,
  value,
  onChange,
}: {
  index: number;
  item: ChecklistItem;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-6 text-right" style={{ color: "var(--gray-500)" }}>
        {index + 1}.
      </span>

      <span className="flex-1 text-sm" style={{ color: "var(--gray-200)" }}>
        {item.label}
      </span>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={item.max_score}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-20 px-2 py-1.5 border rounded-md text-sm text-right"
          style={{ backgroundColor: "var(--navy-800)", borderColor: "var(--navy-600)", color: "var(--gray-100)" }}
        />
        <span className="text-sm w-12" style={{ color: "var(--gray-400)" }}>
          / {item.max_score}
        </span>
      </div>
    </div>
  );
}
