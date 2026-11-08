# 홈 통계 월 범위 버그 작업 기록

- 이슈: #64 (https://github.com/oldwater0224/applykit/issues/64)
- 브랜치: `develop`
- 시작일: 2026-11-08 (상태 조사)
- 커밋 규칙: 메시지에 `Refs #64`, 작업이 끝나면 이슈 #64에 커밋 링크 댓글

## 작업 순서와 상태

| 순서 | 담당 | 작업 | 상태 |
|---|---|---|---|
| 0 | logic-builder, ui-builder, debugger | 상태 조사 (읽기 전용) | 완료 |
| 1 | logic-builder | 월 범위 순수 함수 + 액션 수정 + 테스트 | 완료 (2026-11-08 사용자 승인) |
| 2 | ui-builder | 화면 변경 없음 확인 (라벨 문제는 별건) | 완료 — 변경 없음 |
| 3 | debugger | 검증 | 완료 (커밋 차단 없음) |
| 4 | 메인 | 커밋(`Refs #64`), 푸시, 이슈에 커밋 링크 | 완료 — 이슈 #64 댓글 참고 |

## 조사 결과 (2026-11-08)

### 현재 코드 — `src/app/actions/dashboardAction.ts:40-45`
```ts
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
const prevYearMonthStart = `${year - 1}-${String(month).padStart(2, "0")}-01`;
const prevYearMonthEnd = `${year - 1}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, "0")}-01`;
```
- 범위는 DB 쿼리에 쓰이지 않음. `funding_rounds`를 필터 없이 전부 받아 JS에서 `announced_date`(`YYYY-MM-DD` 문자열)를 문자열 비교로 거름 (57-73행)
- 이번 달: `>= monthStart`만 (위쪽 끝 없음). 전년 동월: `>= prevYearMonthStart && < prevYearMonthEnd`
- 이 함수를 다루는 테스트 없음

### 판정
| # | 내용 | 판정 |
|---|---|---|
| a | 12월이면 `prevYearMonthEnd`가 `${year-1}-01-01` → 범위 `[2025-12-01, 2025-01-01)` 역전 → `prevYearMonthlyRounds` 항상 0 | 버그, 재현됨 (UTC·KST 모두) |
| b | 서버 UTC라 `getFullYear/getMonth`가 UTC → 매월 1일 KST 00:00~08:59에 이번 달이 지난달 | 버그, 재현됨 (TZ=UTC, KST 서버에선 없음) |
| c-1 | 이번 달 범위에 위쪽 끝 없음 → 미래 날짜 행이 섞이고, b 때 "지난달 전체 + 1일"이 됨 | 잠재 버그 |
| c-2 | 1월의 전년 계산 | 정상 (단 1/1 KST 새벽엔 b 때문에 a와 겹침) |
| c-3 | 화면 라벨 "전년대비 금액"인데 실제는 건수 비교, 진행 중인 이번 달과 전년 한 달 전체를 비교 | 별도 문제 (화면·기획) |

### 시점별 결과 (TZ=UTC, 운영 서버 가정)
| 시점 (KST) | 이번 달 시작 | 전년 동월 범위 | 결과 |
|---|---|---|---|
| 2026-11-08 | 2026-11-01 | 2025-11-01 ~ 2025-12-01 | 정상 |
| 2026-12-01 00:00 / 08:59 | **2026-11-01** | 2025-11-01 ~ 2025-12-01 | 이번 달 = 11월 전체 + 12/1, 전년 = 2025년 11월 (b) |
| 2026-12-01 09:00 ~ 12-31 | 2026-12-01 | 2025-12-01 ~ **2025-01-01** | 전년 항상 0 (a) |
| 2027-01-01 05:00 | **2026-12-01** | 2025-12-01 ~ **2025-01-01** | a + b 겹침 |
| 2027-01-01 09:00 | 2027-01-01 | 2026-01-01 ~ 2026-02-01 | 정상 |

debugger가 jest fake timers + Supabase mock으로 실제 `getDashboardStats()` 호출해 재현 (TZ=UTC·Asia/Seoul). 스크립트는 세션 scratchpad에만 있음

### 화면 영향 (`src/app/page.tsx`, 이 통계를 쓰는 유일한 곳)
- "전년대비 금액" (9-16행 `monthlyGrowth`): 전년 0이면 `null` → `—` 표시. 12월 내내 조용히 `—` (에러·깨짐 없음, 사용자는 버그인지 구분 불가)
- "이번 달 N건" (73-79행): 월 라벨이 없어 b 때 값이 부풀어도 알아챌 수 없음. 모바일(sm 미만)에선 이 칸이 숨겨짐
- 화면 변경 불필요: 액션 숫자만 고치면 자동 반영, `DashboardStats` 타입 변경 없음

### 수정 제안 (logic-builder)
- 순수 함수 `getKstMonthRanges(nowMs): { monthStart, monthEnd, prevYearMonthStart, prevYearMonthEnd }` — `KST_OFFSET_MS` + `getUTC*`, 12월이면 다음 달 연도 +1. 위치: `src/lib/datetime/kst.ts` 또는 `src/lib/dashboard/monthRange.ts`
- 액션: 40-45행을 함수 호출로 교체, 이번 달 필터에 `< monthEnd` 추가 (c-1)
- 테스트: 2026-12-15, 12-01 KST 00:00/08:59/09:00, 11-30 KST 23:59, 2027-01-01 KST 05:00, 2026-01-15 (TZ=UTC·LA)
- 규모: 함수 약 15줄, 액션 약 6줄, 테스트 약 40줄. 마이그레이션·환경변수 불필요
- 참고: `toKstDateKey`는 `kst.ts`가 아니라 `src/lib/adminDashboard/aggregate.ts:67`에 있음 (이슈 본문 정정)

### 별건 (#64 범위 밖)

사용자 결정 (2026-11-08): 별도 이슈로 만들지 않음. 아직 데이터가 적으니 데이터 확장할 때 함께 고려

- c-3 라벨·비교 기준 불일치
- "이번 달"에 월 표시 없음
- 전체 행을 limit 없이 받아 집계 → PostgREST 최대 행 수(보통 1000)를 넘으면 통계가 잘릴 수 있음 (운영 설정 미확인)
- `announced_date` 변환 실패 시 `YYYYMMDD` 원본이 저장될 수 있어 문자열 비교가 어긋날 수 있음 (드묾)

## 수정 결과

### 작업 1 — logic-builder: 월 범위 수정 (완료)

**변경 파일**
- `src/lib/datetime/kst.ts` (+32): `KstMonthRanges` 인터페이스, 내부 헬퍼 `monthKey`, `getKstMonthRanges(nowMs)`. `KST_OFFSET_MS` + `getUTC*`로 KST 연·월, 12월이면 다음 달 경계를 다음 해 1월로. 전년 동월 끝은 `nextYear - 1`
- `src/app/actions/dashboardAction.ts` (+8/-7): 40-45행을 `getKstMonthRanges(Date.now())`로 교체, 이번 달 필터에 `< monthEnd` 추가 (c-1). 다른 집계·쿼리·`DashboardStats`·라벨·limit는 그대로
- `src/__tests__/lib/datetime/kst.test.ts` (+65): `getKstMonthRanges` 6개
- `src/__tests__/app/actions/dashboardAction.test.ts` (새 파일): `createClient` mock + fake timer로 `getDashboardStats()` 호출 3개

**주요 변경과 이유**
- 위치는 `kst.ts`: 런타임 TZ와 무관한 KST 계산을 모아둔 파일이고 도메인 의존이 없어 대시보드 전용 폴더를 만들 필요 없음
- `toKstDateKey`(`adminDashboard/aggregate.ts`) 재사용 안 함: datetime 유틸이 adminDashboard에 의존하게 되고, 문자열을 다시 쪼개야 해서 `getUTC*` 직접 사용이 더 단순
- 액션에 `Date.now()`를 넘겨 테스트에서 시각 고정 가능

**예**: `2026-11-30T15:00:00Z`(12/1 KST 00:00) → 이번 달 `2026-12-01`~`2027-01-01`, 전년 `2025-12-01`~`2026-01-01`

**테스트**
- `getKstMonthRanges`: 2026-12-15 / 12-01 KST 00:00·08:59:59·09:00 / 11-30 KST 23:59:59.999 / 2027-01-01 KST 05:00 / 2026-01-15 / 2026-11-08
- 액션 (데이터: 2025-11, 2025-12 2건, 2026-01, 2026-11-30, 2026-12 2건, 미래 2027-01-05, null 날짜): 12-15 → 전년 2건·이번 달 2건(미래 제외) / 12-01 KST 00:00 → 이번 달 12월 2건(11-30 제외)·전년 2건 / 11-30 KST 23:59 → 이번 달 1건·전년 1건
- 수정 전 코드로 액션 테스트를 돌리면 3건 모두 실패 확인 후 복원

**검증 (logic-builder)**: tsc 통과 / 변경 파일 eslint 통과 / jest TZ=UTC 261, TZ=America/Los_Angeles 261 통과 / 관련 2개 파일 TZ=Asia/Seoul 36 통과. build는 debugger 단계

**남은 위험**: 새로 생긴 것 없음. `toKstDateKey`와 같은 원리의 KST 변환이 두 곳에 있음 (통합은 범위 밖)

### 작업 2 — ui-builder: 화면 확인 (완료, 변경 없음)
- `getDashboardStats`를 쓰는 곳은 `src/app/page.tsx:2,7` 하나. `DashboardStats`(`src/types/funding.ts:108-117`) 필드가 그대로라 타입 문제 없음
- 증감률(`page.tsx:9-16`)은 두 값이 모두 0보다 클 때만 계산 → 0 나누기 없음. `—`·색 분기(`57-65`, `StatBig` 309-347)는 입력 범위와 무관하게 안전
- 페이지는 `cookies()` 때문에 요청마다 동적 렌더링 → 월 범위가 요청 시각 기준
- 수정 후 기대 변화: 12월에 `—` 대신 실제 증감률, 매월 1일 KST 새벽 "이번 달"이 1일치로 줄어듦, 미래 날짜 행 제외
- 참고 (기존 동작): 이번 달 0건이면 증감률 `—`라 월초 며칠은 `—`가 정상 / 같은 값이면 `+0%` 초록 / 월초에는 큰 음수가 나오기 쉬움(c-3) / 모바일에서 "이번 달" 칸 숨김

### 작업 3 — debugger: 검증 (완료, 커밋 차단 없음, 수정 없음)

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | 통과 |
| `npm run lint` | 에러 0, 경고 1 (기존 `src/lib/naver/sync.ts` `deduped`, 무관) |
| `TZ=UTC npx jest` | 15 스위트, 261 통과 |
| `TZ=America/Los_Angeles npx jest` | 261 통과 |
| `TZ=Asia/Seoul npx jest` | 261 통과 |
| `npm run build` | 성공 |

**판정**
- `getKstMonthRanges` (`kst.ts:193-223`): 12월→다음 해, 1월, 1/1 KST 05:00, 매월 1일 KST 00:00·08:59:59·09:00, 말일 KST 23:59:59.999 모두 정상. `kst.ts` 원칙 준수, 기존 함수 삭제·변경 0줄
- 액션 (`dashboardAction.ts:41-73`): 이번 달 `>= monthStart && < monthEnd`, 전년 `>= prevYearMonthStart && < prevYearMonthEnd`. 총계·라운드별·섹터·최근 5건·쿼리·`DashboardStats` 변경 없음
- 새 액션 테스트 mock: 실제 쿼리 체인(`select`, `select().not()`, `select().order().limit()`)과 맞음, 파일 안에서만 mock, `afterEach`에서 fake timer 정리, 세 시간대 전체 통과로 누수 없음
- 수정 전 코드로 되돌려 새 액션 테스트 실행 → TZ=UTC·Asia/Seoul 모두 3개 실패 (12월 중순 전년 기대 2/실제 0, 12-01 KST 00:00 이번 달 기대 2/실제 4·3, 11-30 23:59 기대 1/실제 4). 복원 후 `cmp`·`git diff --stat` 동일 확인

**남은 위험**: 기능상 없음. 액션 테스트의 12-01 KST 00:00 케이스는 미래 행 영향이 섞여 있어, UTC 서버 새벽 문제(b) 단독 검증은 `kst.test.ts` 단위 테스트가 맡음 (TZ=UTC에선 미래 행이 없어도 실패하므로 회귀 방지는 충분)
