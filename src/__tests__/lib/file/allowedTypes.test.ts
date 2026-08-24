import { isAllowedFile } from "@/src/lib/file/allowedTypes";

function createMockFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

describe("isAllowedFile", () => {
  describe("허용 파일", () => {
    it("PDF 파일을 허용한다", () => {
      const file = createMockFile("report.pdf", "application/pdf");
      expect(isAllowedFile(file)).toBe(true);
    });

    it("XLSX 파일을 허용한다", () => {
      const file = createMockFile(
        "data.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(isAllowedFile(file)).toBe(true);
    });

    it("대문자 확장자도 허용한다", () => {
      const file = createMockFile("REPORT.PDF", "application/pdf");
      expect(isAllowedFile(file)).toBe(true);
    });
  });

  describe("거부 파일", () => {
    it("이미지 파일을 거부한다", () => {
      const file = createMockFile("photo.png", "image/png");
      expect(isAllowedFile(file)).toBe(false);
    });

    it("실행 파일을 거부한다", () => {
      const file = createMockFile("malware.exe", "application/x-msdownload");
      expect(isAllowedFile(file)).toBe(false);
    });

    it("구버전 xls를 거부한다", () => {
      const file = createMockFile("old.xls", "application/vnd.ms-excel");
      expect(isAllowedFile(file)).toBe(false);
    });

    it("확장자만 맞고 MIME이 다르면 거부한다", () => {
      const file = createMockFile("fake.pdf", "text/plain");
      expect(isAllowedFile(file)).toBe(false);
    });

    it("MIME만 맞고 확장자가 다르면 거부한다", () => {
      const file = createMockFile("disguised.txt", "application/pdf");
      expect(isAllowedFile(file)).toBe(false);
    });
  });

  describe("MIME 빈 문자열 (일부 OS/브라우저)", () => {
    it("MIME이 빈 문자열이면 확장자만으로 판단한다", () => {
      const file = createMockFile("report.pdf", "");
      expect(isAllowedFile(file)).toBe(true);
    });

    it("MIME이 빈 문자열이고 확장자도 안 맞으면 거부한다", () => {
      const file = createMockFile("script.sh", "");
      expect(isAllowedFile(file)).toBe(false);
    });
  });
});
