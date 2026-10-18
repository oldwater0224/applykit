// createApplication / updateApplication / uploadApplicationFile 의 서버 마감 확인(#58)
// Supabase 클라이언트는 목으로 대체하고, 테이블별 응답과 호출 기록만 다룬다.

type Result = { data: unknown; error: unknown };

const state: {
  user: { id: string } | null;
  // 테이블별 단건 조회 응답 (single / maybeSingle)
  fetch: Record<string, Result>;
  calls: Array<{ table: string; op: string; args: unknown[] }>;
} = { user: null, fetch: {}, calls: [] };

function chain(table: string) {
  const record = (op: string, args: unknown[]) =>
    state.calls.push({ table, op, args });
  const fetched = async () =>
    state.fetch[table] ?? { data: null, error: { message: "no mock" } };
  const writeResult = async () => ({ data: { id: "new-app" }, error: null });
  let isWrite = false;
  const c = {
    select: (...args: unknown[]) => {
      record("select", args);
      return c;
    },
    insert: (...args: unknown[]) => {
      isWrite = true;
      record("insert", args);
      return c;
    },
    update: (...args: unknown[]) => {
      isWrite = true;
      record("update", args);
      return c;
    },
    eq: (...args: unknown[]) => {
      record("eq", args);
      return c;
    },
    single: () => (isWrite ? writeResult() : fetched()),
    maybeSingle: () => fetched(),
    // update(...).eq(...)를 await할 때
    then: (resolve: (v: Result) => void) =>
      resolve({ data: null, error: null }),
  };
  return c;
}

const storageUpload = jest.fn(async () => ({
  data: { path: "stored/path" },
  error: null,
}));

jest.mock("@/src/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      state.calls.push({ table, op: "from", args: [] });
      return chain(table);
    },
    storage: {
      from: () => ({ upload: storageUpload, remove: jest.fn() }),
    },
  }),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import {
  createApplication,
  updateApplication,
} from "@/src/app/actions/applicationAction";
import { uploadApplicationFile } from "@/src/app/actions/applicationFileAction";

// 현재 시각: 2026-10-20 18:00 KST
const NOW = new Date("2026-10-20T09:00:00Z");
const PAST = "2026-10-20T08:59:59+00:00"; // 1초 전 마감
const FUTURE = "2026-10-20T09:00:01+00:00"; // 1초 뒤 마감

const DEADLINE_ERROR = "마감된 공고입니다. 지원서를 제출할 수 없습니다.";
const NOT_ACTIVE_ERROR = "현재 모집 중인 공고가 아닙니다.";

const writes = (op: "insert" | "update", table = "applications") =>
  state.calls.filter((c) => c.table === table && c.op === op);

beforeAll(() => {
  jest.useFakeTimers({ now: NOW });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  state.user = { id: "u1" };
  state.fetch = {};
  state.calls = [];
  storageUpload.mockClear();
});

// ============================================
// createApplication
// ============================================
describe("createApplication 마감 확인", () => {
  const input = { program_id: "p1", form_data: {}, is_complete: true };

  function program(
    deadline: string | null,
    status = "active",
    applications: { id: string }[] = [],
  ) {
    state.fetch.programs = {
      data: { id: "p1", status, deadline, applications },
      error: null,
    };
  }

  it("마감 전이면 insert (즉시 제출)", async () => {
    program(FUTURE);
    const res = await createApplication(input);
    expect(res).toEqual({ success: true, data: { id: "new-app" } });
    expect(writes("insert")).toHaveLength(1);
  });

  it("마감일이 없으면 insert", async () => {
    program(null);
    const res = await createApplication({ ...input, is_complete: false });
    expect(res.success).toBe(true);
  });

  it("마감 후 즉시 제출 거부", async () => {
    program(PAST);
    const res = await createApplication(input);
    expect(res).toEqual({ success: false, error: DEADLINE_ERROR });
    expect(writes("insert")).toHaveLength(0);
  });

  it("마감 후 임시저장(is_complete=false)도 거부", async () => {
    program(PAST);
    const res = await createApplication({ ...input, is_complete: false });
    expect(res).toEqual({ success: false, error: DEADLINE_ERROR });
    expect(writes("insert")).toHaveLength(0);
  });

  it("closed/draft 공고는 마감 전이어도 거부", async () => {
    for (const status of ["closed", "draft"]) {
      state.calls = [];
      program(FUTURE, status);
      const res = await createApplication(input);
      expect(res).toEqual({ success: false, error: NOT_ACTIVE_ERROR });
      expect(writes("insert")).toHaveLength(0);
    }
  });

  it("공고를 찾지 못하면 거부", async () => {
    state.fetch.programs = { data: null, error: null };
    const res = await createApplication(input);
    expect(res).toEqual({ success: false, error: "공고를 찾을 수 없습니다." });
    expect(writes("insert")).toHaveLength(0);
  });

  it("공고 조회는 내 지원서 임베드와 한 번에 (쿼리 2회: 조회 + insert)", async () => {
    program(FUTURE);
    await createApplication(input);
    const froms = state.calls.filter((c) => c.op === "from").map((c) => c.table);
    expect(froms).toEqual(["programs", "applications"]);
    const select = state.calls.find((c) => c.table === "programs" && c.op === "select");
    expect(select?.args[0]).toContain("applications(id)");
    const eqs = state.calls
      .filter((c) => c.table === "programs" && c.op === "eq")
      .map((c) => c.args);
    expect(eqs).toEqual([
      ["id", "p1"],
      ["applications.user_id", "u1"],
    ]);
  });

  describe("검증 순서", () => {
    it("인증이 먼저 - 비로그인이면 공고 조회 없이 거부", async () => {
      state.user = null;
      program(PAST);
      const res = await createApplication(input);
      expect(res).toEqual({ success: false, error: "로그인이 필요합니다." });
      expect(state.calls).toHaveLength(0);
    });

    it("중복 지원이 마감보다 먼저 - 기존 메시지 유지", async () => {
      program(PAST, "active", [{ id: "a1" }]);
      const res = await createApplication(input);
      expect(res).toEqual({
        success: false,
        error: "이미 해당 공고에 작성 중인 지원서가 있습니다.",
      });
    });
  });
});

// ============================================
// updateApplication
// ============================================
describe("updateApplication 마감 확인", () => {
  function app(
    programs: unknown,
    overrides: Partial<{ user_id: string; is_complete: boolean }> = {},
  ) {
    state.fetch.applications = {
      data: {
        id: "a1",
        user_id: "u1",
        is_complete: false,
        program_id: "p1",
        programs,
        ...overrides,
      },
      error: null,
    };
  }

  it("마감 전이면 최종 제출 update", async () => {
    app({ status: "active", deadline: FUTURE });
    const res = await updateApplication("a1", { form_data: {}, is_complete: true });
    expect(res).toEqual({ success: true, data: null });
    expect(writes("update")).toHaveLength(1);
  });

  it("임베드가 배열로 와도 처리", async () => {
    app([{ status: "active", deadline: FUTURE }]);
    const res = await updateApplication("a1", { form_data: {} });
    expect(res.success).toBe(true);
  });

  it("마감 후 최종 제출 거부", async () => {
    app({ status: "active", deadline: PAST });
    const res = await updateApplication("a1", { form_data: {}, is_complete: true });
    expect(res).toEqual({ success: false, error: DEADLINE_ERROR });
    expect(writes("update")).toHaveLength(0);
  });

  it("마감 후 임시저장도 거부", async () => {
    app({ status: "active", deadline: PAST });
    const res = await updateApplication("a1", { form_data: { q: "x" } });
    expect(res).toEqual({ success: false, error: DEADLINE_ERROR });
    expect(writes("update")).toHaveLength(0);
  });

  it("closed 공고는 거부", async () => {
    app({ status: "closed", deadline: FUTURE });
    const res = await updateApplication("a1", { is_complete: true });
    expect(res).toEqual({ success: false, error: NOT_ACTIVE_ERROR });
  });

  it("임베드된 공고가 없으면 거부", async () => {
    app(null);
    const res = await updateApplication("a1", { is_complete: true });
    expect(res).toEqual({ success: false, error: "공고를 찾을 수 없습니다." });
    expect(writes("update")).toHaveLength(0);
  });

  it("공고 정보는 지원서 조회에 임베드 (추가 쿼리 없음)", async () => {
    app({ status: "active", deadline: FUTURE });
    await updateApplication("a1", { is_complete: true });
    const froms = state.calls.filter((c) => c.op === "from").map((c) => c.table);
    expect(froms).toEqual(["applications", "applications"]);
    const select = state.calls.find((c) => c.op === "select");
    expect(select?.args[0]).toContain("programs(status, deadline)");
  });

  describe("검증 순서: 인증 → 소유권 → 제출 여부 → 마감", () => {
    it("비로그인", async () => {
      state.user = null;
      app({ status: "active", deadline: PAST });
      expect(await updateApplication("a1", { is_complete: true })).toEqual({
        success: false,
        error: "로그인이 필요합니다.",
      });
    });

    it("지원서 없음", async () => {
      state.fetch.applications = { data: null, error: { message: "x" } };
      expect(await updateApplication("a1", { is_complete: true })).toEqual({
        success: false,
        error: "지원서를 찾을 수 없습니다.",
      });
    });

    it("남의 지원서면 마감보다 소유권 에러가 먼저", async () => {
      app({ status: "active", deadline: PAST }, { user_id: "other" });
      expect(await updateApplication("a1", { is_complete: true })).toEqual({
        success: false,
        error: "수정 권한이 없습니다.",
      });
    });

    it("이미 제출된 지원서면 기존 메시지 유지", async () => {
      app({ status: "active", deadline: PAST }, { is_complete: true });
      expect(await updateApplication("a1", { is_complete: true })).toEqual({
        success: false,
        error: "제출된 지원서는 수정할 수 없습니다.",
      });
    });
  });
});

// ============================================
// uploadApplicationFile
// ============================================
describe("uploadApplicationFile 마감 확인", () => {
  function form() {
    const fd = new FormData();
    fd.append("application_id", "a1");
    fd.append("field_key", "f1");
    fd.append("file", new File(["%PDF"], "doc.pdf", { type: "application/pdf" }));
    return fd;
  }

  function app(programs: unknown, overrides: Partial<{ user_id: string }> = {}) {
    state.fetch.applications = {
      data: { id: "a1", user_id: "u1", is_complete: false, programs, ...overrides },
      error: null,
    };
  }

  it("마감 전이면 업로드", async () => {
    app({ status: "active", deadline: FUTURE });
    state.fetch.application_files = { data: { id: "f1" }, error: null };
    const res = await uploadApplicationFile(form());
    expect(res.success).toBe(true);
    expect(storageUpload).toHaveBeenCalledTimes(1);
  });

  it("마감 후면 Storage 업로드 전에 거부", async () => {
    app({ status: "active", deadline: PAST });
    const res = await uploadApplicationFile(form());
    expect(res).toEqual({ success: false, error: DEADLINE_ERROR });
    expect(storageUpload).not.toHaveBeenCalled();
    expect(writes("insert", "application_files")).toHaveLength(0);
  });

  it("모집 중이 아니면 거부", async () => {
    app({ status: "draft", deadline: null });
    const res = await uploadApplicationFile(form());
    expect(res).toEqual({ success: false, error: NOT_ACTIVE_ERROR });
    expect(storageUpload).not.toHaveBeenCalled();
  });

  it("소유권 에러가 마감보다 먼저", async () => {
    app({ status: "active", deadline: PAST }, { user_id: "other" });
    const res = await uploadApplicationFile(form());
    expect(res).toEqual({ success: false, error: "권한이 없습니다." });
  });
});
