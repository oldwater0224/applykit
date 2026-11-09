# 앱 전체 디자인 정리 (unslop) — 감사 기록

- 시작일: 2026-11-09
- 범위: 앱 전체 (사용자 선택)
- 상태: 감사 완료, 방향 승인 대기. 아직 수정한 파일은 없다.

## 작업 분담

| 담당 | 작업 | 결과 |
|---|---|---|
| ui-builder | 전체 화면 감사 (signs.md 기준) | light slop, polish 모드 권장 |
| logic-builder | 디자인 변경이 로직에 미치는 영향 조사 | 로직 파일 변경 없음. 아래 제약 5가지 |
| debugger | 기준선과 테스트 결합 조사 | tsc·lint·test(261)·build 모두 통과. 테스트 결합 3곳 |
| 메인 | 홈 화면 스크린샷, 취합 | 이 문서 |

## 판정: light slop

- AI 슬롭의 대표 신호는 하나도 없다: 그라디언트, 글로우, 이모지, 블롭, 과장 문구, 느낌표.
- 남은 문제는 일관성이다.
  - 굵기 700이 37곳에 쓰였다.
  - 대문자 영문 eyebrow와 tracking 라벨이 있다.
  - `transition-all`이 9곳에 쓰였고, hover 때 위치나 그림자가 바뀐다.
  - 홈의 marquee가 끝없이 반복된다.
  - 아이콘이 섞여 있다: lucide, GNB에 직접 그린 SVG, 유니코드 화살표 약 20곳.
  - 배지 반경이 다르다: 지원자 화면은 알약, 관리자 화면은 4px.
  - 어두운 배경에 밝은 테두리가 쓰였다: `--card-border:#e2e8f0` 약 90곳.
- 화면별 판정:
  - 관리자 개편 셸: no slop에 가깝다.
  - 공개 데이터 화면(`/`, companies, investors, investments): 정리할 것이 가장 많다.
  - 지원자 화면과 관리자 상세 화면: light.
  - login/signup: 디자인 시스템 밖에 있다. navy 배경 위에 흰 카드를 쓴다.

## 이미 있는 버그 (디자인과 함께 고칠 것)

- `src/styles/designToken.css:42` `--card-bg: #;`는 잘못된 값이다. 쓰는 곳이 50곳이고, 그 카드들의 배경이 투명해진다.
- `src/app/globals.css:11` `--font-sans: var(--font-sans)`가 자기 자신을 참조한다. 지금은 body className이 이 문제를 가리고 있다.
- `src/app/layout.tsx:32` body 글자색이 `--gray-900`으로 배경색과 같다. 그래서 하드코딩된 `#fff`가 약 60곳에 있다.
- `programs/[id]/page.tsx:40` 스피너가 `bg-blue-500`이라 속이 꽉 찬 원으로 보인다.
- `programsContent.tsx:40` `tracking-high`는 없는 유틸리티다.
- login과 signup에서 `<main>`이 중첩되어 있다.
- `programsContent.tsx:95-97` 에러 상태에 로그인 안내 문구가 나온다.

## 지켜야 할 제약 (logic-builder, debugger)

1. `PROGRAM_AVAILABILITY_ERROR`와 DB 트리거 메시지는 바꾸지 않는다. 바꾸려면 새 마이그레이션과 원격 적용이 필요하다.
2. 키는 유지하고 라벨과 색만 바꾼다. 해당 키는 "전체" 필터 value, status와 round_name DB 키다.
3. 날짜 형식은 `kst.ts`나 `formatters.ts`의 함수로만 통일한다.
4. `dataTable` 셀 안의 a와 button 태그는 그대로 둔다. 행 클릭 필터가 이 태그에 의존한다.
5. 테스트와 결합된 곳:
   - `NewsRotator.test.tsx`: aria-label, 마지막 자식인 메타 줄, `1/6` 형식, FADE 300ms
   - `programAvailability.test.ts`: 라벨 문구, 뱃지 인라인 스타일 객체
   - `applicationAction.test.ts`: 서버 에러 문구

## 결정이 필요한 것

- 방향 승인. polish 모드로 기존 navy, blue, Pretendard, ApplyKit 워드마크를 유지한다.
- 홈 marquee를 정적 목록으로 바꿀지
- 화면명세서와 충돌하는 항목: 홈 명세 99행의 뉴스 카드 hover translateY, 40행의 제목 `#fff`
- 라운드 9색: 데이터 범주라서 점 색으로만 남긴다
- `/dashboard` 개편 셸은 거의 손대지 않는다

---

# 진행 (이슈 #67)

사용자 결정 (2026-11-09):
- 방향: 이대로 진행한다. 1~6단계로 나눠 진행한다.
- 홈 marquee: 유지한다. reduced-motion일 때만 멈춘다.
- 화면명세서와 충돌하는 부분: unslop 기준을 따르고 명세를 갱신한다.

## 1단계 — 공통 토큰과 기존 시각 버그 (검증 완료, 커밋 대기)

| 담당 | 결과 |
|---|---|
| ui-builder | 파일 8개 수정 (아래) |
| logic-builder | 변경 없음. 로직, 상수, 테스트 중 바뀐 토큰을 참조하는 곳이 없다. `AVAILABILITY_BADGE_STYLE`은 원시 팔레트만 쓰고, 테스트는 `expect.any(String)`만 확인한다. login/signup의 form/action/name/Suspense는 그대로다 |
| debugger | tsc 통과, lint 경고 1개(기존), test 261/261, build 26/26. 빌드 CSS 확인: font-sans가 Pretendard로 해석된다. `--card-bg`는 #121a2e. 스피너 테두리 순서가 맞다. reduced-motion이 출력된다. 토큰 72개에 순환이 없다. 커밋을 막을 문제 없음 |
| 메인 | 브라우저로 `/`, `/companies`, `/login`을 확인했다. 카드에 어두운 패널 배경과 hairline 테두리가 나온다. login 카드 글자가 보인다 |

**변경**
- `designToken.css`
  - 새 토큰: `--text-primary`(gray-100), `--text-secondary`(gray-300), `--text-muted`(gray-400), `--hairline`(rgb(226 232 240 / .08)), `--hairline-strong`(/ .16)
  - `--card-bg`: `#;` → `var(--dash-panel-bg)`. 이유: 관리자 패널에서 이미 쓰는 표면을 그대로 쓴다. navy-800은 hover와 skeleton에 쓰여서 겹친다
  - `--card-border`와 `--card-hover-border`를 hairline으로 바꿨다. 이유: 반투명이라 아래 표면이 달라도 같은 정도로 조용하게 보인다
  - `--dash-text*`가 새 텍스트 토큰을 참조하게 했다. 값은 그대로다
  - gray-500은 대비가 약 3.7:1이라 텍스트 역할에서 뺐다
- `layout.tsx`: body color를 `var(--text-primary)`로 바꿨다. 기존 값은 배경과 같은 색이었다
- `globals.css`
  - `--font-sans`와 `--font-heading`의 순환 참조를 고쳤다 → Pretendard와 시스템 폴백
  - marquee에 reduced-motion 정지를 넣었다
- `programs/[id]/page.tsx`: 꽉 찬 원 스피너를 테두리 스피너로 바꿨다. `role="status"`와 aria-label을 붙였다
- `programsContent.tsx`: 없는 유틸리티 `tracking-high`를 지웠다. 24px 제목이라 자간 0이 맞다
- `login`/`signup`
  - 중첩 `<main>`을 `<section aria-labelledby>`로 바꿨다
  - 흰 카드에 `text-gray-900`을 넣었다. body 색이 바뀌어 생기는 회귀를 막는다. 디자인은 6단계에서 한다
- 화면명세서 37행: 제목 색을 `#fff`에서 `var(--text-primary)`로 바꿨다. 지시는 40행이었지만 실제 제목 행은 37행이었다

**다음 단계로 넘긴 것**
- 2단계
  - 하드코딩된 `#fff` 약 60곳을 `--text-primary`로 바꾼다
  - `--gray-100/200` 테두리를 `--hairline`으로 바꾼다. 해당 위치는 investment-table:56, gnb:226이다
  - investors/[id]:166의 `--gray-700` 글자를 고친다
  - gray-500 본문 글자를 정리한다
- `gnb.tsx:231` 검색 스피너 버그(기존): 인라인 borderColor가 `border-t-transparent`를 덮는다. 3단계에서 GNB를 다룰 때 함께 고친다
- `--card-shadow`와 `--card-hover-shadow`는 5단계에서 정리한다
- 별건: `auth.ts:33`은 비밀번호를 6자 이상으로 검사하는데 `signup/page.tsx:71`은 `minLength={8}`이다. 이번 범위가 아니다

## 2단계: 제목·굵기·텍스트 색 토큰 (검증 완료)

| 담당 | 결과 |
|---|---|
| ui-builder | 파일 41개를 수정하고 `src/components/layout/pageTitle.tsx`를 새로 만들었다 (+501/−553) |
| logic-builder | 바꿀 파일 없음. 피해야 할 문자열 목록을 ui-builder에게 넘겼다: NewsRotator 구조, "전체" value, 서버 메시지 출력부 |
| debugger | tsc 통과, lint는 기존 경고 1개, test 261/261, build 26/26. diff를 검토한 결과 회귀 없음: 색 배경 위 글자, 로직 값, 정의되지 않은 변수, 서버/클라 경계를 확인했다. 수정한 파일 0개 |
| 메인 | 브라우저에서 `/`와 `/investors`를 확인했다. eyebrow가 빠졌고 제목이 통일됐다 |

**변경**
- `PageTitle` 컴포넌트와 `PAGE_TITLE_CLASS`/`PAGE_DESCRIPTION_CLASS` 상수를 만들었다
  - 제목 스타일: 20px, sm 22px, 굵기 600, primary 색
  - 레이아웃이 화면마다 다른 곳은 상수만 쓴다. 컴포넌트에 props가 계속 늘어나지 않게 하려는 것이다
- 영문 eyebrow 4개를 지웠다. 한글 제목과 같은 말을 반복했다
- `font-bold`를 37곳에서 2곳으로 줄였다. 남은 2곳은 워드마크다. 나머지 기준:
  - 페이지 제목은 600
  - 섹션·카드 제목은 500
  - 큰 수치는 600 + tabular-nums
- 11px 미만 글자를 모두 11px로 올렸다. 차트 tick도 포함이다
- uppercase와 tracking을 0곳으로 만들었다. sidebar의 "ADMIN" 배지는 조용한 텍스트 "관리자"로 바꿨다
- 텍스트 색
  - `#fff`와 gray 계열 글자를 역할에 맞는 토큰으로 바꿨다 (약 150줄)
  - 색 배경 위의 흰 글자는 그대로 뒀다
- 밝은 테두리를 `--hairline`(구분선, 격자)과 `--hairline-strong`(드롭다운, 축, 칩)으로 바꿨다
- 문구
  - placeholder 끝의 "..." 4곳을 지웠다
  - 한 문장짜리 빈 상태·검증·대체 문구에서 마침표 약 45곳을 지웠다
  - 여러 문장으로 된 안내와 서버 메시지는 그대로 뒀다

**남긴 것**
- programsContent의 에러 문구: 원인과 관계없이 항상 로그인 안내가 나온다. 별건으로 보고한다
- 서버 메시지는 마침표가 있고 UI 문구는 없어서 섞여 있다
- 진행 중 라벨 "로딩 중..." 등
- 관리자 셸의 semibold

**다음 단계로 넘긴 것**
- 4단계 배지
  - 리드 배지가 amber 위 흰 글자라 대비가 약 2:1이다
  - investors 유형 색 `text-*-700`
  - GNB S/V 타일이 밝다
  - statusBadge muted
- 칩 테두리가 hairline으로 바뀌어 대비가 약해졌다. 4단계에서 칩·배지와 함께 다시 본다

## 3단계: 아이콘 lucide 통일 (검증 완료)

| 담당 | 결과 |
|---|---|
| ui-builder | 파일 약 20개 수정. 유니코드 ←/→와 gnb 직접 그린 SVG 4개를 lucide로 바꿨다 |
| logic-builder | 바꿀 것 없음. 화살표는 화면 텍스트에만 있다. lucide 1.14는 서버 컴포넌트에서 import해도 되고, LucideProvider는 서버 트리에 적용되지 않아 아이콘마다 props를 준다 |
| debugger | tsc 통과, lint 기존 경고 1개, test 261/261, build 26/26. 접근성 이름, 스피너 CSS 순서, truncate를 확인했다. 들여쓰기 1줄만 고쳤다 |
| 메인 | 브라우저 확인: GNB 검색·대시보드 아이콘, 뉴스 이전/다음, "전체 보기" Chevron |

**규칙**
- 아이콘 크기
  - 내비·본문 16px
  - 11~13px 텍스트 옆 14px
  - 모두 strokeWidth 1.5, currentColor
- 간격
  - 방향 화살표 gap-1
  - 동작 아이콘 gap-1.5
  - 사이드바 행 gap-2.5
- 아이콘 크기·두께는 아이콘마다 props로 준다. LucideProvider는 서버 컴포넌트에 적용되지 않기 때문이다

**변경**
- 뒤로가기는 ArrowLeft, "더 보기"는 ChevronRight, 이전/다음은 Chevron, 외부 링크는 ArrowUpRight로 바꿨다
- pageHeader: backLabel 기본값을 "뒤로"로 하고 아이콘은 따로 렌더한다
- sidebar: 활성 아이콘의 strokeWidth 변경과 아이콘 전용 색을 없앴다. 이제 아이콘은 링크 텍스트 색을 따른다
- 스피너 3곳(gnb 검색, dashboard, dashboard/programs): 인라인 borderColor가 덮어쓰던 버그를 고치고 role="status"를 붙였다

**남긴 것**
- formBuilder 175행, 186행의 ↑/↓ 순서 버튼: 글자로 되어 있고 aria-label이 없다. 기존부터 있던 상태다. 4단계에서 함께 고친다
- 입력칸 안 Search 아이콘과 브레드크럼 구분자는 subtle 색으로 둔다. placeholder·장식 역할이기 때문이다
