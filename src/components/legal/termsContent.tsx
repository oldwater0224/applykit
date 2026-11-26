// 서비스 이용약관 본문 (#69)
// 운영자·보유 기간 등은 확정값이다. 바뀌면 개인정보 처리방침(privacyPolicyContent.tsx)과 함께 갱신한다.

import Link from "next/link";
import {
  LEGAL_EFFECTIVE_DATE,
  TERMS_VERSION,
} from "@/src/lib/consent/policy";
import {
  LEGAL_LINK_CLASS,
  LEGAL_OL_CLASS,
  LEGAL_P_CLASS,
  LegalSectionRef,
  LegalSections,
  formatLegalDate,
  type LegalSection,
} from "@/src/components/legal/legalDoc";

const OPERATOR = "정헌수";

const NUMBER_LABEL = (n: number) => `제${n}조`;

/** 다른 조 참조. 제6조(운영자, 회원 및 운영기관의 의무) 형식의 앵커 링크 */
function Ref({ id }: { id: string }) {
  return (
    <LegalSectionRef
      sections={SECTIONS}
      id={id}
      numberLabel={NUMBER_LABEL}
      format={(n, title) => `${n}(${title})`}
    />
  );
}

const PRIVACY_LINK = (
  <Link href="/privacy" className={LEGAL_LINK_CLASS}>
    개인정보 처리방침
  </Link>
);

const SECTIONS: LegalSection[] = [
  {
    id: "purpose",
    title: "목적",
    body: (
      <p className={LEGAL_P_CLASS}>
        이 약관은 {OPERATOR}(이하 &ldquo;운영자&rdquo;)가 제공하는 ApplyKit
        서비스(이하 &ldquo;서비스&rdquo;)의 이용 조건과 절차, 운영자와 회원의
        권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.
      </p>
    ),
  },
  {
    id: "definitions",
    title: "정의",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          &ldquo;서비스&rdquo;란 운영자가 제공하는 스타트업·투자 정보 열람,
          지원사업 공고 열람, 지원서 작성·제출 및 관련 부가 기능을 말합니다.
        </li>
        <li>
          &ldquo;회원&rdquo;이란 이 약관에 동의하고 회원 가입을 하여 서비스를
          이용하는 자를 말합니다.
        </li>
        <li>
          &ldquo;운영기관&rdquo;이란 서비스에 지원사업 공고를 게시하고 제출된
          지원서를 심사하는 기관으로서 운영자가 권한을 부여한 자를 말합니다.
        </li>
        <li>
          &ldquo;지원서&rdquo;란 회원이 공고에 지원하기 위하여 서비스에서
          작성하거나 제출한 내용과 첨부파일을 말합니다.
        </li>
      </ol>
    ),
  },
  {
    id: "effect",
    title: "약관의 효력 및 변경",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          이 약관은 서비스 화면에 게시하고 회원이 동의함으로써 효력이 생깁니다.
        </li>
        <li>
          운영자는 관계 법령을 위반하지 않는 범위에서 이 약관을 변경할 수
          있습니다. 약관을 변경하는 경우 시행일자와 변경 사유를 시행일 7일
          전부터(회원에게 불리한 변경은 30일 전부터) 서비스 화면에 공지합니다.
        </li>
        <li>
          회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴를
          요청할 수 있습니다. 변경된 약관에 대한 동의가 필요한 경우 운영자는
          서비스 이용 전에 동의를 요청할 수 있습니다.
        </li>
        <li>
          이 약관에서 정하지 않은 사항은 관계 법령과 {PRIVACY_LINK}에 따릅니다.
        </li>
      </ol>
    ),
  },
  {
    id: "account",
    title: "회원 가입 및 계정 관리",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          회원 가입은 가입하려는 자가 이 약관과 개인정보 수집·이용에 동의하고 가입
          양식을 작성하여 신청하면, 운영자가 승낙함으로써 성립합니다.
        </li>
        <li>만 14세 미만인 자는 회원으로 가입할 수 없습니다.</li>
        <li>
          운영자는 타인의 정보를 도용하거나 허위 정보를 기재한 신청 등에 대하여
          승낙하지 않거나 사후에 이용을 제한할 수 있습니다.
        </li>
        <li>
          회원은 자신의 계정과 비밀번호를 관리할 책임이 있으며, 이를 제3자가
          이용하도록 해서는 안 됩니다. 계정이 도용된 사실을 안 경우 즉시 운영자에게
          알려야 합니다.
        </li>
      </ol>
    ),
  },
  {
    id: "service",
    title: "서비스의 내용",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          운영자는 다음 서비스를 제공합니다.
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>스타트업, 투자, 투자자 등 공개 정보 열람</li>
            <li>운영기관이 게시한 지원사업 공고 열람</li>
            <li>지원서 작성, 임시저장, 첨부파일 업로드 및 제출</li>
            <li>지원 현황 및 결과 확인</li>
            <li>운영기관을 위한 공고 관리 및 지원서 심사 기능</li>
          </ul>
        </li>
        <li>
          지원사업 공고의 내용, 모집 기간, 심사 기준과 선정 결과는 각 운영기관이
          정하고 책임집니다. 운영자는 공고와 심사 절차를 위한 도구를 제공합니다.
        </li>
        <li>
          지원서는 공고의 마감 시각(한국 표준시 기준)까지 제출할 수 있습니다.
        </li>
        <li>
          회원이 공고에 지원서를 작성(임시저장 포함)하거나 제출하면 해당 공고의
          운영기관이 지원서와 첨부파일을 열람할 수 있습니다. 자세한 내용은{" "}
          {PRIVACY_LINK}을 따릅니다.
        </li>
      </ol>
    ),
  },
  {
    id: "duties",
    title: "운영자, 회원 및 운영기관의 의무",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          운영자는 관계 법령과 이 약관을 지키며, 지속적이고 안정적으로 서비스를
          제공하기 위하여 노력합니다. 운영자는 {PRIVACY_LINK}에 따라 회원의
          개인정보를 보호합니다.
        </li>
        <li>
          회원은 다음 행위를 해서는 안 됩니다: 허위 정보 기재, 타인의 정보 도용,
          타인의 권리 침해, 서비스의 정상적인 운영을 방해하는 행위, 악성 코드가
          포함된 파일 업로드, 관계 법령에 위반되는 행위.
        </li>
        <li>
          운영자는 운영기관과 별도 계약을 통하여 운영기관에 다음 의무를
          부과합니다.
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              열람한 지원서와 개인정보를 공고에서 밝힌 심사·선정 목적 범위에서만
              이용하고, 개인정보 보호법 등 관계 법령을 지킬 것
            </li>
            <li>공고 내용을 정확하게 게시하고, 심사 결과를 공정하게 처리할 것</li>
          </ul>
        </li>
      </ol>
    ),
  },
  {
    id: "content",
    title: "지원서에 대한 책임",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          지원서의 내용과 첨부파일에 대한 책임은 이를 작성·업로드한 회원에게
          있습니다.
        </li>
        <li>
          지원서의 저작권은 작성한 회원에게 있으며, 운영자와 해당 운영기관은 지원
          접수·심사와 서비스 제공에 필요한 범위에서만 이를 이용합니다.
        </li>
        <li>
          운영자는 지원서가 타인의 권리를 침해하거나 관계 법령에 위반되는 것이
          명백한 경우 회원에게 사유를 알리고 해당 지원서의 제출을 제한할 수
          있습니다.
        </li>
      </ol>
    ),
  },
  {
    id: "suspension",
    title: "서비스의 변경 및 중단",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          운영자는 설비 점검·교체, 장애, 외부 서비스 제공자의 사정 등 부득이한
          사유가 있는 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수
          있습니다.
        </li>
        <li>
          운영자는 서비스를 중단하는 경우 사전에 서비스 화면에 공지합니다. 다만
          사전에 알릴 수 없는 부득이한 사유가 있는 경우 사후에 공지할 수 있습니다.
        </li>
      </ol>
    ),
  },
  {
    id: "withdrawal",
    title: "회원 탈퇴 및 이용 제한",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          회원은 언제든지 탈퇴를 요청할 수 있으며, {PRIVACY_LINK}에 기재된
          개인정보 보호책임자 이메일로 요청하면 운영자는 지체 없이 처리합니다.
        </li>
        <li>
          탈퇴 시 회원 정보와 작성 중인 지원서(임시저장 포함)는 지체 없이
          파기합니다. 다만 제출된 지원서와 첨부파일은 해당 공고의 모집
          마감일로부터 6개월 보관 후 파기합니다.
          자세한 내용은 {PRIVACY_LINK}을 따릅니다.
        </li>
        <li>
          운영자는 회원이 <Ref id="duties" />에서 정한 회원의 의무를 위반한 경우 사전 통지 후 서비스 이용을
          제한하거나 회원 자격을 정지·상실시킬 수 있습니다. 긴급한 경우에는 사후에
          통지할 수 있습니다.
        </li>
      </ol>
    ),
  },
  {
    id: "liability",
    title: "책임의 제한",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          운영자는 천재지변, 이에 준하는 불가항력, 회원의 귀책 사유로 인한 서비스
          이용 장애에 대하여 책임을 지지 않습니다.
        </li>
        <li>
          운영자는 운영기관이 게시한 공고의 내용, 심사 및 선정 결과에 대하여
          책임을 지지 않습니다. 다만 운영자의 귀책 사유로 인한 손해는 그렇지
          않습니다.
        </li>
        <li>
          서비스에서 제공하는 기업·투자 정보는 공개된 자료를 바탕으로 한 참고
          정보이며, 운영자는 그 정확성이나 완전성을 보증하지 않습니다.
        </li>
      </ol>
    ),
  },
  {
    id: "dispute",
    title: "분쟁 해결 및 관할",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          운영자와 회원은 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여
          성실히 협의합니다.
        </li>
        <li>이 약관과 서비스 이용에 관하여는 대한민국 법을 적용합니다.</li>
        <li>
          서비스 이용으로 발생한 분쟁에 관한 소송은 민사소송법에 따른 관할 법원에
          제기합니다.
        </li>
      </ol>
    ),
  },
  {
    id: "addendum",
    title: "부칙",
    unnumbered: true,
    body: (
      <p className={LEGAL_P_CLASS}>
        이 약관은 {formatLegalDate(LEGAL_EFFECTIVE_DATE)}부터 시행합니다. 다만,
        이 약관 게시 전에 가입한 회원에게는 이 약관에 동의한 날부터 적용합니다.
        (버전 {TERMS_VERSION})
      </p>
    ),
  },
];

export default function TermsContent() {
  return <LegalSections sections={SECTIONS} numberLabel={NUMBER_LABEL} />;
}
