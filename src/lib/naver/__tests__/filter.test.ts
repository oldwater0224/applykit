import {
  isExcluded,
  scoreRelevance,
  tagRound,
  tagAmount,
  extractCompanyName,
  buildContentKey,
  filterArticle,
} from "../filter";

describe("isExcluded", () => {
  it("excludes stock promotion keywords", () => {
    expect(isExcluded("A사 상한가 급등 투자")).toBe(true);
    expect(isExcluded("테마주 수혜주 리딩방")).toBe(true);
  });

  it("excludes ad keywords", () => {
    expect(isExcluded("무료체험 이벤트 신청")).toBe(true);
    expect(isExcluded("할인 쿠폰 증정")).toBe(true);
  });

  it("excludes foreign-only when no Korean company", () => {
    expect(isExcluded("나스닥 급락 S&P 하락")).toBe(true);
  });

  it("does not exclude foreign keyword with Korean company", () => {
    expect(isExcluded("삼성전자는 나스닥 상장")).toBe(false);
  });

  it("does not exclude normal startup articles", () => {
    expect(isExcluded("A사 시리즈A 50억 투자 유치")).toBe(false);
  });
});

describe("scoreRelevance", () => {
  it("gives 2 for round keywords", () => {
    expect(scoreRelevance("시리즈A")).toBeGreaterThanOrEqual(2);
  });

  it("gives 1 for amount pattern", () => {
    expect(scoreRelevance("50억 규모")).toBeGreaterThanOrEqual(1);
  });

  it("gives 1 for investment action keywords", () => {
    expect(scoreRelevance("투자 유치 성공")).toBeGreaterThanOrEqual(1);
  });

  it("gives 1 for startup keywords", () => {
    expect(scoreRelevance("스타트업 성장")).toBeGreaterThanOrEqual(1);
  });

  it("score 1 does not pass (below threshold)", () => {
    const score = scoreRelevance("스타트업 소식");
    expect(score).toBeLessThan(2);
  });
});

describe("tagRound", () => {
  it("tags 시리즈A as Series A", () => {
    expect(tagRound("A사 시리즈A 투자 유치")).toBe("Series A");
  });

  it("tags 시드 as Seed", () => {
    expect(tagRound("시드 라운드 마감")).toBe("Seed");
  });

  it("tags Pre-A correctly", () => {
    expect(tagRound("프리A 투자 유치")).toBe("Pre-A");
  });

  it("tags Pre-IPO", () => {
    expect(tagRound("프리IPO 라운드")).toBe("Pre-IPO");
  });

  it("returns null when no round found", () => {
    expect(tagRound("스타트업 소식")).toBeNull();
  });
});

describe("tagAmount", () => {
  it("extracts 50억", () => {
    expect(tagAmount("50억원 규모")).toBe("50억");
  });

  it("extracts 1조", () => {
    expect(tagAmount("1조원 규모")).toBe("1조");
  });

  it("extracts 만 달러", () => {
    expect(tagAmount("500만 달러 유치")).toBe("500만달러");
  });

  it("returns null when no amount", () => {
    expect(tagAmount("투자 유치 소식")).toBeNull();
  });
});

describe("extractCompanyName", () => {
  it("extracts company before particle 은/는/이/가", () => {
    expect(extractCompanyName("A사는 시리즈A 투자를 유치했다")).toBe("A사");
  });

  it("extracts company before comma", () => {
    expect(extractCompanyName("A사, 50억 시리즈A 유치")).toBe("A사");
  });

  it("removes brackets and uses first word", () => {
    expect(extractCompanyName("[단독] B사 투자 유치")).toBe("B사");
  });

  it("fallback to first word", () => {
    expect(extractCompanyName("C스타트업 시리즈B 완료")).toBe("C스타트업");
  });
});

describe("buildContentKey", () => {
  it("produces same key for differently worded same articles", () => {
    const key1 = buildContentKey("A사, 50억 시리즈A 유치", "Series A", "50억");
    const key2 = buildContentKey("A사 시리즈A 투자 50억원 유치", "Series A", "50억원");
    expect(key1).toBe(key2);
  });

  it("uses dash for null round and amount", () => {
    const key = buildContentKey("테스트 기사", null, null);
    expect(key).toContain("|-|-");
  });
});

describe("filterArticle", () => {
  it("passes articles with score >= 2", () => {
    const result = filterArticle("A사 시리즈A 50억 투자 유치", "스타트업 투자 소식");
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it("rejects articles with score < 2", () => {
    const result = filterArticle("오늘의 날씨", "맑은 날씨가 계속됩니다");
    expect(result.passed).toBe(false);
  });

  it("rejects excluded articles regardless of score", () => {
    const result = filterArticle("상한가 시리즈A 급등", "테마주 투자");
    expect(result.passed).toBe(false);
  });

  it("always returns contentKey even when rejected", () => {
    const result = filterArticle("일반 뉴스 기사", "내용 없음");
    expect(result.contentKey).toBeTruthy();
  });
});
