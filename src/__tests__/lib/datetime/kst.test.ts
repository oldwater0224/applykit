import {
  hasTimeZone,
  isValidDateTimeString,
  isoToKstLocalInput,
  kstLocalInputToIso,
  normalizeDeadlineForStorage,
  parseKstDateTimeMs,
} from "@/src/lib/datetime/kst";

// 모든 함수는 런타임 TZ와 무관해야 한다.
// TZ=UTC / TZ=America/Los_Angeles 로 실행해도 같은 결과가 나와야 함.

describe("kstLocalInputToIso", () => {
  it("datetime-local 값을 KST로 해석해 UTC ISO로 변환", () => {
    expect(kstLocalInputToIso("2026-06-18T09:21")).toBe(
      "2026-06-18T00:21:00.000Z",
    );
    expect(kstLocalInputToIso("2026-06-18T09:21:30")).toBe(
      "2026-06-18T00:21:30.000Z",
    );
  });

  it("KST 자정 근처는 UTC 기준 전날로 넘어감", () => {
    expect(kstLocalInputToIso("2026-06-18T00:00")).toBe(
      "2026-06-17T15:00:00.000Z",
    );
    expect(kstLocalInputToIso("2026-01-01T08:59")).toBe(
      "2025-12-31T23:59:00.000Z",
    );
    expect(kstLocalInputToIso("2026-06-18T23:59")).toBe(
      "2026-06-18T14:59:00.000Z",
    );
    expect(kstLocalInputToIso("2026-06-18T09:00")).toBe(
      "2026-06-18T00:00:00.000Z",
    );
  });

  it("오프셋이 이미 있으면 그 시각 그대로", () => {
    expect(kstLocalInputToIso("2026-06-18T09:21+09:00")).toBe(
      "2026-06-18T00:21:00.000Z",
    );
    expect(kstLocalInputToIso("2026-06-18T00:21:00+00:00")).toBe(
      "2026-06-18T00:21:00.000Z",
    );
    expect(kstLocalInputToIso("2026-06-18T00:21:00Z")).toBe(
      "2026-06-18T00:21:00.000Z",
    );
  });

  it("빈 값/잘못된 값은 null", () => {
    expect(kstLocalInputToIso("")).toBeNull();
    expect(kstLocalInputToIso("   ")).toBeNull();
    expect(kstLocalInputToIso(null)).toBeNull();
    expect(kstLocalInputToIso(undefined)).toBeNull();
    expect(kstLocalInputToIso("not-a-date")).toBeNull();
    expect(kstLocalInputToIso("2026-02-30T10:00")).toBeNull();
    expect(kstLocalInputToIso("2026-13-01T10:00")).toBeNull();
    expect(kstLocalInputToIso("2026-06-18T24:00")).toBeNull();
  });
});

describe("isoToKstLocalInput", () => {
  it("DB 응답(+00:00)을 KST datetime-local 문자열로", () => {
    expect(isoToKstLocalInput("2026-06-18T00:21:00+00:00")).toBe(
      "2026-06-18T09:21",
    );
    expect(isoToKstLocalInput("2026-06-18T00:21:00.123456+00:00")).toBe(
      "2026-06-18T09:21",
    );
    expect(isoToKstLocalInput("2026-06-18T00:21:00.000Z")).toBe(
      "2026-06-18T09:21",
    );
  });

  it("UTC 기준 전날 15시 이후는 KST 다음 날", () => {
    expect(isoToKstLocalInput("2026-06-17T15:00:00+00:00")).toBe(
      "2026-06-18T00:00",
    );
    expect(isoToKstLocalInput("2025-12-31T23:59:00+00:00")).toBe(
      "2026-01-01T08:59",
    );
    expect(isoToKstLocalInput("2026-06-17T14:59:00+00:00")).toBe(
      "2026-06-17T23:59",
    );
  });

  it("오프셋 없는 값은 KST로 간주해 그대로", () => {
    expect(isoToKstLocalInput("2026-06-18T09:21")).toBe("2026-06-18T09:21");
  });

  it("빈 값/잘못된 값은 빈 문자열", () => {
    expect(isoToKstLocalInput(null)).toBe("");
    expect(isoToKstLocalInput(undefined)).toBe("");
    expect(isoToKstLocalInput("")).toBe("");
    expect(isoToKstLocalInput("not-a-date")).toBe("");
  });

  it("왕복 변환하면 원래 입력값", () => {
    for (const local of [
      "2026-06-18T09:21",
      "2026-06-18T00:00",
      "2026-01-01T00:30",
      "2026-12-31T23:59",
      "2028-02-29T12:00",
    ]) {
      expect(isoToKstLocalInput(kstLocalInputToIso(local))).toBe(local);
    }
  });
});

describe("parseKstDateTimeMs / hasTimeZone / isValidDateTimeString", () => {
  it("날짜만 있으면 KST 00:00", () => {
    expect(parseKstDateTimeMs("2026-06-18")).toBe(
      Date.parse("2026-06-17T15:00:00Z"),
    );
  });

  it("공백 구분 일시도 KST로 해석", () => {
    expect(parseKstDateTimeMs("2026-06-18 09:21:00")).toBe(
      Date.parse("2026-06-18T00:21:00Z"),
    );
  });

  it("hasTimeZone은 날짜만 있는 값의 '-DD'를 오프셋으로 오인하지 않음", () => {
    expect(hasTimeZone("2026-06-18")).toBe(false);
    expect(hasTimeZone("2026-06-18T09:21")).toBe(false);
    expect(hasTimeZone("2026-06-18T09:21+09:00")).toBe(true);
    expect(hasTimeZone("2026-06-18T09:21:00Z")).toBe(true);
    expect(hasTimeZone("2026-06-18T09:21:00-05:00")).toBe(true);
  });

  it("isValidDateTimeString은 달력에 없는 날짜·시각을 거부", () => {
    expect(isValidDateTimeString("2026-06-18T09:21")).toBe(true);
    expect(isValidDateTimeString("2028-02-29T09:21")).toBe(true);
    expect(isValidDateTimeString("2026-02-29T09:21")).toBe(false);
    expect(isValidDateTimeString("2026-06-18T09:60")).toBe(false);
    expect(isValidDateTimeString("18/06/2026 09:21")).toBe(false);
  });
});

describe("normalizeDeadlineForStorage (서버 저장 직전 정규화)", () => {
  it("undefined는 미변경, null/빈 값은 null", () => {
    expect(normalizeDeadlineForStorage(undefined)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(normalizeDeadlineForStorage(null)).toEqual({ ok: true, value: null });
    expect(normalizeDeadlineForStorage("")).toEqual({ ok: true, value: null });
    expect(normalizeDeadlineForStorage("  ")).toEqual({ ok: true, value: null });
  });

  it("오프셋 없는 datetime-local 값은 KST → UTC ISO", () => {
    expect(normalizeDeadlineForStorage("2026-06-18T09:21")).toEqual({
      ok: true,
      value: "2026-06-18T00:21:00.000Z",
    });
    expect(normalizeDeadlineForStorage("2026-06-18T00:10")).toEqual({
      ok: true,
      value: "2026-06-17T15:10:00.000Z",
    });
  });

  it("오프셋이 이미 있으면 그대로 (이중 변환 방지)", () => {
    expect(normalizeDeadlineForStorage("2026-06-18T00:21:00+00:00")).toEqual({
      ok: true,
      value: "2026-06-18T00:21:00+00:00",
    });
    expect(normalizeDeadlineForStorage("2026-06-18T09:21+09:00")).toEqual({
      ok: true,
      value: "2026-06-18T09:21+09:00",
    });
    expect(normalizeDeadlineForStorage("2026-06-18T00:21:00.000Z")).toEqual({
      ok: true,
      value: "2026-06-18T00:21:00.000Z",
    });
  });

  it("정규화 결과를 다시 정규화해도 같음 (멱등)", () => {
    const once = normalizeDeadlineForStorage("2026-06-18T09:21");
    expect(once.ok).toBe(true);
    if (!once.ok) return;
    expect(normalizeDeadlineForStorage(once.value)).toEqual(once);
  });

  it("잘못된 값은 ok: false", () => {
    expect(normalizeDeadlineForStorage("not-a-date")).toEqual({ ok: false });
    expect(normalizeDeadlineForStorage("2026-02-30T10:00")).toEqual({
      ok: false,
    });
    expect(normalizeDeadlineForStorage("2026-06-18T25:00+09:00")).toEqual({
      ok: false,
    });
  });

  it("수정 모달 흐름: DB 값 → 모달 표시 → 그대로 저장해도 같은 시각", () => {
    const stored = "2026-06-18T00:21:00+00:00";
    const shown = isoToKstLocalInput(stored);
    expect(shown).toBe("2026-06-18T09:21");
    const saved = normalizeDeadlineForStorage(shown);
    expect(saved.ok && Date.parse(saved.value!)).toBe(Date.parse(stored));
  });
});
