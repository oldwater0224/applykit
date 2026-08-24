import { detectFundingSignal } from "@/src/lib/dart/disclosureFundingParser";

describe("detectFundingSignal", () => {
  describe("투자 신호 감지", () => {
    it("제3자배정 유상증자를 감지한다", () => {
      const result = detectFundingSignal("제3자배정 방식의 유상증자 결정");
      expect(result).toEqual({ roundName: "유상증자", priority: 3 });
    });

    it("유상증자 제3자배정 (역순)을 감지한다", () => {
      const result = detectFundingSignal("유상증자 결정(제3자배정)");
      expect(result).toEqual({ roundName: "유상증자", priority: 3 });
    });

    it("전환사채 발행을 감지한다", () => {
      const result = detectFundingSignal("전환사채권 발행 결정");
      expect(result).toEqual({ roundName: "CB", priority: 2 });
    });

    it("신주인수권부사채를 감지한다", () => {
      const result = detectFundingSignal("신주인수권부사채권 발행결정");
      expect(result).toEqual({ roundName: "BW", priority: 2 });
    });

    it("일반 유상증자를 감지한다 (낮은 우선순위)", () => {
      const result = detectFundingSignal("유상증자 결정");
      expect(result).toEqual({ roundName: "유상증자", priority: 1 });
    });
  });

  describe("제외 패턴", () => {
    it("정정보고서는 제외한다", () => {
      expect(detectFundingSignal("[정정]유상증자 결정")).toBeNull();
    });

    it("기재정정은 제외한다", () => {
      expect(detectFundingSignal("[기재정정]전환사채 발행 결정")).toBeNull();
    });

    it("취소는 제외한다", () => {
      expect(detectFundingSignal("유상증자 결정 취소")).toBeNull();
    });

    it("철회는 제외한다", () => {
      expect(detectFundingSignal("전환사채 발행 철회")).toBeNull();
    });
  });

  describe("비매칭", () => {
    it("관련 없는 공시는 null을 반환한다", () => {
      expect(detectFundingSignal("사업보고서 (2024.12)")).toBeNull();
      expect(detectFundingSignal("분기보고서")).toBeNull();
      expect(detectFundingSignal("임원ㆍ주요주주특정증권등소유상황보고서")).toBeNull();
    });

    it("빈 문자열은 null을 반환한다", () => {
      expect(detectFundingSignal("")).toBeNull();
    });
  });

  describe("우선순위", () => {
    it("제3자배정 유상증자가 일반 유상증자보다 우선한다", () => {
      const specific = detectFundingSignal("제3자배정 유상증자");
      const general = detectFundingSignal("유상증자 결정");
      expect(specific!.priority).toBeGreaterThan(general!.priority);
    });
  });
});
