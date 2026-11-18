import type { Metadata } from "next";
import { PageTitle } from "@/src/components/layout/pageTitle";
import PrivacyPolicyContent from "@/src/components/legal/privacyPolicyContent";
import {
  LEGAL_ARTICLE_CLASS,
  formatLegalDate,
} from "@/src/components/legal/legalDoc";
import {
  LEGAL_EFFECTIVE_DATE,
  PRIVACY_VERSION,
} from "@/src/lib/consent/policy";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | ApplyKit",
  description: "ApplyKit 서비스의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <article aria-labelledby="privacy-title" className={LEGAL_ARTICLE_CLASS}>
      <PageTitle
        title={<span id="privacy-title">개인정보 처리방침</span>}
        description={`제정일 ${formatLegalDate(LEGAL_EFFECTIVE_DATE)} · 버전 ${PRIVACY_VERSION}`}
      />
      <PrivacyPolicyContent />
    </article>
  );
}
