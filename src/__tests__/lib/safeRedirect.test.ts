import { safeRedirectPath } from "@/src/lib/safeRedirect";

describe("safeRedirectPath", () => {
  it.each([
    "/applications",
    "/dashboard",
    "/programs/123?tab=info",
    "/consent?redirect=%2Fdashboard",
    "/applications#top",
  ])("내부 경로 %p 는 그대로 허용", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "/\\/evil.com",
    "https://evil.com",
    "http://x/applications",
    "@evil.com",
    "evil.com",
    "javascript:alert(1)",
    "/foo\\bar",
    "/\tevil",
    "/\n/evil.com",
  ])("외부·비정상 값 %p 는 기본값", (input) => {
    expect(safeRedirectPath(input)).toBe("/applications");
  });

  it.each([null, undefined, ""])("값이 없으면(%p) 기본값", (input) => {
    expect(safeRedirectPath(input)).toBe("/applications");
  });

  it("fallback 지정", () => {
    expect(safeRedirectPath("//evil.com", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath(null, "")).toBe("");
  });
});
