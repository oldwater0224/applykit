// 배지 톤 - 앱 전체 배지 색을 의미 단위로 통일하기 위한 키 (#67 4단계)
// 이름은 src/components/dashboard/statusBadge.tsx의 TONE_CLASS 키와 같다.
// 색 클래스는 statusBadge.tsx가 갖고, 도메인 상수(*_TONE)는 이 톤 이름만 갖는다.
//
// 의미
// - neutral: 중립 (회색) - 접수 마감, 일반 D-day
// - brand:   진행·정보 (파랑)
// - success: 긍정 (초록) - 합격, 접수 중
// - warning: 대기·주의 (amber) - 양식 준비 중, 심사 대기, 7일 이내 마감
// - danger:  거절 (rose) - 불합격
// - muted:   비활성 (흐린 회색) - 작성 중, 모집 전
export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "muted";
