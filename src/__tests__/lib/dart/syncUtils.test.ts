import { dartDateToISO, parseAmount, mapSector } from "@/src/lib/dart/sync";

describe("dartDateToISO", () => {
  it("8자리 날짜를 ISO 형식으로 변환한다", () => {
    expect(dartDateToISO("20240315")).toBe("2024-03-15");
  });

  it("오래된 날짜도 변환한다", () => {
    expect(dartDateToISO("19690113")).toBe("1969-01-13");
  });

  it("빈 문자열이면 undefined를 반환한다", () => {
    expect(dartDateToISO("")).toBeUndefined();
  });

  it("8자리가 아니면 undefined를 반환한다", () => {
    expect(dartDateToISO("2024-03-15")).toBeUndefined();
    expect(dartDateToISO("2024031")).toBeUndefined();
    expect(dartDateToISO("202403155")).toBeUndefined();
  });
});

describe("parseAmount", () => {
  it("콤마가 포함된 금액 문자열을 숫자로 변환한다", () => {
    expect(parseAmount("1,234,567,890")).toBe(1234567890);
  });

  it("콤마 없는 금액도 변환한다", () => {
    expect(parseAmount("500000")).toBe(500000);
  });

  it("음수 금액을 변환한다", () => {
    expect(parseAmount("-1,234")).toBe(-1234);
  });

  it("공백이 있어도 trim 후 변환한다", () => {
    expect(parseAmount("  1,000  ")).toBe(1000);
  });

  it("빈 문자열이면 undefined를 반환한다", () => {
    expect(parseAmount("")).toBeUndefined();
  });

  it("숫자로 변환 불가능하면 undefined를 반환한다", () => {
    expect(parseAmount("N/A")).toBeUndefined();
    expect(parseAmount("해당없음")).toBeUndefined();
  });

  it("0을 정상 변환한다", () => {
    expect(parseAmount("0")).toBe(0);
  });
});

describe("mapSector", () => {
  it("IT/소프트웨어 업종을 매핑한다", () => {
    expect(mapSector("62001")).toBe("IT/소프트웨어");
    expect(mapSector("63000")).toBe("IT/소프트웨어");
  });

  it("바이오/의료 업종을 매핑한다", () => {
    expect(mapSector("21000")).toBe("바이오/의료");
    expect(mapSector("86000")).toBe("바이오/의료");
  });

  it("금융 업종을 매핑한다", () => {
    expect(mapSector("64000")).toBe("금융");
    expect(mapSector("65000")).toBe("금융");
  });

  it("매핑되지 않는 코드는 기타를 반환한다", () => {
    expect(mapSector("99999")).toBe("기타");
    expect(mapSector("00000")).toBe("기타");
  });

  it("null/undefined도 기타를 반환한다", () => {
    expect(mapSector(null as unknown as string)).toBe("기타");
    expect(mapSector(undefined as unknown as string)).toBe("기타");
  });
});
