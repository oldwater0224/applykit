# 홈 뉴스 이전/다음 버튼 작업 기록

- 이슈: #61 (https://github.com/oldwater0224/applykit/issues/61)
- 브랜치: `develop`
- 시작일: 2026-11-03
- 커밋 규칙: 메시지에 `Refs #61`, 작업이 끝나면 이슈 #61에 커밋 링크 댓글

## 1. 요청 이해 (코드 작성 전 확인용)

### 사용자 요청
> 홈 화면 뉴스가 7초마다 자동 갱신되는데, 옆에 화살표 버튼을 눌러 이동할 수 있게 해 달라. 버튼 디자인은 프로젝트에 이미 있는 버튼 디자인을 따른다. 오른쪽 버튼으로 넘기다 마지막 페이지에 도달하면 처음으로 돌아가지 않고 더 이상 넘어가지 않는다.

### 현재 코드 (확인한 사실)
| 파일 | 내용 |
|---|---|
| `src/app/components/home/NewsSection.tsx` | 서버 컴포넌트. `getRecentNews(35)`로 최신순 35개 조회, 제목 줄("스타트업 뉴스" / "7초마다 자동 갱신") + `NewsRotator` 렌더 |
| `src/app/components/home/NewsRotator.tsx` | 클라이언트 컴포넌트. 6개 표시, 7초마다 **35개 중 6개를 무작위로 다시 뽑음** (`pickRandom`). 0.3초 페이드, 마우스를 올리면 갱신 건너뜀, 탭이 숨겨지면 interval 정지 |
| `src/components/ui/pagination.tsx` | 프로젝트에 있는 이전/다음 버튼 디자인: `← 이전` / `다음 →` 텍스트 버튼, `rounded px-2.5 py-1 text-[12px] transition disabled:opacity-25 cursor-pointer`, 글자색 `var(--gray-500)`, 끝이면 `disabled` |

→ 지금은 무작위라 "마지막 페이지" 개념이 없음. 요청을 만족하려면 순서대로 나눈 페이지 구조로 바꿔야 함.

### 결정 사항 (2026-11-03 사용자 답변)
| # | 항목 | 결정 |
|---|---|---|
| D1 | 페이지 방식 | 무작위 → **최신순 6개씩 순서대로 페이지**. 35개면 6페이지(마지막 장 5개). 개수는 데이터에 따라 `ceil(n / 6)` |
| D2 | 화살표 버튼 | 순환 없음. 1페이지에서 `← 이전`, 마지막 페이지에서 `다음 →` 비활성(`disabled`, opacity-25) |
| D3 | 7초 자동 갱신 | 마지막 장 다음은 **1페이지로 돌아가 계속 순환** (버튼과 다름) |
| D4 | 버튼 위치 | 제목 줄 오른쪽, "7초마다 자동 갱신" 옆에 `← 이전  n/N  다음 →` |

### 메인이 정한 기본값 (사용자에게 보고, 이견 있으면 변경)
| # | 항목 | 기본값 | 이유 |
|---|---|---|---|
| B1 | 버튼 클릭 후 타이머 | 클릭하면 7초 타이머를 처음부터 다시 시작 | 누르자마자 자동으로 또 넘어가는 것 방지 |
| B2 | 기존 동작 | 마우스 올리면 자동 갱신 멈춤, 탭 숨김 시 정지, 0.3초 페이드 유지 | 기존 UX 유지 |
| B3 | 페이지가 1개뿐(뉴스 6개 이하) | 버튼·페이지 표시 숨김, 자동 갱신도 의미 없으므로 정지 | `Pagination`도 1페이지면 숨김 |
| B4 | 페이지 표시 | 버튼 사이에 `n/N` (예: `2/6`) | 마지막 장인지 알 수 있게 |
| B5 | 모바일 | 글자 `text-xs sm:text-[12px]` (프로젝트 규칙), 버튼 터치 영역 확보 | CLAUDE.md 모바일 가독성 규칙 |
| B6 | 접근성 | 버튼에 `aria-label="이전 뉴스"` / `"다음 뉴스"`, 페이지 표시에 `aria-live="polite"`는 자동 갱신 때문에 넣지 않음 | 7초마다 읽어 주면 방해됨 |

### 구조 변경 계획
- 제목 줄의 버튼은 페이지 상태가 필요하므로, 제목 줄을 `NewsSection`(서버)에서 `NewsRotator`(클라이언트) 안으로 옮김. `NewsSection`은 데이터 조회와 `<section>`만 담당
- `pickRandom` 제거, `page` 상태(0부터)로 `news.slice(page*6, page*6+6)` 표시
- 페이지 이동은 하나의 함수(`goTo(page)`)로 페이드 처리, 버튼과 자동 갱신이 같이 사용
- 자동 갱신: `(page + 1) % totalPages`, 버튼: `Math.min/Math.max`로 범위 고정

### 확인 체크리스트 (검증용)
- [ ] 첫 화면: 최신 뉴스 6개, `1/6`, `← 이전` 비활성
- [ ] `다음 →`을 5번 누르면 `6/6`, 마지막 장 5개, `다음 →` 비활성, 더 눌러도 그대로
- [ ] `← 이전`으로 1페이지까지 돌아갈 수 있음
- [ ] 7초 대기: 다음 페이지로, 6/6 다음에는 1/6으로 돌아감
- [ ] 버튼 클릭 직후 7초 동안 자동으로 넘어가지 않음
- [ ] 마우스를 올려 두면 자동 갱신 멈춤
- [ ] 모바일 폭(375px)에서 제목 줄이 깨지지 않음
- [ ] tsc / `npm run lint` / `npm test` / `npm run build` 통과

## 2. 작업 순서와 상태

| 순서 | 담당 | 작업 | 상태 |
|---|---|---|---|
| 0 | 메인 | 코드 확인, 사용자 결정, 이슈 #61, 이 문서 | 완료 |
| 1 | ui-builder | `NewsRotator`·`NewsSection` 수정 | 완료 |
| 2 | debugger | 검증 (tsc, lint, test, build, 동작 로직 점검) | 완료 (커밋 차단 없음) |
| 3 | 메인 | 커밋(`Refs #61`), 푸시, 이슈에 커밋 링크 댓글 | 완료 — 코드 `9e37c26`, 기록은 이 문서 커밋 |
| 4 | 사용자/메인 | 브라우저 확인 (아래 작업 2의 남은 항목) | 대기 |

## 3. 단계별 결과

### 작업 1 — ui-builder: 버튼 추가 (완료)

**변경 파일**
- `src/app/components/home/NewsSection.tsx`: 제목 줄 제거. 데이터 조회(`getRecentNews(35)`), 빈 결과면 `null`, `<section className="mb-6">` + `NewsRotator`만 남김
- `src/app/components/home/NewsRotator.tsx`: `pickRandom` 제거, 최신순 6개씩 페이지. 제목 줄(왼쪽 "스타트업 뉴스", 오른쪽 "7초마다 자동 갱신" + `← 이전  n/N  다음 →`)을 이 컴포넌트로 옮김. 카드 마크업·스타일은 변경 없음 (`git diff -w` 기준 들여쓰기만 바뀜)

**상태·타이머 설계**
| 이름 | 종류 | 역할 |
|---|---|---|
| `page` | state | 이동 목표 페이지. 클릭 즉시 바뀜 → 버튼 비활성·`n/N` 표시 기준 |
| `shownPage` | state | 실제로 카드를 그리는 페이지. 0.3초 페이드아웃 후 바뀜 |
| `fading` | state | 그리드 투명도 |
| `pageRef` | ref | 최신 목표 페이지 (타이머 콜백·연속 클릭이 오래된 값을 보지 않게) |
| `hovering` | ref | 마우스가 그리드 위에 있는지 |
| `intervalRef` | ref | 7초 interval |
| `fadeTimeoutRef` | ref | 페이드 setTimeout |

- `goTo(next)`: 버튼·자동 갱신 공통. `pageRef`·`page` 갱신 → 페이드 시작 → 진행 중인 페이드 타이머 취소 후 0.3초 뒤 `shownPage` 반영. 연속 클릭해도 마지막 목표만 화면에 반영됨
- 버튼(`handleStep(±1)`): 범위(0~totalPages-1)를 벗어나면 무시(순환 없음, D2). 이동하면 `startTimer()`로 7초 재시작(B1)
- 자동 갱신(`rotate`): 마우스가 올라가 있으면 건너뜀. `(page + 1) % totalPages`로 마지막 다음 1페이지(D3)
- `startTimer`: 기존 interval 정리 후, 페이지 1개뿐이거나 탭이 숨겨졌으면 걸지 않음. effect는 마운트 시 타이머 시작 + `visibilitychange`(숨김 정지, 보이면 재시작)만 하고 setState 없음. 언마운트 시 interval·페이드 타이머 정리
- 페이지 1개뿐이면 버튼, `n/N`, "7초마다 자동 갱신" 숨김, interval도 없음(B3)

**명세에서 판단한 부분**
- 375px 대응: 모바일(sm 미만)에서는 "7초마다 자동 갱신" 문구 숨김. 제목 `shrink-0`, 오른쪽 묶음 `min-w-0`
- 버튼 클래스: pagination 버튼(`rounded px-2.5 py-1 transition disabled:opacity-25 cursor-pointer`, `var(--gray-500)`) + `text-xs sm:text-[12px]` + 모바일 터치 영역 `inline-flex items-center min-h-11 sm:min-h-0` + `disabled:cursor-default` + `type="button"`. 원본의 빈 `hover:` 토큰은 뺌. 모바일에서 제목 줄 높이가 약 44px로 커짐
- `n/N`은 목표 페이지 기준이라 클릭 즉시 바뀌고, 카드는 페이드 후 바뀜
- hover로 멈추는 범위는 기존과 같이 카드 그리드만 (버튼 위에서는 안 멈추지만 클릭하면 타이머 재시작)

**검증 (ui-builder)**: `npx tsc --noEmit` 에러 0 / `npm run lint` 에러 0, 경고 1 (기존 `src/lib/naver/sync.ts` 221:3 `deduped` 미사용, 이번 작업과 무관). test·build·브라우저 확인은 debugger 단계

### 작업 2 — debugger: 검증 (완료, 커밋 차단 없음)

**명령 결과** (테스트 추가 후 재실행)
- `npx tsc --noEmit`: 에러 0
- `npm run lint`: 에러 0, 경고 1 (기존 `src/lib/naver/sync.ts` `deduped`, 무관)
- `npm test`: 14 스위트, 241 테스트 통과 (기존 227 + 이번 14)
- `npm run build`: 성공, `/`는 dynamic(`ƒ`)

**항목별 판정** (모두 통과)
| 항목 | 확인 내용 |
|---|---|
| 페이지 분할 | n=35 → 6페이지·마지막 5개, n=7 → 2페이지·둘째 1개, n=6 → 버튼·n/N 없음·타이머 0, n=0 → 에러 없음 (실제로는 `NewsSection`이 null 반환) |
| 버튼 순환 없음 | 6/6에서 다음 더 눌러도 6/6, 1/6에서 이전 눌러도 1/6 |
| 자동 갱신 순환 | 6/6에서 7초 뒤 1/6 |
| 클릭 시 타이머 재시작 | 6초 대기 후 클릭 → 6999ms까지 그대로, 7000ms에 이동 |
| 연속 클릭·페이드 | 100ms 간격 3번 클릭 → 마지막 목표가 표시, 이전 타이머가 덮어쓰지 않음 |
| page·shownPage 불일치 | 최대 300ms, 남는 경로 없음 |
| hover 정지 | 올려 두면 21초간 그대로, 떼면 다음 틱에 이동 |
| 탭 숨김·복귀 | 숨김 시 interval 0, 숨김 중 클릭해도 0, 복귀 시 1로 재시작 |
| 언마운트 정리 | 페이드 중 언마운트 → 타이머 0 |
| 타이머 중복 | 클릭·visibilitychange 반복해도 interval 1 (StrictMode도 안전) |
| React 19 / hooks 규칙 | lint 에러 없음, 렌더 중 ref 읽기·effect 안 setState 없음 |
| SSR 하이드레이션 | `Math.random` 제거, 초기 page 0 고정, 날짜는 UTC getter |
| 모바일 글자 규칙 | 새 클래스는 모두 `text-xs sm:text-[Npx]`. 제목 `text-[13px]`(옮겨 옴), 카드 `text-[13px]`·`text-[12px]`(기존)는 그대로 |

**추가한 테스트**: `src/__tests__/components/home/NewsRotator.test.tsx` (14개, React Testing Library + jest fake timers, `document.hidden` 재정의). 컴포넌트는 수정하지 않음

**비차단 위험 (낮음, 미수정)**: 마운트된 채로 `news` prop만 줄어들면 `shownPage`가 범위를 벗어나 빈 그리드가 될 수 있음 (예: 6/6 보는 중 20개로 줄면 "6/4"·빈 화면, 7초 뒤 복구. 6개 이하로 줄면 새로고침 전까지 빈 화면). 현재는 `/`가 dynamic이라 들어올 때마다 새로 마운트되고, `router.refresh`·`revalidatePath('/')`가 없어 도달 불가로 판단. 홈 새로고침 기능을 넣게 되면 `lastPage = Math.max(totalPages - 1, 0)`로 `page`·`shownPage`를 묶어야 함

**브라우저에서 확인할 항목**
- [ ] 375px 폭에서 제목 줄이 깨지지 않음 (모바일은 "7초마다 자동 갱신" 숨김, 줄 높이 약 44px)
- [ ] 페이드, 비활성 버튼(opacity-25), `n/N` 위치가 기존 페이지네이션 디자인과 어울림
- [ ] 실제 데이터로 첫 화면 `1/6`, 최신순
- [ ] 탭을 바꿨다 돌아오면 자동 갱신 재개
