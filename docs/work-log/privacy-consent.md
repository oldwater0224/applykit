# 개인정보 처리방침·이용약관·가입 동의

상태: 운영 반영 완료 (2026-11-19). 남은 일은 맨 아래 "운영 반영" 참고.

## 사전 조사 결과 (서브에이전트 3개, 읽기 전용)

### debugger: 기준선 (develop c87fd78)
- tsc 0 / lint 0 error, 1 warning(`src/lib/naver/sync.ts:221` 기존) / test 16 suites 264 passed / build 성공
- 가입·로그인 테스트 없음. 순수 함수 분리 후 `src/__tests__/lib/consent/`, 액션은 `src/__tests__/lib/actions/auth.test.ts` 제안
- `src/proxy.ts:28` 보호 경로는 `/dashboard`, `/applications` 뿐 → `/privacy`, `/terms` 비로그인 접근 가능
- 가입 경로는 `auth.ts:38` signUp 하나. 단 anon 키로 `auth.signUp` 직접 호출 시 서버 액션 검증 우회 가능
- Confirm email ON이면 signUp 직후 세션이 없어 사용자 권한 insert 실패 → 트리거 방식이 안전

### ui-builder: 화면
- 가입 `src/app/signup/page.tsx` (useActionState, 네이티브 input), 액션 `src/lib/actions/auth.ts`
- 푸터 없음. 루트 layout에 신규 푸터, `/dashboard`(h-screen 셸)에서는 숨기고 사이드바 `DashboardOrgFooter` 근처에 링크
- 문서형 페이지 선례·prose 없음 → TSX 시맨틱 마크업, `PageTitle` 재사용
- Checkbox/Dialog 컴포넌트 없음 → 네이티브 checkbox(controlled, 폼 리셋 대비)
- 약관 전문은 모달 대신 별도 페이지 + 새 탭

### logic-builder: 데이터·처리자
- 수집 항목: auth.users(이메일, 비밀번호 해시, 이름), applications.form_data(이름·이메일·연락처 + 운영기관 정의 항목), application_files + Storage `applications` 버킷, review_results(심사 의견), org_members
- companies에 DART 대표자명·주소·전화(공개 개인정보)
- 외부 처리자: Supabase(DB/Auth/Storage/인증메일), Vercel(호스팅·크론). 분석 도구 없음. DART·네이버 API로 이용자 정보 전송 없음
- 쿠키: Supabase 세션 쿠키만. localStorage 미사용
- 회원 탈퇴 기능 없음. Storage는 FK cascade로 안 지워짐
- 운영기관은 자기 공고의 draft 포함 지원서 전체와 첨부파일 열람 가능
- 기초 스키마(applications 등)는 저장소에 마이그레이션 없음 → FK 확인 불가
- 오픈 리다이렉트: `auth.ts:88` `//evil.com` 통과, `auth/callback/route.ts:14`
- 비밀번호 최소 길이 서버 6 / 화면 8 불일치, signUp 에러 원문 노출

### 확인 불가 (대시보드 확인 필요)
Supabase 리전, Confirm email, Custom SMTP, Vercel Functions 리전, 원격 FK·auth.users 트리거

## 사용자 결정 (2026-11-18, 권장안 승인)
1. 처리방침 동의: 필수 체크박스 (운영기관 제공이 제3자 제공일 여지)
2. 마케팅 동의: 제외
3. 기존 가입자: 보호 경로 진입 시 `/consent` 재동의
4. user_consents: 탈퇴 시 on delete cascade
5. 범위 밖(별도 이슈): 회원 탈퇴, draft 열람 정책, 기관별 제공 동의, 폼 빌더 민감정보 안내
6. 이슈 #69, develop 브랜치

운영자명·보호책임자·리전 미확인 → 처리방침에 `[대괄호]` placeholder.

## 실행 계획
- 1단계 logic-builder: 마이그레이션(legal_documents, user_consents, 트리거, has_current_consents), `src/lib/consent/policy.ts`, `src/lib/safeRedirect.ts`, `consentAction.ts`, signUp 수정(비밀번호 8자), proxy 게이트(rpc 에러 시 통과), callback·signIn 리다이렉트 검증, sitemap, 테스트
- 2단계 ui-builder: siteFooter, /privacy, /terms, /consent, 가입 동의 체크박스, 사이드바 링크
- 3단계 debugger: tsc·lint·test·build, curl 경로 확인
- 4단계: 운영 DB 마이그레이션 적용(사용자 승인 후), 브라우저 확인, 커밋 `Refs #69`

인터페이스: 필드 `agree_age14`·`agree_terms`·`agree_privacy`("on"), 버전은 서버 상수, `/consent?redirect=`.

## 구현 결과 (2026-11-18, 미커밋)

### logic-builder
- 신규: `src/lib/consent/policy.ts`(버전 상수 2026-11-01(11-18 변경, 당초 12-01), CONSENT_FIELDS, parseConsentForm), `src/lib/safeRedirect.ts`, `src/app/actions/consentAction.ts`(acceptConsents), `supabase/migrations/20261118000000_user_consents.sql`
- 수정: signUp(필수 동의 없으면 auth.signUp 미호출, options.data.consents, 비밀번호 8자), signIn·auth/callback 리다이렉트 검증, proxy(보호 경로에서 has_current_consents false → /consent, rpc 에러 시 통과, 비로그인 /consent → /login), sitemap
- 이유: Confirm email ON이면 signUp 직후 세션이 없어 앱 insert가 RLS에 막힘 → 메타데이터 + auth.users 트리거. 트리거는 어떤 입력에도 예외를 내지 않음(가입 실패 방지), 빠지면 /consent에서 복구
- 테스트 4파일 51개 추가

### ui-builder
- 신규: `/privacy`(14절), `/terms`(11조+부칙), `/consent`(재동의 + "동의하지 않고 로그아웃"), `components/legal/legalDoc.tsx`(절 배열 렌더러, Placeholder 강조), `components/auth/consentCheckboxes.tsx`(가입·재동의 공용, controlled, 제15조 제2항 고지 요약), `siteFooter` + `siteFooterGate`(/dashboard 숨김)
- 수정: 루트 layout 푸터, signup 동의·8자 안내, 사이드바 DashboardOrgFooter에 정책 링크(모바일 Sheet 공용)

### debugger
- tsc 0 / lint 0 error(기존 경고 1) / test 20 suites 315 passed / build 성공
- next start -p 3002 비로그인 curl: /privacy·/terms·/signup·/login 200, /consent·/applications·/dashboard 307 → /login
- 수정: 마이그레이션 권한 — legal_documents, user_consents 에서 anon·authenticated 기본 ALL 권한 revoke 후 필요한 것만 grant
- SQL 실행 검증 못 함(로컬 psql 없음, Docker 실행 권한 거부) → 정적 검토만
- safeRedirectPath: `/.//evil.com` 통과(현재 사용처에선 안전), 정규화 pathname `//` 거부 1줄 추가 제안

### 처리방침 문구와 실제 동작 불일치 (미수정)
1. 운영기관이 draft 지원서도 열람 가능한데 "제출 시 제공"으로 기재
2. "첨부파일도 함께 삭제" — Storage는 cascade 안 되고 삭제 구현 없음
3. 지원서 보유 "탈퇴 시까지" — applications FK cascade 확인 불가
4. 가입 화면 요약에 운영기관 제공(제17조 제2항 고지 사항) 없음
5. 접속 기록 3개월·IP 수집 — 앱 자체 저장 없음, Supabase·Vercel 로그 정책
6. (해소) 시행일을 2026-11-01로 변경 — 대신 과거 시행일·게시일 불일치 문제 발생, 아래 재검토 6~8번
7. placeholder: 운영자명, 보호책임자 성명·이메일, 리전·연락처, 운영기관 보유기간

## 시행일 변경·문구 재검토 (2026-11-18)

- 사용자 지시: 시행일 2026-11-01. logic-builder가 policy.ts 상수 3개와 마이그레이션 시드(version '2026-11-01', effective_at '2026-11-01 00:00:00+09') 변경. ui-builder가 legalDoc.tsx JSDoc 예시만 정리(화면 날짜는 모두 상수 참조)
- debugger: tsc 0 / lint 0 error / test 315 / build 성공, 상수와 시드 version 일치 확인

### ui-builder 문구 검토 28건 (미수정, debugger 교차 확인 a~i 모두 사실 확인, h는 부분: phone은 화면 미노출이나 select("*")로 응답 포함)
필수
1. 제3자(운영기관) 제공 동의를 별도 항목·제17조 제2항 고지로 받지 않음 — 권장: 지원서 제출 시 공고별 동의
2. "제출하면 제공" vs draft 열람(applicationAction.ts:339-345)
3. 첨부파일 삭제 주장 vs deleteApplication Storage 미삭제
4. 지원서 보유기간 처리방침·약관·코드 불일치
5. "운영기관이 공고에서 정한 기간" — 해당 필드 없음
6. 약관 제3조 "게시로 효력" vs 부칙 11-01 시행(게시 전 소급)
7. 처리방침 "11-01부터 적용" vs 실제 게시 11-18 이후
8. /consent "11월 1일부터 시행합니다" 시제
9. placeholder(운영자명, 수탁자 연락처·국가, 제공 보유기간, 보호책임자)
권장
10. 접속기록 3개월·통비법 예시 근거 없음 11. 운영기관 관계(제3자 제공 vs 위탁) 법률 검토 12. 가입 요약 목적·항목에 지원서 단계 누락, 링크 라벨 13. 동의 기록 항목 누락 14. 심사 기록 항목 구체화 15. DART 대표자명 처리 근거·항목 특정 16. 국외이전 거부=탈퇴 간주 과도 17. Custom SMTP 확인 18. 운영기관 의무의 구속력(별도 계약) 19. 운영자 의무 조항 없음 20. 지원서 "게시" 제한 조항 21. 경과실 면책 22. 마감 "이전까지" → "까지"(정각 허용) 23. 종이 문서 파기 문구
선택
24. 이전 버전 열람 25. 용어 통일(이용자/정보주체/회원) 26. "적용"/"시행" 통일 27. 절 번호 상호참조 하드코딩 28. 보호책임자 전화번호

## 문구 수정 (2026-11-18, 미커밋)

- ui-builder: 재검토 항목 2·3(문구를 현재 동작에 맞춤)·4·5·6·7·8·10·12~23·25~27 반영. 반영 안 함: 1(제3자 제공 별도 동의), 11(제공 vs 위탁), 24, 28, placeholder 값
  - `LegalSectionRef` 추가: 절 id 기반 상호참조 앵커(번호 하드코딩 제거)
  - 보유기간 통일: 회원 정보·동의 기록 — 탈퇴 시 / 작성 중 지원서 — 삭제 또는 탈퇴 시 / 제출 지원서·첨부 — 모집 마감일로부터 [보유기간]
  - 처리방침 헤더 "제정일", 약관 헤더는 부칙 "시행"과 맞춰 "시행일" 유지
- logic-builder: policy.ts `LEGAL_EFFECTIVE_DATE`, 마이그레이션 `effective_at` 주석을 "제정일, 게시일부터 적용" 의미로(값 변경 없음)
- debugger: tsc 0 / lint 0 error / test 315 / build 성공. 앵커 깨짐 0, 중복 id 0, 번호 연속, 삭제 대상 문구 0건, 클라이언트 import 체인 문제 없음, 본문과 코드 새 모순 없음
- 남은 것: 첨부파일 실제 삭제·제출 지원서 자동 파기 미구현(운영 절차로 보장 필요), applications FK on delete 확인 불가, placeholder

## 운영 반영 (2026-11-19)

- PR #70 master 머지(03036c0, 사용자 직접 실행)
- 운영 DB 마이그레이션 `20261118000000_user_consents.sql` 사용자가 SQL Editor로 적용
  - 사전 확인: legal_documents·user_consents 없음(NULL), auth.users 트리거 없음
  - 사후 확인: legal_documents terms·privacy 2행(2026-11-01, is_current), 트리거 `on_auth_user_created_record_consents`, 함수 `has_current_consents`·`record_signup_consents` 존재
  - 기존 계정은 운영자 1명뿐이라 재동의 영향 없음. 로그인 → `/consent` → 동의 → 원래 화면 복귀 확인
- 남은 것: placeholder 값, 첨부파일 삭제·보유기간 파기 구현, 운영기관 draft 열람 정책, 지원서 제출 시 제3자 제공 동의, 제공 vs 위탁 법률 검토

## placeholder 채우기 (2026-11-24, 미커밋)

- 사용자 값: 운영자명·보호책임자 정헌수, 이메일 oldwater0224@gmail.com(mailto), 무료 플랜(Custom SMTP 미사용)
- ui-builder: privacyPolicyContent·termsContent·consentCheckboxes 수정
  - 확정: 운영자명, 보호책임자 성명·이메일, 수탁자 연락처 privacy@supabase.com·privacy@vercel.com, 인증 메일 "Supabase 기본 메일 발송 기능"
  - 임시: 제출 지원서 보유기간 "모집 마감일로부터 1년"(4곳 동일), 접속기록 "수탁자 로그 보존 정책에 따른 기간 동안 보관 후 자동 삭제"(무료 플랜 보존 일수 미확인이라 일수 미기재)
  - 남김: 리전 Placeholder 2곳(사용자가 건너뜀)
  - terms·consentCheckboxes의 쓰지 않는 Placeholder import 삭제
- logic-builder: 변경 없음. policy.ts·legal_documents 시드는 본문을 참조하지 않고, 테스트에도 본문 assert나 스냅샷이 없음. 버전은 2026-11-01 유지 권고(동의자가 운영자 1명이면 재동의 실익 없음). 단 운영자 외 동의자가 있으면 버전 올리기 권고
- debugger: tsc 0 / lint 0 error(기존 경고 1) / test 20 suites 315 / build 성공. next start에서 /privacy·/terms·/signup 200, 남은 placeholder는 리전 2곳뿐
- 결정 대기: 버전 유지 여부(운영 DB 동의자 수 확인), 보유기간 1년 확정, 리전
- 결정(2026-11-24): 가입자는 운영자 본인 1명뿐(사용자 확인) → 문서 버전 2026-11-01 유지, 재동의 없음

## 리전·보유기간 확정 (2026-11-26, 미커밋)

- 사용자 값: Supabase ap-northeast-2, Vercel도 서울(icn1), 제출 지원서 보유기간 6개월(앞의 임시 1년 대체)
- ui-builder: 리전 2곳 채움, 국외 이전 절을 "저장은 서울, 수탁자(미국 법인)의 운영·지원 과정에서 국외 접근 가능"으로 재작성(단정 금지), 표 캡션·열 제목 조정, 보유기간 4곳 6개월, Placeholder import·낡은 주석 정리
- debugger: tsc 0 / lint 0 error / test 315 / build 성공, /privacy·/terms·/signup 200, 남은 Placeholder 0, 보유기간 "1년" 0, 앵커 정상. legalDoc.tsx Placeholder export 미사용(경고 없음)
- 버전: 가입자 운영자 1명 → 2026-11-01 유지

## 자동 파기 아키텍처 조사 (logic-builder, 읽기 전용)

- 현황: deleteApplication·deleteProgram이 Storage를 지우지 않음(고아 파일 누적 가능), review_results는 applications ON DELETE CASCADE, application_files·applications.user_id·program_id FK는 확인 불가, 기존 크론 isAuthorizedCron은 secret 없으면 fail-open
- 기존 제출 후 삭제 금지 트리거는 service_role·postgres·cascade를 통과 → 트리거 변경 불필요
- 권장 (C) 혼합: application_files AFTER DELETE 트리거로 storage_deletion_queue 적재 + Vercel 크론 /api/cron/retention(매일, service role)이 ① 만료 제출 지원서 파기(Storage 먼저 → DB 삭제) ② 대기열 Storage 정리. 파기 기록 data_destruction_logs(개인정보 미포함), 실행 요약 sync_logs
- 만료 판정: 마감일 KST 달력 + 6개월(월말 클램프), TS 순수 함수로 테스트
- 운영: 확인 SQL → 마이그레이션 → dryRun 며칠 → RETENTION_PURGE_ENABLED로 실제 실행
- 열린 결정 11개: 마감일 없는 공고, 마감 후 draft, review_results cascade, 탈퇴 시 FK, 파기 기록 범위, "책임자 확인 후 파기" 문구, 크론 개수 한도, deleteProgram, 백업·PITR, 크론 fail-open 수정 등
- 후속 이슈: #73 제출 지원서·첨부파일 보유기간 자동 파기
