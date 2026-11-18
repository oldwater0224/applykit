import {
  CONSENT_FIELDS,
  PRIVACY_VERSION,
  TERMS_VERSION,
  parseConsentForm,
} from "@/src/lib/consent/policy";

const ERROR = "필수 항목에 모두 동의해주세요.";

function form(values: Record<string, string>) {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const ALL_ON = {
  [CONSENT_FIELDS.age14]: "on",
  [CONSENT_FIELDS.terms]: "on",
  [CONSENT_FIELDS.privacy]: "on",
};

describe("parseConsentForm", () => {
  it("세 항목 모두 동의하면 상수 버전으로 채운 동의를 돌려준다", () => {
    expect(parseConsentForm(form(ALL_ON))).toEqual({
      ok: true,
      consents: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, age14: true },
    });
  });

  it("폼 필드 이름이 정해진 값이다", () => {
    expect(CONSENT_FIELDS).toEqual({
      age14: "agree_age14",
      terms: "agree_terms",
      privacy: "agree_privacy",
    });
  });

  it("아무것도 체크하지 않으면 거부", () => {
    expect(parseConsentForm(new FormData())).toEqual({ ok: false, error: ERROR });
  });

  it.each(Object.values(CONSENT_FIELDS))("%s 누락 시 거부", (missing) => {
    const values = { ...ALL_ON };
    delete values[missing];
    expect(parseConsentForm(form(values))).toEqual({ ok: false, error: ERROR });
  });

  it.each(["true", "off", "", "ON", "2020-01-01"])(
    '값이 "on"이 아니면(%p) 거부',
    (value) => {
      const values = { ...ALL_ON, [CONSENT_FIELDS.terms]: value };
      expect(parseConsentForm(form(values))).toEqual({ ok: false, error: ERROR });
    },
  );

  it("클라이언트가 보낸 버전 값은 무시한다", () => {
    const result = parseConsentForm(
      form({ ...ALL_ON, terms_version: "1999-01-01" }),
    );
    expect(result.ok && result.consents.terms).toBe(TERMS_VERSION);
  });
});
