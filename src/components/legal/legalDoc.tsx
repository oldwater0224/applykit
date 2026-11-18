// 개인정보 처리방침·이용약관 문서 공통 스타일과 유틸 (#69)
// 문서형 페이지 선례가 없어 prose 플러그인 대신 토큰 기반 클래스를 한곳에 모은다.

import type { ReactNode } from "react";

export type LegalSection = {
  /** 앵커 id (목차 링크용) */
  id: string;
  /** 번호를 뺀 절 제목 */
  title: string;
  body: ReactNode;
  /** 부칙처럼 번호를 붙이지 않는 절 */
  unnumbered?: boolean;
};

/** "YYYY-MM-DD" → "YYYY년 M월 D일" (예: "2026-11-01" → "2026년 11월 1일", 시간대 변환 없이 문자열만 해석) */
export function formatLegalDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${y}년 ${m}월 ${d}일`;
}

export const LEGAL_ARTICLE_CLASS =
  "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12";

export const LEGAL_TOC_CLASS =
  "mt-6 rounded-xl border border-(--card-border) bg-(--card-bg) p-4 sm:p-5";

export const LEGAL_SECTION_CLASS = "mt-10 scroll-mt-20 first:mt-8";

export const LEGAL_H2_CLASS =
  "text-base sm:text-lg font-semibold leading-snug text-(--text-primary)";

export const LEGAL_H3_CLASS =
  "mt-4 text-sm font-semibold text-(--text-primary)";

export const LEGAL_P_CLASS =
  "mt-3 text-sm leading-relaxed text-(--text-secondary)";

export const LEGAL_OL_CLASS =
  "mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-(--text-secondary) marker:text-(--text-muted)";

export const LEGAL_UL_CLASS =
  "mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-(--text-secondary) marker:text-(--text-muted)";

export const LEGAL_TABLE_WRAPPER_CLASS =
  "mt-3 overflow-x-auto rounded-lg border border-(--card-border)";

export const LEGAL_TABLE_CLASS =
  "w-full min-w-[560px] border-collapse text-left text-sm text-(--text-secondary)";

export const LEGAL_TH_CLASS =
  "border-b border-(--hairline-strong) bg-(--card-bg) px-3 py-2.5 align-top font-semibold text-(--text-primary)";

export const LEGAL_TD_CLASS =
  "border-b border-(--hairline) px-3 py-2.5 align-top leading-relaxed";

export const LEGAL_LINK_CLASS =
  "font-medium text-(--brand-500) underline underline-offset-2 hover:text-(--brand-100) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)";

/** 확인되지 않은 값 표시 — 운영 전 반드시 실제 값으로 바꾼다 */
export const LEGAL_PLACEHOLDER_CLASS =
  "rounded-sm bg-(--accent-amber)/15 px-1 font-medium text-(--text-primary)";

/** 확인되지 않은 값. 대괄호를 그대로 보여 운영 전 치환 대상임을 드러낸다 */
export function Placeholder({ children }: { children: string }) {
  return <mark className={LEGAL_PLACEHOLDER_CLASS}>[{children}]</mark>;
}

/** 표 한 개. 모바일에서는 가로 스크롤 */
export function LegalTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className={LEGAL_TABLE_WRAPPER_CLASS}>
      <table className={LEGAL_TABLE_CLASS}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className={LEGAL_TH_CLASS}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="last:[&>td]:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className={LEGAL_TD_CLASS}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 절 제목 표기. 목차·본문 h2·상호참조가 같은 번호를 쓰도록 한곳에서 만든다 */
function sectionHeading(
  s: LegalSection,
  i: number,
  numberLabel: (n: number) => string,
) {
  return s.unnumbered ? s.title : `${numberLabel(i + 1)} ${s.title}`;
}

/**
 * 다른 절을 가리키는 앵커 링크. "제8절"처럼 번호를 하드코딩하지 않고 절 id로 찾아
 * 절 순서가 바뀌어도 번호와 링크가 함께 맞춰진다.
 * 본문 JSX에서 쓰이므로 sections 배열은 렌더 시점에 읽힌다(모듈 초기화 순서와 무관).
 */
export function LegalSectionRef({
  sections,
  id,
  numberLabel,
  format = (n, title) => `「${n} ${title}」`,
}: {
  sections: LegalSection[];
  id: string;
  numberLabel: (n: number) => string;
  /** 참조 표기. 기본은 「12. 개인정보 보호책임자」, 약관은 제6조(…) */
  format?: (numberText: string, title: string) => string;
}) {
  const i = sections.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const s = sections[i];
  const text = s.unnumbered ? `「${s.title}」` : format(numberLabel(i + 1), s.title);
  return (
    <a href={`#${id}`} className={LEGAL_LINK_CLASS}>
      {text}
    </a>
  );
}

/** 목차 + 번호 붙은 절(h2) 목록 */
export function LegalSections({
  sections,
  numberLabel,
}: {
  sections: LegalSection[];
  /** 번호 표기. 처리방침은 "1.", 약관은 "제1조" */
  numberLabel: (n: number) => string;
}) {
  return (
    <>
      <nav aria-label="목차" className={LEGAL_TOC_CLASS}>
        <p className="text-sm font-semibold text-(--text-primary)">목차</p>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-(--text-secondary) hover:text-(--brand-500) hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-(--brand-500)"
              >
                {sectionHeading(s, i, numberLabel)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          aria-labelledby={`${s.id}-title`}
          className={LEGAL_SECTION_CLASS}
        >
          <h2 id={`${s.id}-title`} className={LEGAL_H2_CLASS}>
            {sectionHeading(s, i, numberLabel)}
          </h2>
          {s.body}
        </section>
      ))}
    </>
  );
}
