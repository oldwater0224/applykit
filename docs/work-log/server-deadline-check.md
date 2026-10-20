# 지원서 제출 시 서버 마감 확인 작업 기록

- 이슈: #58 (https://github.com/oldwater0224/applykit/issues/58)
- 브랜치: `fix/58-server-deadline-check` (`develop`에서 분기) → 2026-10-19 `develop`에 합치고 삭제
- 시작일: 2026-10-18
- 배경: 관리자 대시보드 개편(PR #57) 중 발견 (`docs/work-log/admin-dashboard-revamp.md` R24). 마감 판정이 클라이언트에만 있어 서버 액션으로 마감 후 제출이 가능함

## 다음 작업 이어하기 (다른 컴퓨터용)

현재 상태 (2026-10-18 기준)
- 2026-10-19: 작업 9까지의 커밋을 `develop`에 합치고 `fix/58-server-deadline-check` 브랜치 삭제 (사용자 결정). PR #59는 브랜치 삭제로 닫힘, master 반영은 develop → master로 별도 진행. 남은 일은 **`develop`에서 이어서 작업**
- 이슈 #58은 아래 남은 일 때문에 열어 둠

시작 순서
루트 `CLAUDE.md`의 "이전 작업 불러와" 절차를 따른다 (브랜치 `develop` 체크아웃·pull, 이슈 #58 확인, 이 문서 읽기, 남은 일 보고 후 승인 받고 착수). 커밋에 `Refs #58`, 끝나면 이슈 #58에 커밋 링크 댓글

남은 일
- [ ] **기존 마감 데이터 -9h 보정 (R23)**: 수정 전 저장된 `programs.deadline`이 9시간 늦음. `programs`에 `updated_at`이 없어 보정 대상 id를 먼저 확정해야 함. 운영 DB 쓰기라 실행 전 대상 행 SELECT로 확인 → 스크립트 준비 완료, 실행 대기 (아래 작업 8)
- [ ] **DB 차원 강제 (S5)**: 지원자용 RLS `with check` 또는 BEFORE INSERT/UPDATE 트리거로 `status = 'active'` + 마감 확인, `UNIQUE(program_id, user_id)` (적용 전 중복 행 존재 여부 SELECT 확인). 마이그레이션 파일로 작성
- [x] **삭제 경로 정책 (S6)**: 작성 중이면 마감·종료 후에도 삭제 허용으로 결정 (사용자 결정, 작업 9)
- [ ] **로그인 상태 브라우저 확인**: 아래 작업 1·4의 체크리스트, 로그인 사용자 기준 RLS (작업 10 첫 항목은 2026-10-20 확인 완료, 양식 저장 항목은 대기)
- [ ] **closed 공고 노출 정책 (S8)**: RLS가 지원자에게 closed 공고를 숨김 → 보여줄지 숨길지 결정 (작업 10 참고)
- [x] (선택) N1~N3 정리 (작업 9). N4는 목록이 draft를 제외하는 의도된 동작이라 그대로 둠

참고: 서브에이전트 정의는 `.claude/agents/` (ui-builder, logic-builder, debugger). 메인이 조율하고 위임, 결과는 이 문서에 기록. `gh pr merge`는 사용자가 직접 실행.

## 작업 순서와 상태

| 순서 | 담당 | 작업 | 상태 |
|---|---|---|---|
| 0 | 메인 | 이슈 #58 생성, 브랜치 생성 | 완료 |
| 1 | logic-builder | 서버 마감 확인 로직 + 테스트 | 완료 |
| 2 | debugger | 검증 (새 임베드 쿼리 실제 DB 확인 포함) | 완료 (커밋 차단 없음) |
| 3 | 메인 | 커밋(`Refs #58`), 푸시, 이슈에 커밋 연결 | 완료 — 커밋 `05ea8e5`, `9ac196a`, `cef2dea`, `efb7fe7` / 이슈 댓글 https://github.com/oldwater0224/applykit/issues/58#issuecomment-6245552869 |
| 4 | ui-builder | 지원자 UI를 서버 판정과 일치 (S1·S2) | 완료 |
| 5 | debugger | UI 검증 | 완료 (커밋 차단 없음, 경미 N1~N4) |
| 6 | 메인 | 커밋·푸시, master PR (`Refs #58`, 이슈 열린 상태 유지) → 사용자 머지·배포 → develop 동기화 | 진행 중 |
| 7 | 다음 작업 (다른 컴퓨터) | 기존 마감 데이터 보정(R23), DB 강제(S5: RLS with check/트리거, `UNIQUE(program_id, user_id)`), 삭제 경로 정책(S6) | 대기 |
| 8 | 메인 | 기존 마감 데이터 보정 스크립트 (R23) | 스크립트 완료, 운영 DB 실행 대기 |
| 9 | 메인 | N3 테스트, N2 순서, N1 입력 유지, S6 삭제 허용 명시 | 완료 |

## 보고가 필요한 사항

| # | 내용 | 상태 |
|---|---|---|
| S1 | **기존에는 closed/draft 공고에도 지원 가능했음 → 이제 서버가 거부 (동작 변경).** ① 공고 상세(`programs/[id]/page.tsx:60`)가 `status !== "closed"`로 판정해 draft 공고에도 "접수 중"·지원하기 버튼 노출 ② `apply/page.tsx`는 마감·status를 전혀 보지 않아 `/programs/{closed}/apply` 직접 접근 시 제출됐음 ③ 기존 draft 지원서는 마감·closed 공고에서도 "이어서 작성하기" 버튼 노출 → 이제 저장·제출·파일 추가 시 서버 거부(에러 표시됨) ④ `getPublicPrograms`는 `.neq("status","draft")`라 closed도 목록에 나옴 (주석과 코드 불일치) | 작업 4에서 UI 정리 완료 |
| S2 | **클라이언트 판정이 서버와 다름.** 클라이언트는 `new Date(deadline) < now`, status는 `!== 'closed'`. 서버는 `parseDeadlineMs`(KST), `=== 'active'`. timestamptz 응답이라 운영 데이터에선 마감 시각 판정은 같고 status 기준만 다름. 클라이언트에서 `checkProgramAcceptingApplications` 재사용 권장 | 작업 4에서 해결 (클라이언트도 `checkProgramAcceptingApplications` 사용) |
| S3 | `createApplication`의 새 역방향 임베드 쿼리 `programs.select('id, status, deadline, applications(id)').eq('applications.user_id', uid)` | 작업 2에서 실제 DB 확인됨 (service role, RLS 미검증) |
| S7 | 중복 지원 확인이 기존 `.maybeSingle()`(2건 이상이면 에러로 통과) → `length > 0`으로 더 엄격해짐 | 확인됨 (퇴행 아님) |
| S4 | RLS가 지원자에게 draft 공고를 숨기면 해당 경우 메시지는 "공고를 찾을 수 없습니다." | 참고 |
| S5 | 레이스(판정~insert 사이 수 ms)는 허용. DB 강제가 필요하면 지원자용 RLS `with check` 또는 BEFORE 트리거, `UNIQUE(program_id, user_id)` 제안 (마이그레이션 미작성) | 후속 후보 |
| S6 | `deleteApplication`, `deleteApplicationFile`은 draft 정리용이라 마감 확인 미적용 | 삭제 허용으로 결정 (작업 9), 제출된 지원서·파일 삭제 거부는 기존대로 |

## 단계별 결과

### 작업 10 — 메인: `/programs` 목록과 상세 상태 표시 불일치 (완료)

**증상 (사용자 제보)**: 공고를 만든 뒤 `/programs` 목록은 "양식 준비 중", 상세 페이지는 "접수 중"으로 표시가 다름

**원인**
1. 목록과 상세가 뱃지를 고르는 규칙이 달랐음
   - 목록: 양식이 없으면 "양식 준비 중" 뱃지 + 접수 중이면 "접수 중" 대신 D-day만 표시
   - 상세: 양식 여부와 무관하게 판정 라벨("접수 중") 표시, 양식 없음은 버튼("지원 양식 준비 중")에만 나옴
2. 공고 생성·수정·삭제 후 운영기관 목록·상세 캐시만 갱신하고 지원자용 공개 목록(`programKeys.public()`) 캐시는 갱신하지 않음 → 폼 빌더에서 양식을 저장해도 목록은 이전 상태가 남음 (상세는 갱신됨)
3. D-day 계산도 달랐음: 목록은 7일 이내 빨간색, 상세는 항상 파란색. 둘 다 `Math.ceil(남은 시간/24h)`라 대시보드 D-day(KST 달력)와 하루 차이 날 수 있었음 (R24). 마감 날짜는 브라우저 시간대로 표시

**수정**
| 파일 | 내용 |
|---|---|
| `src/components/programs/programAvailability.ts` | `getProgramDisplay` 추가. 상태 뱃지 우선순위 접수 불가(접수 마감·모집 전·모집 중 아님) → 양식 없음("양식 준비 중", amber) → "접수 중". D-day는 접수 중이고 마감일이 있을 때만, KST 달력 기준(오늘 마감 = "오늘 마감"), 7일 이내 빨간색 |
| `src/components/programs/programsContent.tsx`, `src/app/programs/[id]/page.tsx` | 둘 다 `getProgramDisplay` 하나로 뱃지·D-day·마감 날짜 표시 → 항상 같은 결과 |
| `src/hooks/usePrograms.ts` | 생성·수정·삭제 성공 시 `programKeys.all` 무효화 (운영기관 목록·공개 목록·상세 모두 갱신) |
| `src/lib/datetime/kst.ts` | `kstDayStartMs`·`kstDaysLeft`를 aggregate에서 이동(aggregate는 재export), `formatKstDate`·`formatDeadlineKst` 추가 |
| `src/app/programs/[id]/apply/page.tsx`, `src/app/applications/page.tsx` | 마감 날짜 표시를 KST로 |

**동작 변경**
- 목록 카드: 접수 중이면 "접수 중" 뱃지가 항상 보이고 D-day는 옆에 따로 표시 (전에는 D-day만)
- 상세: 양식이 없으면 상태 뱃지가 "접수 중" → "양식 준비 중"
- D-day가 KST 달력 기준으로 바뀌어 전과 하루 차이 날 수 있음 (예: 밤 23시에 다음 날 01시 마감을 보면 전에는 D-1(2시간을 올림), 지금도 D-1 / 오늘 마감은 전에는 D-1, 지금은 "오늘 마감")

**검증**: `npx tsc --noEmit` 통과 / `npm run lint` 에러 0, 기존 경고 1 / `npm test` 13 스위트 222 통과 (`TZ=America/Los_Angeles`에서도 통과) / `npm run build` 성공. 브라우저 확인은 아직
- [x] 양식 없는 active 공고: 목록·상세 모두 "양식 준비 중" — 2026-10-20 로그인 상태 확인. 공고 "111"(active, 양식 없음, 마감 10-23 16:36 KST): 목록·상세 모두 "양식 준비 중"(주황) + D-3(빨강) + 마감 2026. 10. 23., 상세 버튼 "지원 양식 준비 중"(비활성), 콘솔 에러 없음
- [ ] 폼 빌더에서 양식 저장 후 `/programs`로 이동: 바로 "접수 중"으로 바뀜 — 운영 DB 쓰기(공고 "111"이 실제 지원 가능 상태가 됨)라 사용자 결정 대기
- 발견 (S8): closed 공고("2026 게임 스타트업 지원")는 로그인해도 목록에 없고, 상세는 "공고를 찾을 수 없습니다.", apply는 "프로그램을 찾을 수 없습니다." → `getPublicPrograms`는 draft만 제외하지만 RLS가 지원자에게 closed도 숨기는 것으로 보임 (S4와 같은 계열). 그래서 "접수 마감" 뱃지·마감 안내 화면은 현재 지원자에게 보이지 않음. 결정 필요: closed 공고를 지원자에게 보여줄지(RLS 수정) / 숨길지(`getPublicPrograms` 주석·조건을 RLS에 맞춤) → DB 정리(S5) 때 함께

### 작업 9 — 메인: 코드 정리 N1~N3, S6 (완료)

DB 없이 할 수 있는 코드 작업만 진행 (사용자 요청). 서브에이전트 대신 메인이 직접 처리.

| 항목 | 파일 | 내용 |
|---|---|---|
| N3 | `src/__tests__/components/programs/programAvailability.test.ts` | 신규 10개. 라벨·문구·tone 전 경우, 마감 정각 경계, 서버 판정 함수와 결과 일치(공고 5종 × 시각 3개), 뱃지 스타일 |
| N2 | `src/app/programs/[id]/page.tsx` | `ApplyButton`에서 접수 불가 안내를 "지원 양식 준비 중"보다 먼저 → closed + 양식 없음도 apply 페이지·서버와 같은 마감 안내 |
| N1 | `src/app/programs/[id]/apply/page.tsx` | `formShown` 상태 추가. 폼을 한 번 보여준 뒤 마감·종료되면 폼과 입력은 유지, 위에 서버 메시지 + "복사해 두세요" 안내, 제출 버튼 비활성. 처음부터 접수 불가면 기존처럼 안내 화면 |
| S6 | `applicationAction.ts`, `applicationFileAction.ts` | 동작 변경 없음. 작성 중이면 마감 후에도 삭제 허용한다는 결정을 주석으로 명시 |
| S6 | `src/__tests__/app/actions/applicationAction.test.ts` | 신규 5개. 작성 중 지원서·파일 삭제 시 공고를 조회하지 않음, 제출된 지원서·파일과 남의 지원서는 거부 |

- N1 참고: 화면은 마감 시각에 저절로 다시 그려지지 않고, 입력·포커스 갱신·데이터 재조회 같은 다음 렌더에서 안내로 바뀜. 그 사이 제출해도 서버가 거부하고 하단에 에러 표시 (기존과 같음)
- 검증: `npx tsc --noEmit` 통과 / `npm run lint` 에러 0, 기존 경고 1 / `npm test` 13 스위트 213 통과 (`TZ=America/Los_Angeles`에서도 통과) / `npm run build` 성공
- 미검증: 브라우저 확인 (이 세션에 DB 접속 정보 없음). 확인 항목
  - [ ] 지원 페이지에서 작성 중 공고를 closed로 바꾸고 입력 → 폼 유지 + 상단 안내 + 제출 버튼 비활성
  - [ ] closed + 양식 없는 공고 상세 → "접수가 마감되었습니다"

### 작업 8 — 메인: 기존 마감 데이터 보정 스크립트 (준비 완료, 운영 DB 실행 대기)

- 스크립트: `supabase/scripts/20261019_fix_legacy_deadline_kst.sql` (마이그레이션 아님, Supabase SQL Editor에서 단계별 실행)
  - 1단계 SELECT: 마감일이 있는 공고 전체를 `shown_kst`(지금 보이는 값)·`intended_kst`(-9h)와 함께 조회. `created_after_merge`는 PR #57 머지(2026-10-18 12:56 KST) 이후 생성 여부
  - 2단계: 확정한 id만 `programs_deadline_backup_20261019`에 백업 후 -9h. 이미 백업된 id는 건너뛰어 재실행해도 두 번 당겨지지 않음
  - 되돌리기·백업 삭제 SQL 포함
- 대상 판단: deadline을 쓰는 곳은 `programActions.ts`의 create/update뿐 (다른 쓰기 경로 없음). PR #57 배포 전 생성된 공고는 늦게 저장됨. 배포 후 수정 모달에서 마감일을 직접 고쳐 저장한 공고는 이미 맞으므로 제외해야 함 (`updated_at`이 없어 사람이 확인)
- 검증: 로컬 PostgreSQL 16 임시 DB에서 실행 → 대상 행만 KST 18:21 → 09:21, 대상 아닌 행 그대로, 재실행 시 0행
- 실행 안 함: 이 클라우드 세션에 운영 DB 접속 정보(`.env.local`)가 없음

### 작업 5 — debugger: UI 검증 (완료, 커밋 차단 없음)

- 판정 일치: 모든 UI 판정이 `getProgramAvailabilityView` → `checkProgramAcceptingApplications`. 규칙 중복 없음. 남은 `new Date(deadline)`는 D-day 표시 계산용
- 클라이언트 번들 안전: `kst.ts` import 없음, `deadline.ts`는 kst만 import
- hooks: apply 페이지 모든 훅이 조기 return 전. 4개 페이지 모두 "use client" + React Query라 하이드레이션 불일치 없음
- 회귀 없음: 접수 중 공고는 폼·지원하기 유지, 제출된 지원서 화면 유지, "마감됨" 배지는 미제출 카드에만
- 실제 DB (SELECT만): `useMyApplications`의 `programs(..., status, ...)` 임베드 정상 (service role 2행, anon 0행). 현재 DB 공고는 1건(closed)
- tsc 통과 / lint 에러 0 (기존 경고 1) / 테스트 198 통과 / build 성공 / dev 서버 `/`, `/programs`, 상세, apply 200, `/applications`는 비로그인 307(정상)
- 경미 (차단 아님)
  - N1: 작성 중 마감 시각이 지나면 다음 렌더에서 폼이 안내로 바뀌어 저장 안 한 입력이 화면에서 사라짐 (서버도 어차피 거부)
  - N2: closed + 양식 없음일 때 상세는 "지원 양식 준비 중", apply는 마감 안내 (apply 쪽이 서버 순서와 일치)
  - N3: `programAvailability.ts` 단위 테스트 없음
  - N4: 목록은 draft 제외라 "모집 전" 배지는 목록에서 나오지 않음
- 미검증: 로그인 상태 브라우저 확인, 로그인 사용자 RLS

### 작업 4 — ui-builder: 지원자 UI 정리 (완료)

| 파일 | 내용 |
|---|---|
| `src/components/programs/programAvailability.ts` | 신규. `getProgramAvailabilityView` — 판정 결과를 라벨·배지 스타일로 변환 (접수 중 / 접수 마감 / 모집 전 / 모집 중 아님) |
| `src/app/programs/[id]/page.tsx` | 기존 `status !== "closed"`·`deadline < now` 제거, 헬퍼로 `canApply`. 접수 불가면 비활성 버튼과 사유, 접수 불가 공고의 작성 중 지원서는 "마감됨" |
| `src/app/programs/[id]/apply/page.tsx` | 로딩 → 없음 → 제출됨 → **접수 불가 안내(신규)** → 양식 없음 → 폼. 안내에 서버 메시지와 "공고로 돌아가기"·"내 지원목록 보기" |
| `src/app/applications/page.tsx` | 접수 불가 공고의 미제출 카드에 "마감됨" 배지 |
| `src/components/programs/programsContent.tsx` | 목록 카드 마감 판정을 헬퍼로 교체 (`getPublicPrograms` 쿼리는 그대로) |
| `src/hooks/useApplication.ts` | `useMyApplications`가 `programs.status`도 조회 (select 추가만) |
| `src/types/applications.ts` | `ApplicationWithProgram.programs.status?` 선택 필드 추가 |

**동작 변경**: draft 공고 URL 접근 시 "모집 전" + 비활성 버튼 / 접수 불가 공고의 apply 페이지는 폼 대신 안내 (작성 중 지원서 포함) / 목록에서 closed 공고는 마감일이 미래여도 "접수 마감"

**브라우저 확인 항목**
- [ ] 접수 중·closed·draft·마감 지난 공고의 상세·목록 표시
- [ ] closed 공고 apply 페이지 안내 (작성 중 지원서 있을 때/없을 때)
- [ ] `/applications` "마감됨" 배지

### 작업 2 — debugger: 검증 (완료, 커밋 차단 없음)

- 정적 검증: `npx tsc --noEmit` 통과 / `npm run lint` 에러 0, 기존 경고 1 / `npm test` 12 스위트 198 통과 / `npm run build` 성공
- 코드 리뷰
  - create: 인증 → 공고+내 지원서 조회 → 중복 → 마감/상태 → insert. 비로그인이면 쿼리 0. 거부 시 모두 insert 전에 return
  - 임베드에 `!inner` 없음 → `applications.user_id` 필터는 임베드 행만 거르고 공고 행은 유지
  - update: 인증 → 조회 → 소유권 → 제출 여부 → 마감. 거부 시 update 전 return
  - upload: 마감 확인이 Storage 경로 생성·업로드보다 먼저. 거부 시 Storage·DB 모두 미접촉
  - `parseDeadlineMs` 이동: 본문 동일, aggregate 재export로 기존 import 경로 유지
  - 테스트: insert/update/Storage 호출 횟수, `eq('applications.user_id', ...)`, `applications(id)` 문자열을 단언 → 마감 확인 삭제나 `!inner` 추가 시 실패. 마감 정각/+1ms 경계, 대시보드 `isProgramActive`와 교차 확인
- 실제 DB (SELECT만, 스크립트 실행 후 삭제)
  - service role: create 임베드 쿼리 에러 없음, 임의 uuid → 공고 행 반환 + `applications` 빈 배열. 지원서 2건 공고에서 소유자 필터 → 1건, 임의 uuid → 0건 (다른 사용자 지원서 섞이지 않음)
  - update/upload의 `programs(status, deadline)` 임베드는 객체로 응답 → `pickEmbeddedProgram` 가정과 일치
  - anon: programs·applications 0행 (RLS로 숨김), 문법 에러 없음. authenticated 권한은 미검증
- 런타임 (3001 기존 dev 서버): `/`, `/programs`, `/programs/[id]`, `/programs/[id]/apply` 200, 새 에러 로그 없음
- diff 위생: console.log·TODO·비밀값·의도치 않은 파일 없음
- 남은 위험: RLS 미검증(로그인 E2E 필요), RLS로 공고가 숨겨지면 메시지가 "공고를 찾을 수 없습니다."로 바뀜, 중복 지원 race(기존과 같음, UNIQUE 제약 권장), 삭제 경로 마감 확인 정책 미정

### 작업 1 — logic-builder: 서버 마감 확인 (완료)

**판정 규칙** (`checkProgramAcceptingApplications(program, now)`)
| 조건 | 결과 | 메시지 |
|---|---|---|
| 공고 없음 | `not_found` | 공고를 찾을 수 없습니다. |
| `status !== 'active'` (draft, closed, null) | `not_active` (마감보다 우선) | 현재 모집 중인 공고가 아닙니다. |
| 마감일 null/빈 값 | 통과 | |
| `now > 마감` | `deadline_passed` (정각은 통과, 대시보드 `isProgramActive`와 동일) | 마감된 공고입니다. 지원서를 제출할 수 없습니다. |
- 마감 해석은 `parseDeadlineMs` (날짜만 → KST 23:59:59.999, 오프셋 없음 → KST, 오프셋 있음 → 그대로)

**적용 액션과 검증 순서** (기존 메시지·시그니처 유지)
- `createApplication`: 인증 → 공고·내 지원서 조회 → 공고 없음 → 중복 지원 → 마감/상태 → insert (임시저장 포함 거부)
- `updateApplication`: 인증 → 지원서 없음 → 소유권 → 이미 제출됨 → 마감/상태 → update
- `uploadApplicationFile`: 인증 → FormData → 지원서 없음 → 소유권 → 이미 제출됨 → 마감/상태 → 파일 형식·크기 → Storage 업로드

**쿼리 수**: 변화 없음 (create 2→2, 중복 확인을 공고 조회 임베드로 합침 / update·upload는 기존 조회에 임베드)

**클라이언트 에러 표시**: 훅이 `throw new Error(result.error)`로 넘기고 `apply/page.tsx` 하단 rose 박스에 표시됨 → 클라이언트 수정 없음

**변경/추가 파일**
| 파일 | 내용 |
|---|---|
| `src/lib/application/deadline.ts` | 신규. 판정 함수, `PROGRAM_AVAILABILITY_ERROR`, `pickEmbeddedProgram` |
| `src/lib/datetime/kst.ts` | `parseDeadlineMs` 이동 (로직 동일, 입력 타입만 확장) |
| `src/lib/adminDashboard/aggregate.ts` | 자체 `parseDeadlineMs` 제거, kst.ts에서 import·재export |
| `src/app/actions/applicationAction.ts` | create/update에 판정 적용 |
| `src/app/actions/applicationFileAction.ts` | upload에 판정 적용 (Storage 업로드 전 거부) |
| `src/__tests__/lib/application/deadline.test.ts` | 신규 13개 |
| `src/__tests__/app/actions/applicationAction.test.ts` | 신규 24개 (create/update/upload 목) |

**검증**: `npx tsc --noEmit` 통과 / `npm run lint` 에러 0, 기존 경고 1 / `npm test` 12 스위트 198 통과 (LA·UTC 시간대 통과) / `npm run build` 성공

**브라우저 확인 항목**
- [ ] 마감 전 active 공고에서 파일 업로드·임시저장·제출 정상 (새 임베드 쿼리 실제 동작)
- [ ] draft가 이미 있는 공고 재생성 시 "이미 해당 공고에 작성 중인 지원서가 있습니다."
- [ ] 지원 페이지를 열어 둔 채 운영자 화면에서 마감일을 과거로/closed로 바꾼 뒤 제출·업로드 → 하단 에러 메시지
- [ ] `/programs/{closed id}/apply` 직접 접근 후 제출 → 거부
- [ ] draft 공고 상세 URL 직접 접근 후 지원하기 → 거부 메시지
- [ ] 관리자 대시보드 진행 중·마감 임박 표시 회귀 없음
