# 관리자 대시보드 개편 작업 기록

- 브랜치: `feature/admin-dashboard-revamp` (`develop`에서 분기)
- 시작일: 2026-10-15
- 목표: 관리자 대시보드를 THE VC(thevc.kr)처럼 데이터 중심 화면으로 개편하고, "홈으로" 카드를 네비게이션 위치로 옮김
- 진행 방식: 메인 에이전트가 조율하고 ui-builder / logic-builder / debugger 서브에이전트에 위임

## 작업 순서와 상태

| 순서 | 담당 | 작업 | 상태 |
|---|---|---|---|
| 0 | 메인 | 브랜치 생성 | 완료 |
| 1 | logic-builder | 관리자 대시보드 집계 액션·훅·테스트 | 완료 |
| 2 | ui-builder | 레이아웃 개편 (사이드바, 상단 헤더, 홈 바로가기 이동) | 완료 |
| 3 | ui-builder | 셸 다크 톤 복귀 + 대시보드 본문 (KPI, 추이 차트, 데이터 테이블) | 완료 |
| 4 | ui-builder | 공고 관리·심사 아카이브 테이블 스타일 통일 (다크 유지), 아카이브 `?q=` 반영 | 완료 |
| 5 | debugger | lint 스크립트 수정, tsc / lint / test / build 검증, 실제 DB로 렌더링 확인 | 완료 |
| 6 | 메인 | 검토, 보고, 승인 후 커밋 | 사용자 브라우저 확인·커밋 승인 대기 |
| 7 | logic-builder | 마감일 저장 시간대 버그 수정 (R8) | 완료 (기존 데이터 보정은 결정 대기) |

## 사용자 결정 (2026-10-15)

- **R1 테마**: 셸(사이드바·헤더)을 다시 어두운 톤으로 맞추고 본문도 다크 유지. 흰 테마 전환은 하지 않음. 구조(그룹 메뉴, 헤더, 홈 바로가기 분리)는 유지
- **R9 판정 규칙**: 가장 최근 심사 기준 유지
- **R4 lint**: `package.json`의 `"lint"`를 `"eslint ."`로 수정 → 작업 5에서 debugger가 처리
- **R3 `--card-bg`**: 이번에는 고치지 않음
- **R8 마감일 9시간 버그**: 이 브랜치에서 같이 수정 (작업 7, logic-builder). 기존 데이터 보정은 별도 결정
- **커밋**: 사용자가 브라우저 확인을 마친 뒤 커밋

## 보고가 필요한 사항 (범위 확대, 중요 로직 변경)

| # | 출처 | 내용 | 상태 |
|---|---|---|---|
| R1 | 작업 2 | **대시보드 본문 전체가 다크 테마 기준.** `--page-bg: #0f172a`, 제목 `--gray-100`, 입력 `text-white`. 흰 셸 안에 어두운 본문이 들어간 상태. 본문을 흰 배경으로 바꾸려면 홈·공고·아카이브·지원서·폼빌더·모달 전체의 글자색 전환 필요 → 작업 3·4 범위가 커짐 | 사용자 확인 필요 |
| R2 | 작업 2 | **layout.tsx 변경 (인증 흐름은 유지).** org_members 조회를 `org_id, role`로 확장, 권한 통과 후 `organizations.name` 별도 조회 1회 추가 (실패해도 "운영기관"으로 표시될 뿐 리다이렉트 영향 없음) | 확인됨 |
| R3 | 작업 2 | 기존 토큰 버그 `designToken.css:42` `--card-bg: #;` (무효값 → 투명). 고치면 기존 카드 모양이 바뀌어 손대지 않음 | 결정 필요 |
| R4 | 작업 2 | `npm run lint`(= `next lint`)가 Next 16에서 동작하지 않음 (기존 문제). `npx eslint .`로 대체 검증. 스크립트를 `eslint .`로 바꿀지 결정 필요 | 결정 필요 |
| R5 | 작업 2 | `shadcn add sheet`가 의도치 않은 `cn@0.4.0` 의존성을 추가 → package.json/lock 원복 확인함. Sheet는 `components/ui/sheet.tsx`에 직접 작성 | 해결됨 |
| R6 | 작업 2 | 아카이브 페이지가 `?q=`를 읽지 않음. 헤더 검색은 이동만 됨. `useSearchParams` 초기값 반영이 작업 4에서 필요 | 작업 4로 넘김 |
| R7 | 작업 1 | **스키마 가정.** `programs`, `applications`, `org_members` DDL이 `supabase/migrations`에 없음. 작업 5에서 컬럼·임베드(`programs!inner(org_id)`, `review_results(...)`, `programs(form_schema)`)가 실제 DB에서 동작함을 SELECT로 확인. **단 서비스 롤 키로 확인해서 RLS는 미검증** | 컬럼·FK 확인됨, RLS는 브라우저 확인 필요 |
| R8 | 작업 1·5 | **마감일 9시간 어긋남 (기존 버그, 작업 5에서 확정).** 공고 생성·수정 모달이 datetime-local 값(오프셋 없음)을 그대로 저장(`programActions.ts:102`) → DB가 UTC로 해석. KST 09:21 입력 → KST 18:21로 저장됨. 새 대시보드는 시각까지 보여줘서 드러남. activePrograms·마감 임박·D-day도 9시간 늦게 판정. `editProgramModal.tsx:31`은 `+00:00` 값을 datetime-local에 넣어 수정 모달 마감일 칸이 비어 보일 가능성. 수정하려면 저장 경로 변경 + 기존 데이터 보정 여부 결정 필요 (중요 로직) | 사용자 결정 필요 |
| R9 | 작업 1 | **합격/불합격 판정 규칙 신규 정의.** 한 지원서에 심사가 여러 건 가능(`UNIQUE(application_id, reviewer_id)`) → 가장 최근 `reviewed_at` 심사의 `is_passed`로 판정. `applications.status`의 passed/failed는 갱신하는 코드가 없어 사용 안 함. 규칙 변경은 `resolveVerdict` 하나만 수정 | 사용자 확인 필요 |
| R10 | 작업 1 | `activePrograms` = `status === 'active'` **그리고** 마감 전(또는 마감일 없음). 공고 관리 화면의 "모집 중" 배지 수와 다를 수 있음 | 사용자 확인 필요 |
| R11 | 작업 1 | 기관 지원서 전체를 앱 서버로 가져와 JS 집계 (1000건 단위 페이지네이션). 수만 건 규모면 SQL view/RPC + 마이그레이션 필요 | 지금은 보류 |
| R12 | 작업 1 | 지원서·심사·공고 mutation 후 `adminDashboardKeys.all` invalidate 연결 안 됨 (기존 훅 수정 필요). 현재는 홈의 "새로고침" 버튼으로 수동 갱신 | 결정 필요 |
| R13 | 작업 3 | 기관 전체 "접수 목록 / 심사 대기 목록" 페이지가 없음. 총 접수·심사 대기 KPI는 홈 안 공고별 현황 앵커로 이동. 전용 페이지는 새 라우트+데이터 필요 (범위 확대) | 후속 후보 |
| R14 | 작업 3 | orgId 조회 실패 시 쿼리가 비활성 상태로 남아 스켈레톤이 계속 보임 (기존 `usePrograms`와 같은 구조). 작업 4 이후 공고 관리에도 적용됨 | 작업 5에서 확인 |
| R15 | 작업 4 | **공고 관리 행의 "양식 편집" 링크 제거.** 공고명·행 클릭이 같은 `/dashboard/programs/[id]`로 가므로 중복이라 판단. 관리 열은 수정·삭제만 | 사용자 확인 필요 |
| R16 | 작업 4 | 공고 관리 로딩이 전체 스피너 → 헤더·버튼은 즉시 표시 + 테이블만 스켈레톤으로 변경. orgId 대기 중 "공고 없음"이 잠깐 보이던 현상 해소 | 확인됨 |
| R17 | 작업 4 | 아카이브의 삭제된 공고 행: 흐린 행(opacity) → 공고 칸에 "(삭제됨)" 표시, 링크 없음 (이동 불가는 기존과 동일) | 확인됨 |
| R18 | 작업 4 | 아카이브 페이지 안 입력은 URL에 반영 안 됨. `?q=A` → 페이지에서 B 입력 → 헤더에서 다시 A 검색 시 화면이 B로 남음 (드문 경우). 해결하려면 topbar·검색 동작 변경 필요 | 후속 후보 |
| R19 | 작업 4 | 범위 밖 다크 미통일 화면: `pageHeader.tsx`의 밝은 아래 테두리(`--card-border: #e2e8f0`), 모달 3개, `programs/[id]`(상세·폼빌더·미리보기), 지원서 상세, `archive/backfill`, `applicationsTable.tsx`에 밝은 배지·`--card-bg` 잔존 | 후속 후보 |
| R23 | 작업 7 | **기존 공고 마감일 보정 미실행.** 수정 전 저장된 행은 여전히 9시간 늦음. `programs`에 `updated_at`이 없어 배포 후 수정 행과 구별 불가 → 배포 직전 대상 id 확정 또는 배포와 동시 보정 권장. SQL은 작업 7 섹션 참고 | 사용자 결정 필요 |
| R24 | 작업 7 | **지원자 쪽 마감 판정은 클라이언트에서만 함** (`new Date(deadline) < now`). 서버 지원서 제출(`applicationAction.ts`)에는 마감 확인 없음 → 마감 후 제출 가능. 지원자 화면 남은 일수(`Math.ceil`)와 대시보드 D-day(KST 달력)가 하루 다를 수 있음. 기존 문제 | 후속 후보 (중요 로직) |
| R25 | 작업 7 | 마감일을 비우고 생성·수정 시 이전엔 `''`가 저장돼 실패했을 것으로 추정 → 이제 null로 저장되어 "마감일 없음" | 확인됨 (동작 변경) |
| R21 | 작업 5 | 로그인 리다이렉트 시 `?q=` 유실 (`proxy.ts:33`이 pathname만 저장). 기존 동작 | 후속 후보 |
| R22 | 작업 5 | PostgREST `max-rows`가 1000보다 작게 설정돼 있으면 지원서 루프가 첫 페이지만 읽고 끝남 (`adminDashboardAction.ts:99`). Supabase 기본값은 1000 | 참고 |
| R20 | 작업 4 | 공고 관리의 "모집 중" 배지는 status만 봐서 마감이 지나도 "모집 중"으로 보임 (R10 연관). 공고 목록에 접수 수 열은 데이터가 없어 미추가 | 후속 후보 |

## 단계별 결과

### 작업 7 — logic-builder: 마감일 시간대 버그 수정 (완료)

**완료 내용**
- KST 변환 유틸 `src/lib/datetime/kst.ts` 신규 (런타임 TZ 무관)
- 서버 `createProgram` / `updateProgram`이 저장 직전에 마감일 정규화: 오프셋 없는 값은 KST로 보고 UTC ISO로 변환, 오프셋 있는 값은 그대로 (이중 변환 방지). 형식 오류는 `"마감일 형식이 올바르지 않습니다."`. 시그니처 변경 없음
- 수정 모달은 초기값만 KST datetime-local로 변환 (UI 변경 없음). 생성 모달은 변경 없음 (서버가 변환)
- `aggregate.ts`의 `parseDeadlineMs`가 공통 유틸 사용 (동작·기존 export 유지)
- Jest 테스트 28개 추가

**변경/추가 파일**
| 파일 | 내용 |
|---|---|
| `src/lib/datetime/kst.ts` | `parseKstDateTimeMs`, `kstLocalInputToIso`, `isoToKstLocalInput`, `normalizeDeadlineForStorage`, `isValidDateTimeString`, `hasTimeZone` |
| `src/app/actions/programActions.ts` | create/update에서 `normalizeDeadlineForStorage` 호출 |
| `src/app/dashboard/programs/editProgramModal.tsx` | 초기값 `isoToKstLocalInput(selectedProgram.deadline)` |
| `src/lib/adminDashboard/aggregate.ts` | KST 상수·파싱을 kst.ts에서 가져옴 |
| `src/__tests__/lib/datetime/kst.test.ts` | 변환·역변환·빈 값·오프셋·자정 경계·왕복·멱등성·잘못된 날짜 |
| `src/__tests__/app/actions/programActions.test.ts` | Supabase 목으로 insert/update 페이로드 확인 |

**데이터 흐름 (수정 후)**
- 생성: `'2026-06-18T09:21'` → `createProgram` → `'2026-06-18T00:21:00.000Z'` → DB `00:21+00:00` (= KST 09:21)
- 수정: DB 값 → 모달 `'09:21'` → 저장 → 같은 시각 유지
- 폼 빌더 저장은 deadline을 보내지 않음 (테스트로 확인)

**deadline 사용처 점검**: 공개 공고 목록·상세, 지원 페이지, 내 지원서, 대시보드 집계·표시 모두 절대 시각 비교라 새 데이터에서 정상. 서버 쪽 마감 판정은 없음 (R24)

**기존 데이터 보정 (실행 안 함)**
- 기존 행은 9시간 늦은 상태. 수정 모달에 9시간 늦은 값이 표시되고, 그대로 저장하면 유지됨. 칸을 고쳐 저장하면 바로잡힘
```sql
-- 1) 확인 (SELECT만)
select id, title, status, created_at, deadline,
       deadline at time zone 'Asia/Seoul'                        as shown_kst,
       (deadline - interval '9 hours') at time zone 'Asia/Seoul' as intended_kst
from programs
where deadline is not null
  and created_at < '<배포시각>'::timestamptz
order by created_at;

-- 2) 보정 (트랜잭션, 1에서 확정한 id만. 실행 전 id·deadline 백업)
begin;
update programs set deadline = deadline - interval '9 hours'
where id in ('<id1>', '<id2>');
commit;
```

**검증**
- `npx tsc --noEmit` 에러 0 / `npm run lint` 에러 0, 기존 경고 1 / `npm test` 10 스위트 161 통과 (UTC, LA 시간대에서도 통과, 메인에서 재확인) / `npm run build` 성공

**브라우저 확인 항목 (아래 체크리스트에 추가)**

### 작업 5 — debugger: 전체 검증 (완료)

**1. lint 스크립트**: `package.json` `"lint": "next lint"` → `"eslint ."`. `npm run lint` 종료 코드 0, 에러 0, 기존 경고 1 (`src/lib/naver/sync.ts:221`). `.next`, `node_modules`, `out`은 eslint 대상에서 제외됨을 확인

**2. 정적 검증**
- `npx tsc --noEmit`: 에러 0
- `npm test`: 8 스위트, 133 테스트 통과 (테스트 2개 추가: 실제 DB 응답 형식, 연말 주 경계). `TZ=America/Los_Angeles`에서도 통과
- `npm run build`: 성공, `/dashboard`, `/dashboard/programs`, `/dashboard/archive` 모두 동적 페이지, 에러·경고 없음

**3. 코드 리뷰**
- `adminDashboardAction.ts`: `getUser()` + `org_members(user_id, org_id)` 확인으로 **다른 기관 orgId 위조 차단됨**. 이후 쿼리는 사용자 세션이라 RLS도 적용. 페이지네이션은 `page.length < 1000`이면 종료, 에러 시 즉시 반환. 빈 catch 없음
- `aggregate.ts`: KST 경계, 월요일 주 시작, D-day 이상 없음
- `layout.tsx`: 인증 흐름(getSession → /login, org_members 없음 → /) 변경 없음
- `dataTable.tsx`: 버튼·링크·입력 클릭 제외, 텍스트 선택 중 무시, `getRowHref` 빈 문자열이면 이동 없음
- `archive/page.tsx`: Suspense + key 리마운트, useEffect 없음
- 변경 파일 전체에 `any`, `catch`, `eslint-disable`, `@ts-`, `useEffect` 0건

**4. 실제 DB (SELECT만, 서비스 롤 키 → RLS 미검증)**
- 컬럼 확인: `org_members(org_id, role, user_id)`, `organizations(id, name)`, `programs(id, title, status, deadline, created_at, org_id)`
- 대시보드 액션의 select·임베드 문법이 모두 에러 없이 동작, 응답 형태가 타입과 일치
- 데이터: 지원서 2건, 공고 status는 `closed`만 → active 공고·마감 임박을 실데이터로 검증하기 어려움

**5. 런타임**: dev 서버에서 `/dashboard`, `/dashboard/programs`, `/dashboard/archive?q=test` → 비로그인 307 `/login` 리다이렉트 정상, 서버 로그 에러 없음. dev 서버 종료 확인

**발견한 문제**
| # | 증상 | 원인 | 수정 |
|---|---|---|---|
| 1 | 마감 시각 +9h 표시·판정, 수정 모달 마감일 칸 비어 보임 | 오프셋 없이 저장 (`programActions.ts:102`, 생성·수정 모달) | 안 함 → R8 |
| 2 | orgId 조회 실패 시 스켈레톤 무한 | `useAuth.ts` `fetchOrgInfo` 실패 시 orgId null | 안 함 → R14 (인증 흐름 변경 필요) |
| 3 | `npm run lint` 동작 안 함 | `next lint` | 수정함 |
| 4 | 로그인 후 `?q=` 유실 | `proxy.ts:33` | 안 함 → R21 |
| 5 | 짧은 오프셋(`+00`) 문자열 null 해석 | `aggregate.ts:76` | 안 함 (PostgREST 응답에선 발생 안 함) |

**변경 파일**: `package.json`(lint 한 줄), `src/__tests__/lib/adminDashboard/aggregate.test.ts`(테스트 2개)

## 사용자 브라우저 확인 체크리스트 (로그인 필요)

- [ ] `/dashboard`: KPI·차트·마감 임박·최근 접수·공고별 현황 렌더링, 새로고침 버튼, KPI 링크·앵커 이동. **숫자를 DB와 대조 (RLS 때문에 0으로 나오는지 확인)**
- [ ] 콘솔: recharts `Cell` 경고, hydration 경고, server action 에러 없음
- [ ] 마감일 표시 시각이 입력한 값과 같은지 (9시간 차이 = R8), 수정 모달 마감일 칸이 채워지는지
- [ ] 공고 관리: 수정·삭제 버튼이 행 이동 없이 모달만 여는지 (마우스·Enter), 삭제 후 목록 갱신, 행 클릭·Cmd 클릭
- [ ] 헤더 검색 → `/dashboard/archive?q=` 반영, 다른 검색어 재검색, 삭제된 공고 행 "(삭제됨)"
- [ ] 360px 폭: 가로 넘침 없음, 테이블만 스크롤, 햄버거 Sheet 메뉴·검색
- [ ] 다크 셸 대비(비활성 메뉴, 그룹 라벨), pageHeader 밝은 아래 테두리 (R19)
- [ ] 공고 설명 있는 두 줄 행 밀도
- [ ] (작업 7) 새 공고를 마감 `09:21`로 생성 → 대시보드·공고 관리에 `09:21`로 표시
- [ ] (작업 7) 그 공고의 수정 모달에 `09:21`이 채워지고, 그대로 저장해도 같은 시각
- [ ] (작업 7) 마감일 비우고 생성 → 성공, "—" 표시 / 수정 모달에서 마감일 지우고 저장 → 마감일 없어짐
- [ ] (작업 7) 기존 공고 수정 모달에 9시간 늦은 값이 보임 (보정 전 예상 동작)
- [ ] (작업 7) 공개 공고 `/programs`, `/programs/[id]`에서 새 공고 마감 날짜·"지원 가능" 상태
- [ ] (작업 7) 마감 `00:10`으로 생성 → 대시보드 날짜가 입력한 날짜와 같음

### 작업 4 — ui-builder: 공고 관리·심사 아카이브 통일 (완료)

**완료 내용**
1. 배지 색 토큰화: `--dash-positive-text #6ee7b7`, `--dash-warning-text #fcd34d`, `--dash-negative-text #fda4af` 추가. `src`, `components`에 hex 잔존 없음
2. 공고 관리: 카드 목록 → `DashboardPanel`("전체 공고 N개") + `DataTable`
   - 열: 공고명(대표 링크, 설명 한 줄), 상태(`ProgramStatusBadge`, 기존 `statusStyle` 제거), 마감일, 생성일, 관리(수정·삭제)
   - 빈 상태에 "첫 번째 공고 만들기" 버튼, "+ 새 공고"는 Plus 아이콘 brand 버튼
3. 심사 아카이브: `ArchivePage` → `Suspense` → `ArchiveSearchFromParams`(`useSearchParams`) → `<ArchiveSearch key={q} initialQuery={q} />`
   - `q`는 useState 초기값으로만 사용, q가 바뀌면 key로 리마운트 (useEffect 내 setState 없음)
   - 기존 300ms 디바운스 자동 검색이라 `q`가 있으면 들어오자마자 검색됨
   - 결과 패널 제목: 검색어 있으면 "검색 결과", 없으면 "최근 심사 이력". 열: 회사명, 공고, 총점, 판정(`VerdictBadge`), 심사일
4. 두 페이지 모두 `DashboardPageHeader`의 `backHref`/`backLabel`만 제거 (`pageHeader.tsx`는 그대로)

**변경 파일**
| 파일 | 내용 |
|---|---|
| `src/styles/designToken.css` | 배지 글씨색 토큰 3개 |
| `src/components/dashboard/statusBadge.tsx`, `kpiStrip.tsx`, `src/app/dashboard/page.tsx` | hex → 토큰 |
| `src/app/dashboard/programs/page.tsx` | DataTable로 재작성, `RowActionButton` 추가, `ProgramCard` 삭제 |
| `src/app/dashboard/archive/page.tsx` | Suspense, `?q=` 반영, DataTable로 재작성 |

**기존 기능 유지**
- 모달: `openCreateModal` / `openEditModal(p)` / `openDeleteModal(p)` 그대로 연결, 모달 컴포넌트 위치도 그대로
- 수정·삭제 버튼은 `<button type="button">`이라 `DataTable`의 행 클릭 처리에서 제외됨 (키보드 Enter 포함)
- 데이터·검색 훅(`usePrograms`, `useArchiveSearch`, `useDebouncedValue`) 그대로. 아카이브 행 링크 경로도 기존과 같음 (Cmd/Ctrl+클릭은 새 탭)

**디자인**: 본문 최대 폭과 패딩은 홈과 동일, 테이블 최소 폭 공고 640px / 아카이브 600px (테이블 안에서만 가로 스크롤), 관리 버튼 28px, 날짜 KST `YYYY.MM.DD`

**검증**
- `npx tsc --noEmit` 에러 0 / `npx eslint src components` 에러 0, 기존 경고 1 / `npx jest` 131 통과
- `npx next build` 성공 (`/dashboard/archive`는 동적, Suspense 오류 없음), 새 토큰 클래스 CSS 생성 확인

**작업 5 확인 요청**: 수정·삭제 버튼이 행 이동 없이 모달만 여는지와 삭제 후 갱신, 헤더 검색 → 아카이브 반영, 360px 폭 가로 넘침, 설명 두 줄 행 밀도, R14, pageHeader 밝은 테두리

### 작업 3 — ui-builder: 셸 다크 복귀 + 대시보드 홈 (완료, 보고 필요 사항 없음)

**A. 셸 다크 전환**
- `--dash-*` 토큰 값을 다크 팔레트로 변경 (대시보드 셸 전용이라 다른 화면 영향 없음). 셸 배경은 본문보다 한 단계 어두운 navy-950
- sidebar/topbar의 하드코딩 밝은 색을 토큰으로 교체. 구조·마크업은 유지

**B. 대시보드 홈 (`useAdminDashboard` 사용)**
- 순서: 소개(제목 "운영 현황", 기준 시각, 새로고침) → KPI 스트립 → (접수 추이 차트 | 마감 임박) → 최근 접수 → 공고별 현황
- KPI 이동: 진행 중 공고 → `/dashboard/programs`, 총 접수·심사 대기 → `#program-summary`, 이번 주 → `#recent-applications`, 합격/불합격 → `/dashboard/archive`. 이번 주 보조 문구는 "지난주 전체 N건" (% 증감 없음)
- 로딩은 스켈레톤(`!data && !error`), 에러는 `role="alert"` + "다시 시도"
- 표시 규칙: D-0 → "오늘 마감", `applicantLabel` null → "회사명 미지정", draft → "작성 중" 배지·판정 "—"·제출일 "미제출"
- `DashboardPageHeader`는 홈에서 미사용 (`pageHeader.tsx`는 변경 없음)

**변경/추가 파일**
| 파일 | 내용 |
|---|---|
| `src/styles/designToken.css` | `--dash-*` 다크 값, 본문용 토큰(패널, 행 호버, 스켈레톤, 차트) |
| `src/components/dashboard/sidebar.tsx`, `topbar.tsx` | 하드코딩 색 → 토큰 |
| `src/app/dashboard/page.tsx` | 새 홈 (재작성) |
| `src/components/dashboard/kpiStrip.tsx` | 신규. 한 줄 KPI 스트립 |
| `src/components/dashboard/dataTable.tsx` | 신규. 범용 테이블, `NumericCell` |
| `src/components/dashboard/statusBadge.tsx` | 신규. `StatusBadge`, `ProgramStatusBadge`, `ApplicationStatusBadge`, `VerdictBadge`, `DeadlineBadge` |
| `src/components/dashboard/dashboardPanel.tsx` | 신규. 섹션 패널, `SkeletonBlock` |
| `src/components/dashboard/applicationTrendChart.tsx` | 신규. recharts 30일 막대 차트 |
| `src/components/dashboard/formatters.ts` | 신규. KST 날짜 포맷 (`parseDeadlineMs`를 import만 함) |

**디자인 결정**
- 셸: `--dash-surface` #0a0e1a, `--dash-border` navy-700, `--dash-border-subtle` navy-800, 글자 gray-100/300/400/500, 활성 메뉴 brand-500 14% 배경 + #bfdbfe 글자
- 본문: 패널 #121a2e, 행 호버 white 3.5%, 차트 막대 brand-500 (오늘만 #93c5fd)
- 레이아웃: 최대 폭 1280px, 2열은 lg 1:1 / xl 3:2, 테이블은 자체 가로 스크롤 (min-width 360 / 640 / 760px)
- KPI: lg 5열, 그 미만 2열. 숫자 26px bold tabular-nums
- 테이블: 행 40px, 헤더 32px·11px, 본문 13px. 숫자 열 오른쪽 정렬, 0은 흐리게
- 차트: 높이 220px, X축 `M/D`, 다크 커스텀 툴팁 "10월 15일 (수) / 제출 N건"

**재사용 컴포넌트 props (작업 4용)**
```ts
interface DataTableColumn<T> {
  key: string; header: React.ReactNode; cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center"; numeric?: boolean; primary?: boolean;
  width?: string; nowrap?: boolean; className?: string; headerClassName?: string;
}
interface DataTableProps<T> {
  columns: DataTableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string;
  getRowHref?: (row: T) => string; caption: string; loading?: boolean; skeletonRows?: number;
  emptyMessage?: React.ReactNode; minWidth?: string; density?: "compact" | "default"; className?: string;
}
interface KpiItem { key: string; label: string; value: React.ReactNode; unit?: string; sub?: React.ReactNode;
  href?: string; ariaLabel?: string; tone?: "default" | "brand" | "success" | "warning" | "danger" }
KpiStrip({ items, loading?, ariaLabel?, className? })
StatusBadge({ tone?, dot?, className?, srPrefix?, children })
ProgramStatusBadge({ status }) / ApplicationStatusBadge({ status, isComplete }) / VerdictBadge({ verdict }) / DeadlineBadge({ daysLeft })
DashboardPanel({ title, meta?, description?, action?, flush?, id?, className?, children }) / SkeletonBlock
formatKst(ms, opts) / formatKstIso(iso, opts) / formatDeadline(value, opts)
ApplicationTrendChart({ data, height? })
```

**검증**
- `npx tsc --noEmit`: 에러 0 / `npx eslint src components`: 에러 0, 기존 경고 1 / `npx jest`: 131 통과 (메인에서 재확인)
- Tailwind 임의값 클래스 생성 여부를 직접 컴파일해서 확인
- 브라우저 렌더링은 작업 5에서 확인

**작업 5 확인 요청**: 다크 셸 대비(비활성 메뉴 gray-300, 그룹 라벨 gray-500 11px), 모바일 가로 넘침, recharts `Cell` 콘솔 경고, R14

### 작업 1 — logic-builder: 대시보드 집계 로직 (완료)

**완료 내용**
- 기존 파일 수정 없이 새 파일 5개 추가
- Server Action `getAdminDashboardOverview(orgId)`: 로그인·`org_members` 멤버십을 서버에서 확인, `ActionResult` 반환
- 집계는 순수 함수(`aggregate.ts`)로 분리, `now`를 인자로 받고 날짜 경계는 모두 KST
- Jest 테스트 20개 추가. TZ를 UTC / America/Los_Angeles / Asia/Seoul로 바꿔도 통과
- react-query 훅 `useAdminDashboard()`

**추가 파일**
| 파일 | 내용 |
|---|---|
| `src/types/adminDashboard.ts` | 응답 타입 |
| `src/lib/adminDashboard/aggregate.ts` | KST 날짜 유틸(`kstDayStartMs`, `toKstDateKey`, `kstWeekStartMs`, `parseDeadlineMs`, `kstDaysLeft`), `resolveVerdict`, `isProgramActive`, `pickRecentApplicationIds`, `aggregateAdminDashboard` |
| `src/app/actions/adminDashboardAction.ts` | 권한 확인, 조회, 지원자 라벨 추출, 집계 |
| `src/hooks/useAdminDashboard.ts` | `adminDashboardKeys`, `useAdminDashboard` |
| `src/__tests__/lib/adminDashboard/aggregate.test.ts` | 테스트 20개 |

**타입**
```ts
export type ReviewVerdict = "passed" | "failed";
export interface AdminDashboardKpis {
  activePrograms: number; totalPrograms: number; totalApplications: number;
  thisWeekApplications: number; lastWeekApplications: number;
  pendingReviews: number; passedCount: number; failedCount: number;
}
export interface DailyApplicationCount { date: string; count: number } // KST 'YYYY-MM-DD'
export interface UpcomingDeadline { programId: string; title: string; deadline: string; daysLeft: number; applicationCount: number }
export interface RecentApplication {
  id: string; programId: string; programTitle: string; applicantLabel: string | null;
  status: string; isComplete: boolean; submittedAt: string | null; createdAt: string;
  reviewVerdict: ReviewVerdict | null;
}
export interface ProgramSummary {
  programId: string; title: string; status: string; deadline: string | null;
  total: number; completed: number; pendingReview: number; passed: number; failed: number;
}
export interface AdminDashboardOverview {
  kpis: AdminDashboardKpis; dailyApplications: DailyApplicationCount[];
  upcomingDeadlines: UpcomingDeadline[]; recentApplications: RecentApplication[];
  programSummaries: ProgramSummary[]; generatedAt: string;
}
```

**시그니처**
```ts
getAdminDashboardOverview(orgId: string): Promise<{ success: true; data: AdminDashboardOverview } | { success: false; error: string }>
adminDashboardKeys = { all: ['adminDashboard'], overview: (orgId) => ['adminDashboard','overview',orgId] }
useAdminDashboard(): UseQueryResult<AdminDashboardOverview, Error> // orgId 없으면 enabled:false
```

**KPI 계산 기준 (날짜 경계는 모두 KST)**
| 항목 | 기준 |
|---|---|
| activePrograms | `status === 'active'` 이고 마감일 없음 또는 마감 전 |
| totalPrograms | 기관 전체 공고 (draft, closed 포함) |
| totalApplications | `is_complete = true`만 (draft 제외) |
| thisWeekApplications | 제출 완료 중 `submitted_at`이 이번 주 월요일 00:00 ~ 지금 |
| lastWeekApplications | 제출 완료 중 지난주 월~일 전체. 기간 길이가 달라 UI 문구는 "지난주 전체"로 |
| pendingReviews | 제출 완료 중 `review_results` 0건 |
| passed / failedCount | 제출 완료 중 판정이 합격/불합격인 지원서 수. pending + passed + failed = totalApplications |
| dailyApplications | 오늘 포함 30일, 빈 날 0 |
| upcomingDeadlines | active, 마감 전, `daysLeft <= 7` (오늘 마감 = 0), 임박순 |
| recentApplications | draft 포함, `submitted_at ?? created_at` 내림차순 10건. `applicantLabel`은 `extractCompanyName` 결과 (없으면 null) |
| programSummaries | 전체 공고 `created_at` 내림차순. `total`은 draft 포함 |

**쿼리**: 보통 4회 (org_members 1, programs 1, applications+review_results 임베드 1000건당 1, 최근 10건 라벨용 1). 공고·지원서 조회는 병렬. N+1 없음

**검증**
- `npx tsc --noEmit`: 에러 0
- `npx eslint src`: 에러 0, 기존 경고 1
- `npm test`: 8 스위트, 131 테스트 통과 (메인에서 재확인함)

### 작업 2 — ui-builder: 레이아웃 개편 (완료)

**완료 내용**
- 사이드바: 흰 배경, lucide 아이콘, "개요 / 공고·접수 / 심사" 그룹 라벨. 활성 메뉴는 brand-50 배경, brand-700 굵은 글씨, 왼쪽 3px 막대, `aria-current="page"`. 하단에 "서비스 홈 바로가기"(ArrowUpRight)와 기관 카드(이니셜, 기관명, 역할)
- 상단 헤더 `topbar.tsx`: 브레드크럼(모바일은 현재 페이지명), 아카이브 검색(next/form GET → `/dashboard/archive?q=`), "서비스 홈" 버튼, 기관·사용자 표시. md 미만은 햄버거 → 왼쪽 Sheet 메뉴
- layout.tsx: 사이드바 + (헤더 + main) 구조, orgName/role/userEmail 전달
- 대시보드 홈: "홈으로" 카드 제거, 2열 그리드

**변경 파일**
| 파일 | 내용 |
|---|---|
| `src/components/dashboard/sidebar.tsx` | 전면 수정. `DashboardSidebar`, `DashboardBrand`, `DashboardNav`, `DashboardOrgFooter`, `ROLE_LABEL`, `DashboardOrgInfo` |
| `src/components/dashboard/topbar.tsx` | 신규. `DashboardTopbar`, `ArchiveSearchForm` |
| `src/components/dashboard/navConfig.ts` | 신규. `DASHBOARD_NAV_GROUPS`, `SERVICE_HOME_HREF`, `ARCHIVE_SEARCH_PATH`, `isNavItemActive()`, `getDashboardBreadcrumbs()` |
| `components/ui/sheet.tsx` | 신규. shadcn Sheet (radix-ui Dialog) |
| `src/app/dashboard/layout.tsx` | 헤더 연결, role·기관명 조회 (R2) |
| `src/app/dashboard/page.tsx` | "홈으로" 카드 삭제 |
| `src/styles/designToken.css` | `--dash-*` 토큰 추가 |

**디자인 결정**
- 셸은 흰색, 테두리 gray-200 한 줄, 그림자 없음. 사이드바 232px, 헤더 52px(로고 영역과 아래 선 정렬), 메뉴 항목 36px
- 글씨: 메뉴 13px, 그룹 라벨 11px, 브레드크럼 13px, 보조 정보 11~12px
- 브레드크럼 규칙: `programs/[id]` → "공고 상세", `applications/[appId]` → "지원서 상세", `archive/backfill` → "회사명 보정"(메뉴에는 없음)
- 새 토큰: `--dash-surface, --dash-border, --dash-text, --dash-text-muted, --dash-text-subtle, --dash-hover-bg, --dash-input-bg, --dash-active-bg, --dash-active-text, --dash-active-indicator, --dash-topbar-height, --dash-sidebar-width`

**Props**
```ts
interface DashboardOrgInfo { orgName: string | null; role: "admin" | "member" | null }
DashboardSidebar(props: DashboardOrgInfo)
interface DashboardTopbarProps extends DashboardOrgInfo { userEmail: string | null }
DashboardNav({ onNavigate?: () => void })
getDashboardBreadcrumbs(pathname: string): { label: string; href?: string }[]
```

**검증**
- `npx tsc --noEmit`: 에러 0
- `npx eslint .`: 에러 0, 경고 1 (`src/lib/naver/sync.ts:221` 미사용 변수, 이번 작업과 무관)
- 브라우저 확인은 아직 안 함 (작업 5에서 진행)
