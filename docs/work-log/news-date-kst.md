# 홈 뉴스 날짜 KST 표시 작업 기록

- 이슈: #63 (https://github.com/oldwater0224/applykit/issues/63)
- 브랜치: `develop`
- 시작일: 2026-11-06
- 커밋 규칙: 메시지에 `Refs #63`, 작업이 끝나면 이슈 #63에 커밋 링크 댓글
- 배경: #61 점검 중 발견 (`docs/work-log/news-pager-buttons.md` 작업 4의 O5). `NewsRotator.tsx`의 `formatDate`가 `getUTC*`를 써서 KST 00:00~08:59에 발행된 기사가 하루 전 날짜로 표시됨

## 작업 분담 (서브에이전트 운영 규칙)

화면과 로직이 같은 함수를 공유하므로 동시에 돌리지 않고 순서대로 진행한다.

| 순서 | 담당 | 작업 | 담당 파일 |
|---|---|---|---|
| 1 | logic-builder | 원인 확인, 같은 문제가 있는 곳 전체 조사, KST 날짜 함수 준비(기존 함수 재사용 우선), 경계 테스트 | `src/lib/datetime/kst.ts`, 그 테스트 |
| 2 | ui-builder | 1에서 정한 함수로 화면의 날짜 표시 교체 | 1이 넘겨준 화면 파일 목록 |
| 3 | debugger | tsc, lint, test, build, 시간대(UTC/LA) 검증, 하이드레이션 점검 | 수정 시 상세 보고 |
| 4 | 메인 | 결과 기록, 커밋(`Refs #63`), 푸시, 이슈에 커밋 링크 | 이 문서 |

## 작업 순서와 상태

| 순서 | 담당 | 상태 |
|---|---|---|
| 1 | logic-builder | 완료 |
| 2 | ui-builder | 완료 |
| 3 | debugger | 완료 (커밋 차단 없음) |
| 4 | 메인 | 완료 — 커밋·PR은 이슈 #63 댓글 참고 |

## 단계별 결과

### 작업 1 — logic-builder: KST 날짜 함수, 전체 조사 (완료)

**인터페이스** (`src/lib/datetime/kst.ts`, 새로 추가)
- `formatKstYmd(ms: number): string` — NaN·Infinity면 `""`
- `formatKstYmdFromString(value: string | null | undefined): string` — 해석 불가(null, 빈 문자열, 파싱 불가)면 `""`. 해석은 기존 `parseKstDateTimeMs` 사용(오프셋 있으면 그 시각, 날짜만·오프셋 없음은 KST로 간주)
- 예: `2026-11-04T22:00:00+00:00`(KST 07:00) → `2026.11.05` / `2026-11-04T14:59:59Z` → `2026.11.04` / `2026-11-04T15:00:00Z` → `2026.11.05` / `2026-12-31T15:00:00Z` → `2027.01.01` / `null`·`""`·`"abc"` → `""`
- `getUTC*` + 9h 방식이라 실행 시간대와 무관 → 서버·클라이언트 결과 같음(하이드레이션 안전)

**주요 변경과 이유**
- 새 함수 추가: 기존 `formatKstDate(ms)`는 `"2026. 1. 5."` 형식이고 `formatDeadlineKst`·`programAvailability.ts`가 사용 중이라 형식을 바꾸면 다른 화면이 달라짐
- ms용·문자열용 쌍, 잘못된 입력 `""`는 기존 `formatKstDate`/`formatDeadlineKst`, `isoToKstLocalInput`과 같은 구성
- `formatters.ts`의 `formatKstIso`는 관리자 대시보드 전용이고 잘못된 값에 `"—"`, `Intl` 의존 → 사용 안 함. `Intl.DateTimeFormat`도 `kst.ts` 머리말 원칙("런타임 TZ 의존 메서드 금지, `getUTC*`만")에 따라 사용 안 함

**변경 파일**: `src/lib/datetime/kst.ts`, `src/__tests__/lib/datetime/kst.test.ts` (KST 자정 경계 14:59:59/14:59:59.999/15:00, KST 07:00/08:59/09:00, 월말·연말·윤년, 오프셋 `+0900`/`-05:00`, 날짜만, 오프셋 없음, null/undefined/빈 문자열/공백/파싱 불가/NaN/Infinity)

**검증**: tsc 통과 / 변경 파일 eslint 통과 / jest 전체 TZ=UTC 247, TZ=America/Los_Angeles 247 통과 / datetime 테스트 TZ=UTC·LA·Asia/Seoul 27/27

**조사 결과**
| 구분 | 위치 | 판정 |
|---|---|---|
| 고칠 것 (#63) | `src/app/components/home/NewsRotator.tsx:22-28, 241` | KST 00:00~08:59 기사가 하루 전 날짜 → ui-builder가 교체. 잘못된 값은 `NaN.NaN.NaN` 대신 `""`로 바뀜 |
| 별도 이슈 권장 (로직) | `src/app/actions/dashboardAction.ts:40-45` | (a) UTC 서버라 매월 1일 KST 00:00~08:59에 "이번 달"이 지난달로 계산 (b) 12월이면 `prevYearMonthEnd`가 `${year-1}-01-01`(연도 안 올림) → 전년 동월 건수 0. 2026년 12월에 바로 드러남 |
| 선택 정리 (화면, KST 사용자에겐 정상) | `investors/[id]/page.tsx:49-53`, `funding-timeline.tsx:24-28`, `investment-table.tsx:16-20` | 날짜만 있는 값을 로컬 getter로 표시. UTC보다 서쪽 브라우저에서만 밀림 |
| 〃 | `companies/page.tsx:27-33`, `companies/[id]/page.tsx:20-27`, `applicationReadOnlyView.tsx:105-109` | `toLocaleDateString` timeZone 미지정 (서쪽 시간대에서만 하루 밀림) |
| 〃 | 지원서·심사 화면의 `toLocaleString("ko-KR")` 7곳 | 클라이언트라 브라우저 시간대 따름. 규칙에 완전히 맞추려면 `timeZone: "Asia/Seoul"` |
| 〃 | `applicationStatsCards.tsx:20-24` | "오늘 접수"가 브라우저 로컬 자정 기준 |
| 그대로 | `src/lib/naver/sync.ts:109,136` | `new Date(pubDate).toISOString()` 저장은 정확 (`+0900` → `2026-11-04T22:00:00.000Z`, UTC·LA 확인). 저장이 아니라 표시 문제 |
| 그대로 | `naver/sync.ts:147,171`, `api/news`, `types/news.ts`, `api/cron/sync`, `dart/sync.ts`, `disclosureFundingParser.ts`, `adminDashboard/aggregate.ts`, `formatters.ts`, `applicationTrendChart.tsx` | 상대 시간 창이거나 이미 KST 처리 |

**남은 위험**: `parseKstDateTimeMs`는 RFC 1123(네이버 원본 pubDate) 해석 불가 — 화면엔 DB ISO 값만 와서 영향 없음 / `Date.parse`가 없는 날짜(`2026-02-30`)를 다음 달로 넘김 — 기존과 같음

### 작업 2 — ui-builder: 홈 뉴스 날짜 교체 (완료)

**변경 파일**: `src/app/components/home/NewsRotator.tsx` (+10/-11줄 정도)
- 로컬 `formatDate`(`getUTC*`) 삭제, `import { formatKstYmdFromString } from "@/src/lib/datetime/kst"` 추가
- `visible.map` 안에서 `publishedDate`를 한 번 계산 (식 → 블록 화살표 함수. 두 번 호출보다 읽기 쉬워서). `<a>` 블록은 diff를 줄이려고 다시 들여쓰지 않음
- 빈 날짜 처리: 원래는 날짜 span을 항상 그려서 `""`이면 "언론사 ·"만 남음 → 구분점과 날짜를 `publishedDate`가 있을 때만 렌더 (press 조건과 같은 `&&` 방식)

```tsx
-              {item.press && <span>·</span>}
-              <span>{formatDate(item.publishedAt)}</span>
+              {item.press && publishedDate && <span>·</span>}
+              {publishedDate && <span>{publishedDate}</span>}
```

| press | 날짜 | 표시 |
|---|---|---|
| 있음 | 있음 | "언론사 · 2026.11.05" (기존과 같음) |
| 있음 | 없음 | "언론사" |
| 없음 | 있음 | "2026.11.05" (기존과 같음) |
| 없음 | 없음 | 빈 div |

마크업·클래스·스타일은 그대로

**검증 (ui-builder)**: tsc 통과 / 변경 파일 eslint 통과 / `NewsRotator.test.tsx` 14/14 (테스트 파일 수정 없음)

### 작업 3 — debugger: 검증 (완료, 커밋 차단 없음)

**명령 결과**
| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | 통과 |
| `npm run lint` | 에러 0, 경고 1 (기존 `src/lib/naver/sync.ts` `deduped`, 무관) |
| `TZ=UTC npx jest` | 14 스위트, 252 통과 |
| `TZ=America/Los_Angeles npx jest` | 14 스위트, 252 통과 |
| `npm run build` | 성공 |

**판정**
- `formatKstYmd`/`formatKstYmdFromString`: KST 자정 경계, 연말, 윤일, 오프셋 `+00:00`·`+0900`·`-05:00`·Z, 오프셋 없음, 날짜만, 잘못된 입력 모두 UTC·LA에서 통과. Supabase 실제 형식(마이크로초 포함 `2026-11-04T22:00:00.123456+00:00`)도 정상. `kst.ts` 원칙(`getUTC*`만) 준수
- 기존 함수(`formatKstDate`, `formatDeadlineKst`, `parseKstDateTimeMs` 등) 변경 없음
- NewsRotator: 빈 날짜면 구분점·날짜 숨김, 실행 시간대와 무관한 결과라 하이드레이션 안전, 마크업·스타일 변경 없음. `<a>` 블록 들여쓰기가 한 단계 어긋남(diff 최소화 의도, lint 통과, 그대로 둠)

**추가한 테스트** (`src/__tests__/components/home/NewsRotator.test.tsx`, 5개, UTC·LA 통과). 이전 코드로 되돌리면 5개 모두 실패하는 것 확인 후 복원
1. KST 07:00 발행(`+00:00` 형식) → `테스트일보·2026.11.05`, `2026.11.04` 없음
2. Z 형식 → `2026.11.05`
3. `"not-a-date"` → `테스트일보`만, "·"·"NaN" 없음
4. `""` → `테스트일보`만
5. press 없음 → `2026.11.05`만

**남은 위험**: `+00`처럼 분 없는 오프셋은 `""`로 표시됨 (기존 `parseKstDateTimeMs` 동작, PostgREST는 `+00:00`이라 영향 없음. 이전 코드는 `NaN.NaN.NaN`)

**후속**: 홈 통계 월 계산 문제(`dashboardAction.ts`)는 #64로 분리
