import type { ChecklistItem } from "@/src/types/review";

export function calculateTotalScore(
  items: ChecklistItem[],
  scores: Record<string, number>,
): number {
  return items.reduce((sum, item) => {
    const score = scores[item.id];
    if (typeof score !== "number" || score < 0) return sum;
    return sum + Math.min(score, item.max_score);
  }, 0);
}
