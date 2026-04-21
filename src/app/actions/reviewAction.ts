"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { extractCompanyName } from "@/src/lib/review/extractCompanyName";
import type {
  ReviewChecklist,
  ReviewResult,
  UpsertChecklistInput,
  CreateReviewInput,
  UpdateReviewInput,
  ChecklistItem,
} from "@/src/types/review";
import type { FormSchema } from "@/src/types/form";
import type { ApplicationFormData } from "@/src/types/applications";

// applicationAction.ts와 동일한 ActionResult 패턴
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================
// 내부 헬퍼
// ============================================

// 점수 합산 - items에 정의된 항목만 카운트
// scores에 노이즈 키가 들어와도 무시, max_score 초과는 클램프 (악의적 입력 방어)
function calculateTotalScore(
  items: ChecklistItem[],
  scores: Record<string, number>,
): number {
  return items.reduce((sum, item) => {
    const score = scores[item.id];
    if (typeof score !== "number" || score < 0) return sum;
    return sum + Math.min(score, item.max_score);
  }, 0);
}

// 운영기관 멤버십 검증 - 프로그램 id로 현재 사용자의 권한 체크
// RLS가 1차 방어선이지만 앱 레벨에서도 체크해서 친절한 에러 메시지 제공
async function verifyOrgMembership(programId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "로그인이 필요합니다." };
  }

  const { data: program } = await supabase
    .from("programs")
    .select("id, org_id")
    .eq("id", programId)
    .single();

  if (!program) {
    return { ok: false as const, error: "프로그램을 찾을 수 없습니다." };
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", program.org_id)
    .maybeSingle();

  if (!membership) {
    return { ok: false as const, error: "권한이 없습니다." };
  }

  return { ok: true as const, userId: user.id, programId };
}

// ============================================
// 체크리스트
// ============================================

/**
 * 체크리스트 upsert (프로그램당 1개라 생성/수정 통합)
 * - 운영기관 멤버만 가능
 * - items 검증: 비어있으면 안 됨, max_score 합 >= passing_score
 * - 항목 id 중복 차단 (scores 키 충돌 방지)
 */
export async function upsertChecklist(
  input: UpsertChecklistInput,
): Promise<ActionResult<{ id: string }>> {
  // 1. 입력 검증
  if (input.items.length === 0) {
    return { success: false, error: "체크리스트 항목이 1개 이상 필요합니다." };
  }
  const maxTotal = input.items.reduce((s, i) => s + i.max_score, 0);
  if (input.passing_score > maxTotal) {
    return {
      success: false,
      error: `합격 기준점(${input.passing_score})이 만점(${maxTotal})보다 큽니다.`,
    };
  }
  if (input.passing_score < 0) {
    return { success: false, error: "합격 기준점은 0 이상이어야 합니다." };
  }
  const itemIds = input.items.map((i) => i.id);
  if (new Set(itemIds).size !== itemIds.length) {
    return { success: false, error: "체크리스트 항목 id가 중복됩니다." };
  }

  // 2. 권한 검증
  const auth = await verifyOrgMembership(input.program_id);
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();

  // 3. upsert (program_id UNIQUE 제약 활용)
  // updated_at은 수동 갱신 (DB 트리거 없음)
  const { data, error } = await supabase
    .from("review_checklists")
    .upsert(
      {
        program_id: input.program_id,
        items: input.items,
        passing_score: input.passing_score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "program_id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[upsertChecklist]", error);
    return { success: false, error: "체크리스트 저장에 실패했습니다." };
  }

  revalidatePath(`/dashboard/programs/${input.program_id}`);
  return { success: true, data: { id: data.id } };
}

/**
 * 프로그램의 체크리스트 조회
 * - 없으면 null 반환 (에러 아님 - 아직 안 만든 상태)
 */
export async function getChecklistByProgram(
  programId: string,
): Promise<ActionResult<ReviewChecklist | null>> {
  const auth = await verifyOrgMembership(programId);
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_checklists")
    .select("*")
    .eq("program_id", programId)
    .maybeSingle();

  if (error) {
    console.error("[getChecklistByProgram]", error);
    return { success: false, error: "체크리스트 조회에 실패했습니다." };
  }
  return { success: true, data: data as ReviewChecklist | null };
}

// ============================================
// 심사 결과
// ============================================

/**
 * 심사 결과 생성
 * - 한 심사자가 한 지원서에 한 번만 (UNIQUE 제약 + 23505 에러 매핑)
 * - 점수 합산, is_passed 판정, company_name 추출은 서버에서 자동
 * - 운영기관 멤버 + 본인 reviewer_id로만 INSERT (RLS 정책 일치)
 */
export async function createReview(
  input: CreateReviewInput,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  // 1. 지원서 조회 - program_id, form_data 가져오기
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, program_id, form_data, is_complete")
    .eq("id", input.application_id)
    .single();

  if (appError || !application) {
    return { success: false, error: "지원서를 찾을 수 없습니다." };
  }

  // 미제출 지원서는 심사 불가
  if (!application.is_complete) {
    return {
      success: false,
      error: "제출되지 않은 지원서는 심사할 수 없습니다.",
    };
  }

  // 2. 권한 검증 + 프로그램 form_schema 조회 (회사명 추출에 필요)
  const auth = await verifyOrgMembership(application.program_id);
  if (!auth.ok) return { success: false, error: auth.error };

  const { data: program } = await supabase
    .from("programs")
    .select("form_schema")
    .eq("id", application.program_id)
    .single();

  // 3. 체크리스트 조회 - 점수 합산과 is_passed 판정에 필요
  const { data: checklist } = await supabase
    .from("review_checklists")
    .select("items, passing_score")
    .eq("program_id", application.program_id)
    .maybeSingle();

  if (!checklist) {
    return {
      success: false,
      error:
        "체크리스트가 설정되지 않았습니다. 먼저 체크리스트를 만들어주세요.",
    };
  }

  // 4. 자동 계산
  const items = checklist.items as ChecklistItem[];
  const totalScore = calculateTotalScore(items, input.scores);
  const isPassed = totalScore >= checklist.passing_score;
  const companyName = program?.form_schema
    ? extractCompanyName(
        program.form_schema as FormSchema,
        application.form_data as ApplicationFormData,
      )
    : null;

  // 5. INSERT
  const { data, error } = await supabase
    .from("review_results")
    .insert({
      application_id: input.application_id,
      program_id: application.program_id,
      reviewer_id: user.id,
      scores: input.scores,
      total_score: totalScore,
      is_passed: isPassed,
      company_name: companyName,
      comment: input.comment ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // UNIQUE(application_id, reviewer_id) 위반 = 이미 심사함
    // 23505는 PostgreSQL의 unique_violation 코드
    if (error.code === "23505") {
      return {
        success: false,
        error: "이미 심사한 지원서입니다. 수정 기능을 사용해주세요.",
      };
    }
    console.error("[createReview]", error);
    return { success: false, error: "심사 결과 저장에 실패했습니다." };
  }

  // 캐시 무효화 - 심사 탭, 지원서 상세, 아카이브
  revalidatePath(`/dashboard/programs/${application.program_id}`);
  revalidatePath(
    `/dashboard/programs/${application.program_id}/applications/${input.application_id}`,
  );
  revalidatePath("/dashboard/archive");

  return { success: true, data: { id: data.id } };
}

/**
 * 심사 결과 수정
 * - 본인 심사 기록만 (RLS + 앱 체크 이중)
 * - scores 변경 시 total_score, is_passed 자동 재계산
 * - comment만 변경 시 재계산 스킵
 */
export async function updateReview(
  id: string,
  input: UpdateReviewInput,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  // 기존 심사 조회 - 권한 + program_id (재계산용 체크리스트 조회 위해)
  const { data: existing, error: fetchError } = await supabase
    .from("review_results")
    .select("id, reviewer_id, program_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "심사 결과를 찾을 수 없습니다." };
  }

  if (existing.reviewer_id !== user.id) {
    return { success: false, error: "수정 권한이 없습니다." };
  }

  // 업데이트 페이로드 구성 - 전달된 필드만 반영하는 partial update 패턴
  const updatePayload: {
    scores?: Record<string, number>;
    total_score?: number;
    is_passed?: boolean;
    comment?: string | null;
  } = {};

  if (input.comment !== undefined) {
    updatePayload.comment = input.comment;
  }

  // scores 변경되면 total_score, is_passed 재계산
  if (input.scores !== undefined) {
    const { data: checklist } = await supabase
      .from("review_checklists")
      .select("items, passing_score")
      .eq("program_id", existing.program_id)
      .maybeSingle();

    if (!checklist) {
      return {
        success: false,
        error: "체크리스트가 삭제되어 점수를 재계산할 수 없습니다.",
      };
    }

    const items = checklist.items as ChecklistItem[];
    const totalScore = calculateTotalScore(items, input.scores);
    const isPassed = totalScore >= checklist.passing_score;

    updatePayload.scores = input.scores;
    updatePayload.total_score = totalScore;
    updatePayload.is_passed = isPassed;
  }

  const { error } = await supabase
    .from("review_results")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("[updateReview]", error);
    return { success: false, error: "심사 결과 수정에 실패했습니다." };
  }

  revalidatePath(`/dashboard/programs/${existing.program_id}`);
  revalidatePath("/dashboard/archive");
  return { success: true, data: null };
}

/**
 * 특정 지원서의 심사 결과 조회 (있으면 1개)
 * - MVP는 한 지원서당 한 심사자 → 결과도 1개
 * - 운영기관 멤버만 SELECT 가능 (RLS)
 */
export async function getReviewByApplication(
  applicationId: string,
): Promise<ActionResult<ReviewResult | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("review_results")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[getReviewByApplication]", error);
    return { success: false, error: "심사 결과 조회에 실패했습니다." };
  }
  return { success: true, data: data as ReviewResult | null };
}

/**
 * 프로그램의 모든 심사 결과 조회 (운영기관 심사 탭)
 * - 합격/불합격 필터링은 클라이언트에서 (데이터 양 적음)
 * - RLS가 운영기관 멤버만 통과시킴
 */
export async function getProgramReviews(
  programId: string,
): Promise<ActionResult<ReviewResult[]>> {
  const auth = await verifyOrgMembership(programId);
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_results")
    .select("*")
    .eq("program_id", programId)
    .order("reviewed_at", { ascending: false });

  if (error) {
    console.error("[getProgramReviews]", error);
    return { success: false, error: "심사 결과 목록 조회에 실패했습니다." };
  }
  return { success: true, data: (data as ReviewResult[]) || [] };
}

/**
 * 아카이브 검색 - 회사명 부분검색
 * - trigram 인덱스(idx_review_results_company_name) 활용
 * - 운영기관 멤버는 자기 기관 프로그램의 결과만 (RLS)
 * - 빈 query면 전체 반환 (최신순), 임시 상한 100건
 */
export async function searchArchive(
  query: string,
): Promise<ActionResult<ReviewResult[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  let q = supabase
    .from("review_results")
    .select("*")
    .order("reviewed_at", { ascending: false })
    .limit(100); // 페이지네이션 도입 전 임시 상한

  const trimmed = query.trim();
  if (trimmed) {
    // ilike: 대소문자 무시 LIKE - trigram 인덱스가 % LIKE %를 가속
    q = q.ilike("company_name", `%${trimmed}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[searchArchive]", error);
    return { success: false, error: "검색에 실패했습니다." };
  }
  return { success: true, data: (data as ReviewResult[]) || [] };
}