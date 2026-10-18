"use server";

import { createClient } from "@/src/lib/supabase/server";
import {
  aggregateAdminDashboard,
  pickRecentApplicationIds,
  type DashboardApplicationRow,
  type DashboardProgramRow,
} from "@/src/lib/adminDashboard/aggregate";
import { extractCompanyName } from "@/src/lib/review/extractCompanyName";
import type { AdminDashboardOverview } from "@/src/types/adminDashboard";
import type { FormSchema } from "@/src/types/form";
import type { ApplicationFormData } from "@/src/types/applications";

// applicationAction.ts와 동일한 ActionResult 패턴
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// PostgREST 기본 max-rows(1000) 대응 - 지원서는 페이지 단위로 끝까지 읽음
const PAGE_SIZE = 1000;

/**
 * 운영기관 대시보드 개요 집계
 * - 로그인 + org_members 멤버십을 서버에서 확인
 * - DB 쿼리: 멤버십 1 + 공고 1 + 지원서(심사결과 임베드) ceil(n/1000) + 최근 10건 라벨 1
 * - 집계는 src/lib/adminDashboard/aggregate.ts의 순수 함수가 담당
 */
export async function getAdminDashboardOverview(
  orgId: string,
): Promise<ActionResult<AdminDashboardOverview>> {
  if (typeof orgId !== "string" || !orgId.trim()) {
    return { success: false, error: "기관 정보가 없습니다." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 멤버십 확인 - 다른 기관의 집계를 보려는 시도 차단
  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (membershipError) {
    console.error("[getAdminDashboardOverview] membership", membershipError);
    return { success: false, error: "권한 확인에 실패했습니다." };
  }
  if (!membership) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 공고 + 지원서 병렬 조회
  const programsPromise = supabase
    .from("programs")
    .select("id, title, status, deadline, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const fetchApplications = async (): Promise<
    { data: DashboardApplicationRow[] } | { error: unknown }
  > => {
    const rows: DashboardApplicationRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      // programs!inner + org_id 필터로 programId 목록 없이 기관 단위 조회
      // review_results는 FK(application_id) 임베드 - 지원서별 추가 쿼리 없음
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          program_id,
          status,
          is_complete,
          submitted_at,
          created_at,
          programs!inner ( org_id ),
          review_results ( is_passed, reviewed_at )
          `,
        )
        .eq("programs.org_id", orgId)
        // 오름차순 - 조회 도중 새 지원서가 들어와도 앞 페이지가 밀리지 않음
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) return { error };
      const page = (data ?? []) as unknown as DashboardApplicationRow[];
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }
    return { data: rows };
  };

  const [programsResult, applicationsResult] = await Promise.all([
    programsPromise,
    fetchApplications(),
  ]);

  if (programsResult.error) {
    console.error("[getAdminDashboardOverview] programs", programsResult.error);
    return { success: false, error: "대시보드 데이터 조회에 실패했습니다." };
  }
  if ("error" in applicationsResult) {
    console.error(
      "[getAdminDashboardOverview] applications",
      applicationsResult.error,
    );
    return { success: false, error: "대시보드 데이터 조회에 실패했습니다." };
  }

  const programs = (programsResult.data ?? []) as DashboardProgramRow[];
  const applications = applicationsResult.data;

  // 최근 10건만 form_data + form_schema를 가져와 회사명 라벨 추출
  // (전체 지원서의 form_data를 끌어오지 않기 위해 분리)
  const applicantLabels: Record<string, string | null> = {};
  const recentIds = pickRecentApplicationIds(applications);
  if (recentIds.length > 0) {
    const { data: labelRows, error: labelError } = await supabase
      .from("applications")
      .select("id, form_data, programs ( form_schema )")
      .in("id", recentIds);

    if (labelError) {
      // 라벨은 부가 정보 - 실패해도 대시보드는 표시
      console.error("[getAdminDashboardOverview] labels", labelError);
    } else {
      for (const row of labelRows ?? []) {
        const program = Array.isArray(row.programs)
          ? row.programs[0]
          : row.programs;
        const schema = (program?.form_schema ?? null) as FormSchema | null;
        applicantLabels[row.id] =
          schema && Array.isArray(schema.fields) && row.form_data
            ? extractCompanyName(schema, row.form_data as ApplicationFormData)
            : null;
      }
    }
  }

  const overview = aggregateAdminDashboard({
    programs,
    applications,
    now: new Date(),
    applicantLabels,
  });

  return { success: true, data: overview };
}
