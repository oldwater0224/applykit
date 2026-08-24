import { calculateTotalScore } from "@/src/lib/review/calculateScore";
import type { ChecklistItem } from "@/src/types/review";

describe("calculateTotalScore", () => {
  const items: ChecklistItem[] = [
    { id: "team", label: "팀 역량", max_score: 30 },
    { id: "tech", label: "기술력", max_score: 25 },
    { id: "market", label: "시장성", max_score: 20 },
  ];

  it("정상 점수를 합산한다", () => {
    const scores = { team: 25, tech: 20, market: 15 };
    expect(calculateTotalScore(items, scores)).toBe(60);
  });

  it("만점을 계산한다", () => {
    const scores = { team: 30, tech: 25, market: 20 };
    expect(calculateTotalScore(items, scores)).toBe(75);
  });

  it("모두 0점이면 0을 반환한다", () => {
    const scores = { team: 0, tech: 0, market: 0 };
    expect(calculateTotalScore(items, scores)).toBe(0);
  });

  it("max_score를 초과하면 클램프한다", () => {
    const scores = { team: 100, tech: 50, market: 999 };
    expect(calculateTotalScore(items, scores)).toBe(30 + 25 + 20);
  });

  it("음수 점수는 무시한다", () => {
    const scores = { team: -5, tech: 20, market: 15 };
    expect(calculateTotalScore(items, scores)).toBe(35);
  });

  it("scores에 없는 항목은 무시한다", () => {
    const scores = { team: 25 };
    expect(calculateTotalScore(items, scores)).toBe(25);
  });

  it("scores에 노이즈 키가 있어도 무시한다", () => {
    const scores = { team: 10, tech: 10, market: 10, hacked: 999 };
    expect(calculateTotalScore(items, scores)).toBe(30);
  });

  it("문자열 값은 무시한다", () => {
    const scores = { team: "20" as unknown as number, tech: 10, market: 5 };
    expect(calculateTotalScore(items, scores)).toBe(15);
  });

  it("빈 items면 0을 반환한다", () => {
    expect(calculateTotalScore([], { team: 100 })).toBe(0);
  });

  it("빈 scores면 0을 반환한다", () => {
    expect(calculateTotalScore(items, {})).toBe(0);
  });
});
