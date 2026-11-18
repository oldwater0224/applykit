import type { Metadata } from "next";
import { PageTitle } from "@/src/components/layout/pageTitle";
import TermsContent from "@/src/components/legal/termsContent";
import {
  LEGAL_ARTICLE_CLASS,
  formatLegalDate,
} from "@/src/components/legal/legalDoc";
import { LEGAL_EFFECTIVE_DATE, TERMS_VERSION } from "@/src/lib/consent/policy";

export const metadata: Metadata = {
  title: "이용약관 | ApplyKit",
  description: "ApplyKit 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <article aria-labelledby="terms-title" className={LEGAL_ARTICLE_CLASS}>
      <PageTitle
        title={<span id="terms-title">이용약관</span>}
        description={`시행일 ${formatLegalDate(LEGAL_EFFECTIVE_DATE)} · 버전 ${TERMS_VERSION}`}
      />
      <TermsContent />
    </article>
  );
}
