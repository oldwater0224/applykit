// ============================================================
// 언론사 도메인 → 이름 매핑
// API에 언론사명이 없으므로 originallink 도메인에서 유추
// ============================================================

export const PRESS_DOMAIN_MAP: Record<string, string> = {
  "platum.kr": "플래텀",
  "venturesquare.net": "벤처스퀘어",
  "wowtale.net": "와우테일",
  "thebell.co.kr": "더벨",
  "mk.co.kr": "매일경제",
  "hankyung.com": "한국경제",
  "etnews.com": "전자신문",
  "zdnet.co.kr": "지디넷코리아",
  "news.mt.co.kr": "머니투데이",
  "biz.chosun.com": "조선비즈",
  "chosun.com": "조선일보",
  "donga.com": "동아일보",
  "joongang.co.kr": "중앙일보",
  "hani.co.kr": "한겨레",
  "khan.co.kr": "경향신문",
  "sedaily.com": "서울경제",
  "edaily.co.kr": "이데일리",
  "newsis.com": "뉴시스",
  "yna.co.kr": "연합뉴스",
  "yonhapnewstv.co.kr": "연합뉴스TV",
  "bloter.net": "블로터",
  "thevc.kr": "더브이씨",
  "dealsite.co.kr": "딜사이트",
  "startupn.kr": "스타트업엔",
  "besuccess.com": "비석세스",
};

export function resolvePress(originallink: string): string | null {
  if (!originallink) return null;

  try {
    const url = new URL(originallink);
    const host = url.hostname.replace(/^www\./, "");

    if (PRESS_DOMAIN_MAP[host]) {
      return PRESS_DOMAIN_MAP[host];
    }

    // 서브도메인 포함 검색 (biz.chosun.com → 조선비즈)
    for (const [domain, name] of Object.entries(PRESS_DOMAIN_MAP)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return name;
      }
    }

    return host;
  } catch {
    return null;
  }
}
