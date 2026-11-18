// acceptConsents: 재동의 기록과 리다이렉트 검증 (#69)

class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

const state: {
  user: { id: string } | null;
  insertError: unknown;
  inserts: Array<{ table: string; rows: unknown }>;
} = { user: null, insertError: null, inserts: [] };

jest.mock("@/src/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => ({
      insert: async (rows: unknown) => {
        state.inserts.push({ table, rows });
        return { data: null, error: state.insertError };
      },
    }),
  }),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

import { acceptConsents } from "@/src/app/actions/consentAction";
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

const ALL_ON = {
  [CONSENT_FIELDS.age14]: "on",
  [CONSENT_FIELDS.terms]: "on",
  [CONSENT_FIELDS.privacy]: "on",
};

async function run(values: Record<string, string>) {
  try {
    return { result: await acceptConsents({ error: "" }, form(values)) };
  } catch (e) {
    if (e instanceof RedirectError) return { redirect: e.url };
    throw e;
  }
}

beforeEach(() => {
  state.user = { id: "u1" };
  state.insertError = null;
  state.inserts = [];
});

describe("acceptConsents", () => {
  it("비로그인이면 로그인으로 보내고 기록하지 않는다", async () => {
    state.user = null;
    expect(await run(ALL_ON)).toEqual({ redirect: "/login?redirect=/consent" });
    expect(state.inserts).toHaveLength(0);
  });

  it("필수 동의가 빠지면 에러, 기록하지 않는다", async () => {
    const values: Record<string, string> = { ...ALL_ON };
    delete values[CONSENT_FIELDS.privacy];
    expect(await run(values)).toEqual({
      result: { error: "필수 항목에 모두 동의해주세요." },
    });
    expect(state.inserts).toHaveLength(0);
  });

  it("terms/privacy/age14 세 행을 본인 user_id, source=reconsent, 상수 버전으로 기록", async () => {
    await run({ ...ALL_ON, redirect: "/dashboard" });
    expect(state.inserts).toEqual([
      {
        table: "user_consents",
        rows: [
          { user_id: "u1", kind: "terms", version: TERMS_VERSION, agreed: true, source: "reconsent" },
          { user_id: "u1", kind: "privacy", version: PRIVACY_VERSION, agreed: true, source: "reconsent" },
          { user_id: "u1", kind: "age14", version: null, agreed: true, source: "reconsent" },
        ],
      },
    ]);
  });

  it("내부 경로면 원래 경로로 이동", async () => {
    expect(await run({ ...ALL_ON, redirect: "/applications/1?tab=a" })).toEqual({
      redirect: "/applications/1?tab=a",
    });
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com"])(
    "외부 주소(%p)면 /applications로",
    async (redirect) => {
      expect(await run({ ...ALL_ON, redirect })).toEqual({
        redirect: "/applications",
      });
    },
  );

  it("redirect가 없으면 /applications로", async () => {
    expect(await run(ALL_ON)).toEqual({ redirect: "/applications" });
  });

  it("insert 실패면 에러를 돌려주고 이동하지 않는다", async () => {
    state.insertError = { message: "rls" };
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(await run(ALL_ON)).toEqual({
      result: { error: "동의를 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
    });
  });
});
