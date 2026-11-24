"use client";

// 가입·재동의 화면 공용 필수 동의 체크박스 (#69)
// - 네이티브 checkbox. name은 CONSENT_FIELDS 값, 체크 시 "on"이 전송된다.
// - controlled 상태라 서버 액션 에러 후 폼이 리셋돼도 체크가 유지된다.
// - 각 항목에 required를 걸어 브라우저 단에서도 미체크 제출을 막는다. 최종 검증은 서버.

import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONSENT_FIELDS } from "@/src/lib/consent/policy";

type ConsentKey = keyof typeof CONSENT_FIELDS;

const ITEMS: { key: ConsentKey; label: string; href?: string; linkLabel?: string }[] = [
  { key: "age14", label: "만 14세 이상입니다" },
  {
    key: "terms",
    label: "이용약관 동의",
    href: "/terms",
    linkLabel: "이용약관 전문 보기 (새 탭)",
  },
  {
    key: "privacy",
    label: "개인정보 수집·이용 동의",
    href: "/privacy",
    linkLabel: "개인정보 처리방침 전문 보기 (새 탭)",
  },
];

const INITIAL: Record<ConsentKey, boolean> = {
  age14: false,
  terms: false,
  privacy: false,
};

const CHECKBOX_CLASS =
  "mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-(--brand-600) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)";

export function ConsentCheckboxes({
  className,
  refusalEffect = "회원 가입을 할 수 없습니다.",
}: {
  className?: string;
  /** 동의 거부 시 불이익 문구. 재동의 화면은 "서비스를 이용할 수 없습니다." */
  refusalEffect?: string;
}) {
  const [checked, setChecked] = useState(INITIAL);
  const baseId = useId();
  const allChecked = ITEMS.every(({ key }) => checked[key]);
  const summaryId = `${baseId}-privacy-summary`;

  const toggleAll = (next: boolean) =>
    setChecked({ age14: next, terms: next, privacy: next });

  const toggleOne = (key: ConsentKey, next: boolean) =>
    setChecked((prev) => ({ ...prev, [key]: next }));

  return (
    <fieldset
      className={cn(
        "rounded-lg border border-(--hairline-strong) bg-(--navy-800)/50 p-3 sm:p-4",
        className,
      )}
    >
      <legend className="sr-only">약관 및 개인정보 수집·이용 동의</legend>

      {/* 전체 동의는 편의 기능이라 name 없이 둔다 */}
      <label
        htmlFor={`${baseId}-all`}
        className="flex cursor-pointer items-start gap-2.5 text-sm font-semibold text-(--text-primary)"
      >
        <input
          id={`${baseId}-all`}
          type="checkbox"
          checked={allChecked}
          onChange={(e) => toggleAll(e.target.checked)}
          className={CHECKBOX_CLASS}
        />
        전체 동의
      </label>

      <div aria-hidden className="my-3 h-px bg-(--hairline-strong)" />

      <ul className="space-y-2.5">
        {ITEMS.map(({ key, label, href, linkLabel }) => {
          const inputId = `${baseId}-${key}`;
          return (
            <li key={key}>
              <div className="flex items-start justify-between gap-2">
                <label
                  htmlFor={inputId}
                  className="flex min-w-0 cursor-pointer items-start gap-2.5 text-sm text-(--text-secondary)"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    name={CONSENT_FIELDS[key]}
                    required
                    checked={checked[key]}
                    onChange={(e) => toggleOne(key, e.target.checked)}
                    aria-describedby={key === "privacy" ? summaryId : undefined}
                    className={CHECKBOX_CLASS}
                  />
                  <span>
                    <span className="font-medium text-(--brand-500)">(필수)</span>{" "}
                    {label}
                  </span>
                </label>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={linkLabel}
                    className="inline-flex shrink-0 items-center gap-0.5 text-xs sm:text-[13px] text-(--text-muted) underline underline-offset-2 hover:text-(--text-primary) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)"
                  >
                    전문 보기
                    <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                )}
              </div>

              {key === "privacy" && (
                <PrivacySummary id={summaryId} refusalEffect={refusalEffect} />
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/** 개인정보 보호법 제15조 제2항 고지 사항 요약 (제22조 제2항: 중요 내용 명확 표시) */
function PrivacySummary({
  id,
  refusalEffect,
}: {
  id: string;
  refusalEffect: string;
}) {
  return (
    <dl
      id={id}
      className="mt-2 ml-6.5 space-y-1 rounded-md border border-(--hairline) bg-(--card-bg) p-3 text-xs sm:text-[13px] leading-relaxed text-(--text-secondary)"
    >
      <div>
        <dt className="inline font-semibold text-(--text-primary)">수집 항목: </dt>
        <dd className="inline font-semibold text-(--text-primary)">
          이메일, 비밀번호, 이름 / (지원서 작성 시) 연락처, 공고별 지원 항목,
          첨부파일
        </dd>
      </div>
      <div>
        <dt className="inline">수집·이용 목적: </dt>
        <dd className="inline">
          회원 식별·가입 의사 확인, 지원서 작성·제출 등 서비스 제공, 서비스 관련
          고지
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold text-(--text-primary)">보유 기간: </dt>
        <dd className="inline font-semibold text-(--text-primary)">
          회원 정보는 탈퇴 시까지, 작성 중인 지원서는 삭제하거나 탈퇴 시까지,
          제출된 지원서·첨부파일은 모집 마감일로부터 1년
        </dd>
      </div>
      <div>
        <dt className="sr-only">동의 거부 권리: </dt>
        <dd>
          동의를 거부할 권리가 있으며,{" "}
          <strong className="font-semibold text-(--text-primary)">
            거부하시면 {refusalEffect}
          </strong>
        </dd>
      </div>
    </dl>
  );
}
