// 심사 관련 타입 - DB의 review_checklists, review_results와 1:1 매칭
// 패턴은 applications.ts와 동일 (Row 타입 + Input 타입 + 표시용 상수)

// ============================================
// 체크리스트 항목 (JSONB items 배열의 한 요소)
// ============================================
// id는 scores 객체의 키로도 쓰임 (예: items[0].id = "team" → scores.team = 15)
// max_score는 이 항목의 만점. 모든 항목의 max_score 합 >= passing_score 이어야 의미 있음
export interface ChecklistItem {
  id: string;
  label: string;
  max_score: number;
}

// ============================================
// review_checklists 테이블 row
// ============================================
// program_id에 UNIQUE 제약 - 프로그램당 1개
export interface ReviewChecklist {
  id: string;
  program_id: string;
  items: ChecklistItem[];
  passing_score: number;
  created_at: string;
  updated_at: string;
}

// 체크리스트 upsert 입력 (생성/수정 통합)
// program_id 기준 upsert 패턴이라 별도 update input 불필요
export interface UpsertChecklistInput {
  program_id: string;
  items: ChecklistItem[];
  passing_score: number;
}

// ============================================
// review_results 테이블 row
// ============================================
// scores: { [item.id]: 점수 } 형태로 저장
//   예: items가 [team, tech] 이면 scores는 { team: 15, tech: 25 }
// total_score: scores의 모든 값의 합 (서버에서 계산해서 저장)
// is_passed: total_score >= checklist.passing_score (스냅샷 - 기준 변경되어도 유지)
// company_name: form_data에서 추출한 값 (extractCompanyName 헬퍼 사용)
// reviewer_id: auth.users(id) 참조, 심사자 탈퇴 시 NULL
export interface ReviewResult {
  id: string;
  application_id: string;
  program_id: string;
  reviewer_id: string | null;
  scores: Record<string, number>;
  total_score: number;
  is_passed: boolean;
  company_name: string | null;
  comment: string | null;
  reviewed_at: string;
}

// 심사 생성 입력
// total_score, is_passed, company_name은 서버에서 계산/추출하므로 입력 X
// reviewer_id는 auth로 자동 주입 (클라이언트가 못 정함 - 보안)
export interface CreateReviewInput {
  application_id: string;
  scores: Record<string, number>;
  comment?: string;
}

// 심사 수정 입력
// scores나 comment만 수정 가능
// scores 변경 시 total_score, is_passed는 서버에서 자동 재계산
export interface UpdateReviewInput {
  scores?: Record<string, number>;
  comment?: string;
}

// ============================================
// 조인 타입 (조회 시 자주 쓰는 형태)
// ============================================
// 심사 결과 + 지원서 정보 - 운영기관 심사 탭에서 "누구 지원서를 심사 중인지" 표시용
export interface ReviewResultWithApplication extends ReviewResult {
  applications: {
    id: string;
    user_id: string;
    form_data: Record<string, unknown>;
  } | null;
}

// 심사 결과 + 프로그램 정보 - 아카이브에서 "어느 공고의 심사인지" 표시용
export interface ReviewResultWithProgram extends ReviewResult {
  programs: {
    id: string;
    title: string;
  } | null;
}

// ============================================
// 표시용 상수
// ============================================
// 합격/불합격 라벨 - is_passed: boolean을 한글로 변환
// applications.ts의 APPLICATION_STATUS_LABEL과 별개
// (그건 지원서 진행 상태, 이건 심사 결과)
export const REVIEW_RESULT_LABEL = {
  passed: "합격",
  failed: "불합격",
} as const;

// 합격/불합격 뱃지 스타일
// APPLICATION_STATUS_STYLE의 passed/failed와 동일 색상 (의미가 같으니 색도 같음)
export const REVIEW_RESULT_STYLE = {
  passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
} as const;