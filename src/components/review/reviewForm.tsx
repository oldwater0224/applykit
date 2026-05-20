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

/**
 * 체크리스트 기반 심사 평가 폼
 *
 * 상태 3가지:
 * 1. 체크리스트 없음 → 안내 메시지
 * 2. 체크리스트 있음 + 심사 없음 → 신규 작성 (Create)
 * 3. 체크리스트 있음 + 심사 있음 → 기존 값 로드 후 수정 (Update)
 *
 * 설계:
 * - state는 useState (하나의 컴포넌트 소유)
 * - total_score / is_passed는 서버에서 최종 계산
 *   클라이언트에선 useMemo로 실시간 피드백용 계산 (중복 OK, UI 전용)
 * - 저장 로직은 existing 여부로 create/update 분기
 */
export function ReviewForm({ programId, applicationId }: ReviewFormProps) {
  const { data: checklist, isLoading: isChecklistLoading } =
    useChecklist(programId);
  const { data: existingReview, isLoading: isReviewLoading } =
    useReviewByApplication(applicationId);

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  // 폼 로컬 state
  // scores: { [itemId]: 점수 }
  // comment: 심사 코멘트
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  // 초기값 세팅 완료 여부 - existing이 늦게 도착해도 한 번만 초기화
  const [initialized, setInitialized] = useState(false);

  // 기존 심사 결과나 체크리스트가 로드되면 state 초기화
  // - existingReview 있음: 기존 scores + comment 로드
  // - existingReview 없음: 체크리스트 items를 기반으로 scores를 0으로 초기화
  // initialized 플래그로 재초기화 방지 (사용자 입력 덮어쓰기 방지)
  useEffect(() => {
    if (isChecklistLoading || isReviewLoading) return;
    if (initialized) return;
    if (!checklist) return; // 체크리스트 없으면 초기화 자체 불필요

    if (existingReview) {
      // 수정 모드 - 기존 값 로드
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScores(existingReview.scores);
      setComment(existingReview.comment ?? "");
    } else {
      // 신규 모드 - 모든 항목을 0으로 초기화
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

  // 체크리스트가 바뀌면 재초기화 필요 (프로그램 이동 시)
  // applicationId도 바뀌면 재초기화 (심사 이동 시)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialized(false);
  }, [programId, applicationId]);

  // 실시간 총점/합격여부 계산 - 서버 로직과 동일
  // 서버의 calculateTotalScore와 같은 공식: max_score로 클램프
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

  // 점수 업데이트 - 항목별 input onChange에서 호출
  function handleScoreChange(itemId: string, value: number) {
    setScores((prev) => ({ ...prev, [itemId]: value }));
  }

  // UI 단 검증 - Server Action에서도 검증되지만 즉각 피드백
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
        // 수정 - id 필요
        await updateMutation.mutateAsync({
          id: existingReview.id,
          input: {
            scores,
            comment: comment.trim() || undefined,
          },
        });
      } else {
        // 신규 생성
        await createMutation.mutateAsync({
          application_id: applicationId,
          scores,
          comment: comment.trim() || undefined,
        });
      }
      // 성공 시 useReviewByApplication이 invalidate되어 refetch
      // initialized는 그대로 true 유지 - 사용자가 계속 편집할 수 있음
    } catch (e) {
      console.error("[ReviewForm.handleSave]", e);
      // 에러는 mutation.error로 surface
    }
  }

  // === 렌더링 분기 ===

  if (isChecklistLoading || isReviewLoading) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-center">심사 정보 로딩 중...</p>
      </section>
    );
  }

  // 상태 1: 체크리스트 없음
  if (!checklist) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">심사</h2>
        <div className="p-6 border border-dashed rounded-md text-sm text-center">
          <p>이 공고의 체크리스트가 아직 설정되지 않았습니다.</p>
          <p className="mt-1">
            공고의 <b>심사</b> 탭에서 체크리스트를 먼저 만들어주세요.
          </p>
        </div>
      </section>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;
  const isEditMode = !!existingReview;

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-6">
      <header>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">심사</h2>
          {isEditMode && existingReview?.reviewed_at && (
            <span className="text-xs text-gray-500">
              최종 심사:{" "}
              {new Date(existingReview.reviewed_at).toLocaleString("ko-KR")}
            </span>
          )}
        </div>
        <p className="text-sm mt-1">
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
        />
      </div>

      {/* 총점 + 합격 여부 요약 */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">합계</span>
          <span className="text-sm">
            {totalScore} / {checklist.items.reduce((s, i) => s + i.max_score, 0)}점
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">합격 기준점</span>
          <span className="text-sm">{checklist.passing_score}점 이상</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">판정</span>
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
      <div className="flex justify-end border-t pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "저장 중..."
            : isEditMode
              ? "심사 수정"
              : "심사 저장"}
        </button>
      </div>

      {mutationError && (
        <div className="p-3 border border-red-300 rounded-md bg-red-50 text-sm text-red-700">
          {mutationError instanceof Error
            ? mutationError.message
            : "저장 중 오류가 발생했습니다."}
        </div>
      )}
    </section>
  );
}

/**
 * 개별 점수 입력 행 - label + input + max_score 표시
 * 별도 컴포넌트로 분리한 이유:
 * - 행이 많아져도 가독성 유지
 * - 개별 input 변경이 상위 리렌더 범위 축소
 */
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
      <span className="text-sm w-6 text-right">{index + 1}.</span>

      <span className="flex-1 text-sm">{item.label}</span>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={item.max_score}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-20 px-2 py-1.5 border rounded-md text-sm text-right"
        />
        <span className="text-sm w-12">/ {item.max_score}</span>
      </div>
    </div>
  );
}