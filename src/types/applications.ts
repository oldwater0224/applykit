
// 지원서 상태값 - DB의 status 컬럼(text)을 타입으로 좁혀서 관리
// draft: 작성 중(파일 업로드 시 자동 생성되는 내부 상태)
// submitted: 제출 완료
// passed: 합격 (심사 결과 합격)
// failed: 불합격 (심사 결과 불합격)
// (reviewing은 MVP에서 제거 - 심사는 review_results 테이블에서 독립 관리)

import { FormSchema } from "./form";

// union 타입으로 좁혀두면 switch/if 분기 시 누락 케이스를 컴파일 타임에 잡음
export type ApplicationStatus = "draft" | "submitted" | "passed" | "failed";

// form_data(jsonb)에 들어가는 실제 구조
// key는 form.ts에서 정의한 FormField의 id,
// value는 필드 타입에 따라 다양하므로 union으로 제한
// (checkbox는 string[], file은 업로드된 파일 URL 등)
// jsonb에 Date 객체 같은 예상 밖 값이 들어가는 걸 방지
export type ApplicationFormData = Record<
  string,
  string | number | boolean | string[] | null
>;

// DB applications 테이블과 1:1 매칭되는 기본 Row 타입
// Supabase에서 select * 했을 때 받는 형태
export interface Application {
  id: string;
  program_id: string;
  user_id: string;
  form_data: ApplicationFormData;
  status: ApplicationStatus;
  is_complete: boolean;
  submitted_at: string | null; // 제출 전에는 null
  created_at: string;
}

// 지원서 생성 시 필요한 입력값
// id/created_at은 DB가 자동 생성, user_id는 Server Action에서 auth로 주입
// 클라이언트가 user_id를 직접 넘기면 타인 명의로 생성 가능하므로 타입에서 제외
export interface CreateApplicationInput {
  program_id: string;
  form_data: ApplicationFormData;
  is_complete?: boolean; // 임시저장이면 false, 제출이면 true
}

// 지원서 수정 시 입력값
// form_data/is_complete/status만 수정 가능 - program_id, user_id는 변경 불가
export interface UpdateApplicationInput {
  form_data?: ApplicationFormData;
  is_complete?: boolean;
  status?: ApplicationStatus;
}

// 목록/상세 조회 시 프로그램 정보를 함께 가져오는 조인 타입
// Supabase의 select('*, programs(...)') 결과와 매칭
// 목록 페이지에서 "어떤 공고에 지원했는지"를 바로 보여주기 위함
// 기본 Application과 분리해서 조인 여부를 타입으로 구분
export interface ApplicationWithProgram extends Application {
  programs: {
    id: string;
    title: string;
    deadline: string | null;
    org_id: string | null;
    form_schema: FormSchema | null;
  } | null;
}

// 상태값을 한글 라벨로 매핑 - UI에서 공통으로 쓰기 위해 상수로 고정
// as const로 선언해 key 타입이 ApplicationStatus와 일치하는지 보장
// 나중에 ApplicationStatus에 값이 추가되면 여기서 컴파일 에러가 나서 놓치지 않음
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "작성 중",
  submitted: "제출 완료",
  passed : "합격",
  failed : "불합격",
} as const;
// 상태별 뱃지 스타일 - UI 전역에서 공통으로 사용
// 컨벤션상 bg-gray-*/text-gray-*는 금지 - border만 gray 허용
// as const로 모든 상태 누락 시 컴파일 에러 유도
export const APPLICATION_STATUS_STYLE: Record<ApplicationStatus, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
} as const;