// ============================================================
// 뉴스 수집 키워드 및 필터링 상수
// ============================================================

export const NEWS_KEYWORDS = [
  "시드 투자 유치",
  "프리A 투자",
  "시리즈A 투자 유치",
  "시리즈B 투자 유치",
  "시리즈C 투자 유치",
  "스타트업 투자 유치",
  "벤처투자 유치",
  "스타트업 인수합병",
  "스타트업 정부지원사업",
] as const;

export const EXCLUDE_KEYWORDS = [
  "상한가", "급등", "급락", "테마주", "수혜주", "추천주", "리딩방", "급등주",
  "무료체험", "이벤트 당첨", "할인 쿠폰", "제휴 문의",
] as const;

export const FOREIGN_ONLY_KEYWORDS = ["뉴욕증시", "나스닥", "S&P"] as const;

export const ROUND_KEYWORDS = [
  "시드", "프리A", "프리 A", "Pre-A",
  "시리즈A", "시리즈 A", "Series A",
  "시리즈B", "시리즈 B", "Series B",
  "시리즈C", "시리즈 C", "Series C",
  "시리즈D", "시리즈 D", "Series D",
  "Pre-IPO", "프리IPO", "프리 IPO",
] as const;

export const INVESTMENT_ACTION_KEYWORDS = [
  "유치", "투자", "라운드", "밸류에이션", "펀딩",
] as const;

export const STARTUP_KEYWORDS = [
  "스타트업", "벤처", "액셀러레이터", "VC", "창업",
] as const;

export const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "ref", "from",
] as const;
