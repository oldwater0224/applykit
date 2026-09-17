import { stripHtml, normalizeUrl, hashUrl, chooseUrl } from "../sanitize";

describe("stripHtml", () => {
  it("removes <b> tags", () => {
    expect(stripHtml("<b>테스트</b> 기사")).toBe("테스트 기사");
  });

  it("removes multiple nested tags", () => {
    expect(stripHtml("<b>A사</b>, <i>시리즈A</i> 투자")).toBe("A사, 시리즈A 투자");
  });

  it("decodes &quot;", () => {
    expect(stripHtml("&quot;스타트업&quot;")).toBe('"스타트업"');
  });

  it("decodes &amp;", () => {
    expect(stripHtml("A&amp;B")).toBe("A&B");
  });

  it("decodes &#39;", () => {
    expect(stripHtml("it&#39;s")).toBe("it's");
  });

  it("decodes &lt; and &gt;", () => {
    expect(stripHtml("a &lt; b &gt; c")).toBe("a < b > c");
  });

  it("collapses whitespace and trims", () => {
    expect(stripHtml("  hello   world  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("removes utm_ parameters", () => {
    const url = "https://example.com/article?utm_source=naver&utm_medium=cpc&id=123";
    expect(normalizeUrl(url)).toContain("id=123");
    expect(normalizeUrl(url)).not.toContain("utm_source");
    expect(normalizeUrl(url)).not.toContain("utm_medium");
  });

  it("removes fbclid and gclid", () => {
    const url = "https://example.com/news?fbclid=abc123&gclid=xyz";
    const normalized = normalizeUrl(url);
    expect(normalized).not.toContain("fbclid");
    expect(normalized).not.toContain("gclid");
  });

  it("removes www. prefix", () => {
    expect(normalizeUrl("https://www.example.com/article")).toBe(
      "https://example.com/article"
    );
  });

  it("removes trailing slash", () => {
    expect(normalizeUrl("https://example.com/article/")).toBe(
      "https://example.com/article"
    );
  });

  it("normalizes protocol to https", () => {
    expect(normalizeUrl("http://example.com/article")).toBe(
      "https://example.com/article"
    );
  });

  it("lowercases hostname", () => {
    expect(normalizeUrl("https://EXAMPLE.COM/Article")).toContain("example.com");
  });
});

describe("hashUrl", () => {
  it("produces same hash for same URL with different tracking params", () => {
    const url1 = "https://example.com/article?utm_source=naver";
    const url2 = "https://example.com/article?utm_source=google";
    expect(hashUrl(url1)).toBe(hashUrl(url2));
  });

  it("produces same hash for http vs https", () => {
    expect(hashUrl("http://example.com/article")).toBe(
      hashUrl("https://example.com/article")
    );
  });

  it("produces same hash for www vs non-www", () => {
    expect(hashUrl("https://www.example.com/article")).toBe(
      hashUrl("https://example.com/article")
    );
  });

  it("produces different hash for different paths", () => {
    expect(hashUrl("https://example.com/a")).not.toBe(
      hashUrl("https://example.com/b")
    );
  });
});

describe("chooseUrl", () => {
  it("returns originallink when available", () => {
    expect(chooseUrl("https://original.com", "https://naver.com")).toBe(
      "https://original.com"
    );
  });

  it("falls back to link when originallink is empty", () => {
    expect(chooseUrl("", "https://naver.com")).toBe("https://naver.com");
  });
});
