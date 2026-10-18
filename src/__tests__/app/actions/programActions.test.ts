// createProgram / updateProgram 이 마감일을 KST → UTC ISO로 정규화해 DB에 보내는지 확인
// Supabase 클라이언트는 목으로 대체해 insert/update 페이로드만 검사한다.

const captured: { insert?: Record<string, unknown>; update?: Record<string, unknown> } = {};

function chain() {
  const result = { data: { id: "p1" }, error: null };
  const c = {
    insert: (payload: Record<string, unknown>) => {
      captured.insert = payload;
      return c;
    },
    update: (payload: Record<string, unknown>) => {
      captured.update = payload;
      return c;
    },
    eq: () => c,
    select: () => c,
    single: async () => result,
  };
  return c;
}

jest.mock("@/src/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => chain(),
  }),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { createProgram, updateProgram } from "@/src/app/actions/programActions";

beforeEach(() => {
  delete captured.insert;
  delete captured.update;
});

describe("createProgram 마감일 정규화", () => {
  it("datetime-local 값(KST)을 UTC ISO로 저장", async () => {
    const res = await createProgram("org1", {
      title: "t",
      deadline: "2026-06-18T09:21",
    });
    expect(res.success).toBe(true);
    expect(captured.insert?.deadline).toBe("2026-06-18T00:21:00.000Z");
  });

  it("빈 마감일은 null", async () => {
    await createProgram("org1", { title: "t", deadline: "" });
    expect(captured.insert?.deadline).toBeNull();
  });

  it("마감일 미전달도 null", async () => {
    await createProgram("org1", { title: "t" });
    expect(captured.insert?.deadline).toBeNull();
  });

  it("잘못된 마감일은 저장하지 않고 에러", async () => {
    const res = await createProgram("org1", {
      title: "t",
      deadline: "2026-02-30T10:00",
    });
    expect(res).toEqual({
      success: false,
      error: "마감일 형식이 올바르지 않습니다.",
    });
    expect(captured.insert).toBeUndefined();
  });
});

describe("updateProgram 마감일 정규화", () => {
  it("datetime-local 값(KST)을 UTC ISO로 저장", async () => {
    await updateProgram({ id: "p1", deadline: "2026-06-18T00:10" });
    expect(captured.update?.deadline).toBe("2026-06-17T15:10:00.000Z");
  });

  it("오프셋 포함 값은 그대로 (이중 변환 없음)", async () => {
    await updateProgram({ id: "p1", deadline: "2026-06-18T00:21:00+00:00" });
    expect(captured.update?.deadline).toBe("2026-06-18T00:21:00+00:00");
  });

  it("빈 값은 null (마감일 지우기)", async () => {
    await updateProgram({ id: "p1", deadline: "" });
    expect(captured.update?.deadline).toBeNull();
  });

  it("deadline 미전달이면 페이로드에 넣지 않음 (폼 빌더 저장 등)", async () => {
    await updateProgram({ id: "p1", title: "새 제목" });
    expect(captured.update).toEqual({ title: "새 제목" });
  });

  it("잘못된 마감일은 에러", async () => {
    const res = await updateProgram({ id: "p1", deadline: "nope" });
    expect(res.success).toBe(false);
    expect(captured.update).toBeUndefined();
  });
});
