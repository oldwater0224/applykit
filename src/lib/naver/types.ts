// ============================================================
// 네이버 뉴스 검색 API 응답 타입
// ============================================================

export interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string; // RFC 1123
}

export interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
}
