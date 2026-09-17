// ============================================================
// 스타트업 뉴스 앱 내부 도메인 타입
// ============================================================

export interface StartupNews {
  id: string;
  title: string;
  description: string | null;
  url: string;
  naverUrl: string | null;
  press: string | null;
  publishedAt: string; // ISO 8601 (UTC)
  roundName: string | null;
  amountText: string | null;
}
