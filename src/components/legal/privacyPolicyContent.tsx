// 개인정보 처리방침 본문 (#69)
// 개인정보 보호법 제30조, 같은 법 시행령 제31조의 필수 기재 사항을 절 단위로 담는다.
// 대괄호 placeholder는 확인되지 않은 값이다. 운영 전 실제 값으로 바꿔야 한다.
// 사실관계 근거: docs/work-log/privacy-consent.md

import Link from "next/link";
import {
  LEGAL_EFFECTIVE_DATE,
  PRIVACY_VERSION,
} from "@/src/lib/consent/policy";
import {
  LEGAL_LINK_CLASS,
  LEGAL_H3_CLASS,
  LEGAL_OL_CLASS,
  LEGAL_P_CLASS,
  LEGAL_UL_CLASS,
  LegalSectionRef,
  LegalSections,
  LegalTable,
  Placeholder,
  formatLegalDate,
  type LegalSection,
} from "@/src/components/legal/legalDoc";

const OPERATOR = <Placeholder>운영자명</Placeholder>;

const NUMBER_LABEL = (n: number) => `${n}.`;

/** 다른 절 참조. 「12. 개인정보 보호책임자」 형식의 앵커 링크 */
function Ref({ id }: { id: string }) {
  return (
    <LegalSectionRef sections={SECTIONS} id={id} numberLabel={NUMBER_LABEL} />
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "purpose",
    title: "개인정보의 처리 목적",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          {OPERATOR}(이하 &ldquo;운영자&rdquo;)는 다음 목적을 위하여 개인정보를
          처리합니다. 처리한 개인정보는 다음 목적 이외의 용도로 이용하지 않으며,
          목적이 바뀌는 경우 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등
          필요한 조치를 하겠습니다.
        </p>
        <ol className={LEGAL_OL_CLASS}>
          <li>
            회원 가입 및 관리: 회원 식별, 가입 의사 확인, 로그인 상태 유지, 만 14세
            미만 가입 제한, 서비스 관련 고지·통지
          </li>
          <li>
            서비스 제공: 지원사업 공고 열람, 지원서 작성·임시저장·제출, 첨부파일
            보관, 지원 현황 및 결과 확인
          </li>
          <li>
            지원서 제공: 이용자가 공고에 지원서를 작성(임시저장 포함)하거나
            제출하면 해당 공고의 운영기관이 심사·선정과 결과 안내를 위하여
            지원서를 열람할 수 있도록 제공
          </li>
          <li>서비스 운영 및 보안: 부정 이용 방지, 접속 기록 확인, 장애 대응</li>
        </ol>
      </>
    ),
  },
  {
    id: "items",
    title: "처리하는 개인정보의 항목",
    body: (
      <>
        <LegalTable
          caption="처리하는 개인정보 항목"
          headers={["구분", "항목", "수집 방법"]}
          rows={[
            [
              "회원 가입(필수)",
              "이메일, 비밀번호(일방향 암호화하여 저장), 이름",
              "회원 가입 화면에 이용자가 직접 입력",
            ],
            [
              "지원서 작성·제출",
              <>
                지원서 기본 항목(이름, 이메일, 연락처) 및 운영기관이 공고별로 정한
                항목, 이용자가 올린 첨부파일
              </>,
              "지원서 작성 화면에 이용자가 직접 입력·업로드",
            ],
            [
              "심사 과정",
              "심사 점수·합계, 심사 의견, 합격 여부, 심사자 계정 식별자",
              "운영기관이 관리자 화면에서 입력",
            ],
            [
              "동의 기록",
              "동의한 이용약관·개인정보 처리방침 버전, 만 14세 이상 확인 여부, 동의 일시",
              "회원 가입 및 재동의 시 자동으로 기록",
            ],
            [
              "자동 수집",
              "서비스 이용 기록, 접속 기록, IP 주소, 로그인 유지용 세션 쿠키",
              "서비스 이용 과정에서 자동으로 생성·수집",
            ],
          ]}
        />
        <h3 className={LEGAL_H3_CLASS}>공개된 기업 공시 정보</h3>
        <p className={LEGAL_P_CLASS}>
          이 밖에 운영자는 금융감독원 전자공시시스템(DART)에 공시된 기업의 대표자
          성명 및 기업 주소·연락처 등 공시 정보를 기업 정보 제공 목적으로
          처리합니다. 이 정보는 이용자로부터 직접 수집하는 정보가 아니며, 해당
          정보의 정보주체는 개인정보 보호법 제20조에 따라 수집 출처와 처리 목적
          등의 고지를 요구하거나 <Ref id="rights" />에 따라 처리정지를 요구할 수
          있습니다.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "개인정보의 처리 및 보유 기간",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 개인정보를 수집 시에 동의받은 보유 기간 내에서 처리·보유합니다.
        </p>
        <ol className={LEGAL_OL_CLASS}>
          <li>회원 정보: 회원 탈퇴 시까지</li>
          <li>동의 기록: 회원 탈퇴 시 지체 없이 삭제</li>
          <li>
            작성 중인 지원서(임시저장 포함): 이용자가 삭제하거나 회원 탈퇴 시까지
          </li>
          <li>
            제출된 지원서 및 첨부파일: 해당 공고의 모집 마감일로부터{" "}
            <Placeholder>보유기간</Placeholder> 보관 후 파기
          </li>
          <li>
            접속 기록 등 자동 수집 정보: 수탁자(Supabase, Vercel)의 로그 보존
            정책에 따라 <Placeholder>보존 기간</Placeholder> 보관 후 삭제
          </li>
          <li>
            다만, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당
            수사·조사 종료 시까지 보유합니다.
          </li>
          <li>
            관계 법령에 따라 보존할 필요가 있는 정보는 해당 법령이 정한 기간 동안
            보존합니다.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "third-party",
    title: "개인정보의 제3자 제공",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 이용자의 개인정보를 <Ref id="purpose" />에서 정한 목적
          범위에서만 처리하며, 이용자의 동의, 법률의 특별한 규정 등 개인정보
          보호법 제17조 및 제18조에 해당하는 경우에만 제3자에게 제공합니다.
          이용자가 공고에 지원서를 작성(임시저장 포함)하거나 제출하면 해당 공고의
          운영기관이 열람할 수 있도록 다음과 같이 제공합니다.
        </p>
        <LegalTable
          caption="개인정보 제3자 제공 내역"
          headers={["제공받는 자", "제공 목적", "제공 항목", "보유 및 이용 기간"]}
          rows={[
            [
              "이용자가 지원서를 작성(임시저장 포함)하거나 제출한 공고의 운영기관(공고 상세 화면에 표시)",
              "지원자 심사·선정, 결과 안내 및 사업 운영",
              "지원서 기재 항목(이름, 이메일, 연락처, 운영기관이 정한 항목), 첨부파일",
              <>
                제출된 지원서·첨부파일: 해당 공고의 모집 마감일로부터{" "}
                <Placeholder>보유기간</Placeholder> 보관 후 파기
                <br />
                작성 중인 지원서: 이용자가 삭제하거나 회원 탈퇴 시까지
              </>,
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "outsourcing",
    title: "개인정보 처리업무의 위탁",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리업무를
          위탁하고 있습니다. 위탁계약 시 개인정보 보호법 제26조에 따라 위탁업무
          수행 목적 외 처리 금지, 안전성 확보 조치, 재위탁 제한 등을 정하고
          수탁자가 개인정보를 안전하게 처리하는지 감독합니다.
        </p>
        <LegalTable
          caption="개인정보 처리 위탁 내역"
          headers={["수탁자", "위탁 업무"]}
          rows={[
            [
              "Supabase Inc.",
              "데이터베이스 운영, 회원 인증, 첨부파일 저장, 인증 메일 발송",
            ],
            ["Vercel Inc.", "웹 서비스 호스팅 및 서버 운영"],
          ]}
        />
        <p className={LEGAL_P_CLASS}>
          ※ 인증 메일 발송:{" "}
          <Placeholder>별도 메일 발송 업체 사용 시 추가</Placeholder>
        </p>
        <p className={LEGAL_P_CLASS}>
          위탁업무의 내용이나 수탁자가 바뀌는 경우 지체 없이 이 처리방침을 통하여
          공개합니다.
        </p>
      </>
    ),
  },
  {
    id: "overseas",
    title: "개인정보의 국외 이전",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 <Ref id="outsourcing" />의 위탁 업무 수행을 위하여 다음과 같이 개인정보를 국외로
          이전합니다. (개인정보 보호법 제28조의8)
        </p>
        <LegalTable
          caption="개인정보 국외 이전 내역"
          headers={[
            "이전받는 자(연락처)",
            "이전 국가",
            "이전 항목",
            "이전 시기 및 방법",
            "이용 목적",
            "보유 및 이용 기간",
          ]}
          rows={[
            [
              <>
                Supabase Inc.
                <br />(<Placeholder>개인정보 담당 연락처</Placeholder>)
              </>,
              <Placeholder key="c">리전 확인 필요</Placeholder>,
              <>
                <Ref id="items" />의 회원 정보, 동의 기록, 지원서, 첨부파일, 접속
                기록
              </>,
              "서비스 이용 시점에 네트워크를 통하여 전송",
              "데이터베이스 운영, 회원 인증, 파일 저장, 인증 메일 발송",
              <>
                <Ref id="retention" />에 따른 보유 기간 종료 또는 위탁계약 종료
                시까지
              </>,
            ],
            [
              <>
                Vercel Inc.
                <br />(<Placeholder>개인정보 담당 연락처</Placeholder>)
              </>,
              <Placeholder key="c">리전 확인 필요</Placeholder>,
              "서비스 이용 과정에서 전송되는 정보(접속 기록, IP 주소 등)",
              "서비스 이용 시점에 네트워크를 통하여 전송",
              "웹 서비스 호스팅 및 서버 운영",
              <>
                <Ref id="retention" />에 따른 보유 기간 종료 또는 위탁계약 종료
                시까지
              </>,
            ],
          ]}
        />
        <h3 className={LEGAL_H3_CLASS}>국외 이전을 거부하는 방법과 효과</h3>
        <p className={LEGAL_P_CLASS}>
          이용자는 <Ref id="officer" />에게 이메일로 국외 이전 거부를 요청할 수
          있습니다. 다만 위 업체는 서비스 제공에 꼭 필요한 기반 시설이므로, 국외
          이전을 거부하시면 회원 가입 및 서비스 이용이 불가능합니다. 이 경우 회원
          탈퇴를 요청하실 수 있습니다.
        </p>
      </>
    ),
  },
  {
    id: "destruction",
    title: "개인정보의 파기 절차 및 방법",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          파기 사유: 보유 기간이 지나거나 처리 목적이 달성되는 등 개인정보가
          불필요하게 되었을 때에는 지체 없이 파기합니다.
        </li>
        <li>
          파기 절차: 파기 사유가 발생한 개인정보를 선정하고, 개인정보
          보호책임자의 확인을 거쳐 파기합니다. 관계 법령에 따라 보존해야 하는
          정보는 다른 정보와 분리하여 보관합니다.
        </li>
        <li>
          파기 방법: 전자적 파일 형태의 정보는 복구·재생할 수 없도록 기술적
          방법으로 삭제합니다. 첨부파일은 파기 사유가 발생하면 저장소에서 별도로
          지체 없이 삭제합니다.
        </li>
      </ol>
    ),
  },
  {
    id: "rights",
    title: "정보주체의 권리·의무 및 행사 방법",
    body: (
      <>
        <ol className={LEGAL_OL_CLASS}>
          <li>
            이용자는 운영자에게 언제든지 개인정보 열람, 정정·삭제, 처리정지 및
            동의 철회(회원 탈퇴)를 요구할 수 있습니다. <Ref id="items" />의 공개된
            기업 공시 정보의 정보주체도 열람, 정정·삭제, 처리정지를 요구할 수
            있습니다.
          </li>
          <li>
            권리 행사는 <Ref id="officer" /> 이메일로 요청하시면 되며,
            운영자는 본인 확인 후 지체 없이(요청받은 날부터 10일 이내) 조치하고
            결과를 알려드립니다. 회원 탈퇴도 같은 방법으로 요청합니다.
          </li>
          <li>
            법정대리인이나 위임을 받은 자 등 대리인을 통하여 권리를 행사할 수
            있습니다. 이 경우 위임장을 제출하셔야 합니다.
          </li>
          <li>
            다른 법령에서 그 개인정보가 수집 대상으로 명시된 경우 등에는 삭제 또는
            처리정지 요구가 제한될 수 있습니다.
          </li>
          <li>
            운영기관이 열람할 수 있는 지원서(임시저장 포함)는 해당 운영기관도
            처리하고 있으므로, 운영자는 요청 내용을 해당 운영기관에 전달합니다.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "children",
    title: "만 14세 미만 아동의 개인정보",
    body: (
      <p className={LEGAL_P_CLASS}>
        서비스는 만 14세 미만 아동의 회원 가입을 받지 않습니다. 가입 시 만 14세
        이상임을 확인하며, 만 14세 미만 아동의 개인정보가 수집된 사실을 알게 된
        경우 지체 없이 파기합니다.
      </p>
    ),
  },
  {
    id: "security",
    title: "개인정보의 안전성 확보 조치",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 개인정보 보호법 제29조에 따라 다음과 같은 조치를 하고 있습니다.
        </p>
        <ol className={LEGAL_OL_CLASS}>
          <li>
            관리적 조치: 개인정보 처리 권한자를 최소한으로 지정하고, 수탁자의
            처리 현황을 점검합니다.
          </li>
          <li>
            기술적 조치: 비밀번호를 일방향 암호화하여 저장하고, 전송 구간을
            암호화(HTTPS)하며, 데이터베이스와 첨부파일에 사용자·운영기관 단위
            접근 권한을 적용합니다.
          </li>
          <li>
            물리적 조치: 개인정보는 수탁자가 운영하는 데이터센터에 보관되며,
            출입 통제는 수탁자의 보안 정책에 따릅니다.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "cookies",
    title: "개인정보 자동 수집 장치의 설치·운영 및 거부",
    body: (
      <ol className={LEGAL_OL_CLASS}>
        <li>
          서비스는 로그인 상태를 유지하기 위한 필수 세션 쿠키만 사용합니다.
        </li>
        <li>
          방문 분석이나 광고를 위한 쿠키 및 추적 도구는 사용하지 않습니다.
        </li>
        <li>
          이용자는 웹 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 다만 쿠키
          저장을 거부하면 로그인이 필요한 기능(지원서 작성·제출 등)을 이용할 수
          없습니다.
        </li>
      </ol>
    ),
  },
  {
    id: "officer",
    title: "개인정보 보호책임자",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          운영자는 개인정보 처리에 관한 업무를 총괄하고, 관련 불만 처리와 피해
          구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <ul className={LEGAL_UL_CLASS}>
          <li>
            성명: <Placeholder>성명</Placeholder>
          </li>
          <li>
            이메일: <Placeholder>이메일</Placeholder>
          </li>
        </ul>
        <p className={LEGAL_P_CLASS}>
          개인정보 열람·정정·삭제·처리정지 요구, 회원 탈퇴 요청과 개인정보 관련
          문의는 위 이메일로 보내주시면 지체 없이 답변하겠습니다.
        </p>
      </>
    ),
  },
  {
    id: "remedy",
    title: "권익침해 구제 방법",
    body: (
      <>
        <p className={LEGAL_P_CLASS}>
          이용자는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁
          해결이나 상담 등을 신청할 수 있습니다.
        </p>
        <ul className={LEGAL_UL_CLASS}>
          <li>
            개인정보분쟁조정위원회: (국번없이) 1833-6972,{" "}
            <a
              href="https://www.kopico.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className={LEGAL_LINK_CLASS}
            >
              www.kopico.go.kr
            </a>
          </li>
          <li>
            개인정보침해신고센터: (국번없이) 118,{" "}
            <a
              href="https://privacy.kisa.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className={LEGAL_LINK_CLASS}
            >
              privacy.kisa.or.kr
            </a>
          </li>
          <li>대검찰청: (국번없이) 1301</li>
          <li>경찰청: (국번없이) 182</li>
        </ul>
      </>
    ),
  },
  {
    id: "changes",
    title: "개인정보 처리방침의 변경",
    body: (
      <>
        <ol className={LEGAL_OL_CLASS}>
          <li>
            이 개인정보 처리방침은 {formatLegalDate(LEGAL_EFFECTIVE_DATE)}{" "}
            제정되었으며, 서비스에 게시한 날부터 적용됩니다. (버전{" "}
            {PRIVACY_VERSION})
          </li>
          <li>
            내용이 추가·삭제·수정되는 경우 적용 7일 전부터(이용자 권리에 중요한
            변경은 30일 전부터) 서비스 화면을 통하여 알립니다.
          </li>
        </ol>
        <p className={LEGAL_P_CLASS}>
          서비스 이용 조건은{" "}
          <Link href="/terms" className={LEGAL_LINK_CLASS}>
            이용약관
          </Link>
          에서 확인할 수 있습니다.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyContent() {
  return (
    <>
      <p className={LEGAL_P_CLASS}>
        {OPERATOR}(이하 &ldquo;운영자&rdquo;)는 ApplyKit 서비스(이하
        &ldquo;서비스&rdquo;)를 이용하는 정보주체(이하 &ldquo;이용자&rdquo;)의
        개인정보를 개인정보 보호법 등
        관계 법령에 따라 보호하고, 관련 고충을 신속하게 처리할 수 있도록 다음과
        같이 개인정보 처리방침을 수립·공개합니다.
      </p>
      <LegalSections sections={SECTIONS} numberLabel={NUMBER_LABEL} />
    </>
  );
}
