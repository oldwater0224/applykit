// signUp 필수 동의·비밀번호 길이, signIn 리다이렉트 검증 (#69)

class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

const authSignUp = jest.fn();
const authSignIn = jest.fn();
let orgMember: unknown = null;

jest.mock("@/src/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: authSignUp,
      signInWithPassword: authSignIn,
      signOut: jest.fn(),
    },
    from: () => {
      const c = {
        select: () => c,
        eq: () => c,
        maybeSingle: async () => ({ data: orgMember, error: null }),
      };
      return c;
    },
  }),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

import { signIn, signUp } from "@/src/lib/actions/auth";
import {
  CONSENT_FIELDS,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "@/src/lib/consent/policy";

function form(values: Record<string, string>) {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const BASE = { email: "a@b.com", password: "12345678", name: "홍길동" };
const ALL_ON = {
  [CONSENT_FIELDS.age14]: "on",
  [CONSENT_FIELDS.terms]: "on",
  [CONSENT_FIELDS.privacy]: "on",
};

async function redirectedTo(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof RedirectError) return e.url;
    throw e;
  }
  return null;
}

beforeEach(() => {
  authSignUp.mockReset().mockResolvedValue({ data: {}, error: null });
  authSignIn
    .mockReset()
    .mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  orgMember = null;
});

describe("signUp", () => {
  it("필수 동의가 빠지면 에러를 돌려주고 auth.signUp을 호출하지 않는다", async () => {
    for (const missing of Object.values(CONSENT_FIELDS)) {
      const values: Record<string, string> = { ...BASE, ...ALL_ON };
      delete values[missing];
      const result = await signUp({ error: "" }, form(values));
      expect(result).toEqual({ error: "필수 항목에 모두 동의해주세요." });
    }
    expect(authSignUp).not.toHaveBeenCalled();
  });

  it("비밀번호 7자는 거부", async () => {
    const result = await signUp(
      { error: "" },
      form({ ...BASE, ...ALL_ON, password: "1234567" }),
    );
    expect(result).toEqual({ error: "비밀번호는 8자 이상이어야 합니다." });
    expect(authSignUp).not.toHaveBeenCalled();
  });

  it("성공하면 options.data에 이름과 동의 버전을 넘기고 /applications로 이동", async () => {
    const url = await redirectedTo(
      signUp({ error: "" }, form({ ...BASE, ...ALL_ON })),
    );
    expect(url).toBe("/applications");
    expect(authSignUp).toHaveBeenCalledWith({
      email: BASE.email,
      password: BASE.password,
      options: {
        data: {
          name: BASE.name,
          consents: {
            terms: TERMS_VERSION,
            privacy: PRIVACY_VERSION,
            age14: true,
          },
        },
      },
    });
  });

  it("Auth 에러면 에러를 돌려준다", async () => {
    authSignUp.mockResolvedValue({ data: {}, error: { message: "fail" } });
    const result = await signUp({ error: "" }, form({ ...BASE, ...ALL_ON }));
    expect(result).toEqual({ error: "fail" });
  });
});

describe("signIn redirect", () => {
  const login = (extra: Record<string, string> = {}) =>
    redirectedTo(
      signIn(
        { error: "" },
        form({ email: "a@b.com", password: "12345678", ...extra }),
      ),
    );

  it("내부 경로면 그대로 이동", async () => {
    expect(await login({ redirect: "/consent?redirect=%2Fdashboard" })).toBe(
      "/consent?redirect=%2Fdashboard",
    );
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com"])(
    "외부 주소(%p)는 무시하고 기본 규칙을 따른다",
    async (redirect) => {
      expect(await login({ redirect })).toBe("/programs");
    },
  );

  it("운영기관 멤버는 기본 /dashboard", async () => {
    orgMember = { org_id: "o1" };
    expect(await login({ redirect: "//evil.com" })).toBe("/dashboard");
  });
});
