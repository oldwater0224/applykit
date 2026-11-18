import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PAGE_DESCRIPTION_CLASS,
  PAGE_TITLE_CLASS,
} from "@/src/components/layout/pageTitle";
import { formatLegalDate } from "@/src/components/legal/legalDoc";
import { LEGAL_EFFECTIVE_DATE } from "@/src/lib/consent/policy";
import { signOut } from "@/src/lib/actions/auth";
import { ConsentForm } from "./consentForm";

// 기존 가입자 재동의 화면 (#69). 로그인 확인과 진입 조건은 proxy가 맡는다.
export const metadata: Metadata = {
  title: "약관 동의 | ApplyKit",
  robots: { index: false, follow: false },
};

const INLINE_LINK_CLASS =
  "font-medium text-(--brand-500) underline underline-offset-2 hover:text-(--brand-100) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = typeof redirect === "string" ? redirect : "";
  const effectiveDate = formatLegalDate(LEGAL_EFFECTIVE_DATE);

  return (
    <section
      aria-labelledby="consent-title"
      className="flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-(--card-border) bg-(--card-bg) p-6 sm:p-8">
          <h1 id="consent-title" className={cn(PAGE_TITLE_CLASS, "text-center")}>
            약관 동의가 필요합니다
          </h1>
          <p className={cn(PAGE_DESCRIPTION_CLASS, "text-center")}>
            {effectiveDate} 시행
          </p>

          <div className="mt-6 space-y-2 text-sm leading-relaxed text-(--text-secondary)">
            <p>
              ApplyKit의{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className={INLINE_LINK_CLASS}
              >
                이용약관
              </Link>
              과{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={INLINE_LINK_CLASS}
              >
                개인정보 처리방침
              </Link>
              이 새로 마련되었습니다({effectiveDate} 시행).
            </p>
            <p>
              서비스를 계속 이용하시려면 아래 항목을 확인하고 동의해주세요.
            </p>
          </div>

          <div className="mt-6">
            <ConsentForm redirectTo={redirectTo} />
          </div>

          {/* 동의하지 않는 사용자의 출구. 탈퇴는 처리방침의 이메일 요청 절차를 따른다 */}
          <form action={signOut} className="mt-4 text-center">
            <button
              type="submit"
              className="text-xs sm:text-[13px] text-(--text-muted) underline underline-offset-2 hover:text-(--text-primary) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)"
            >
              동의하지 않고 로그아웃
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
