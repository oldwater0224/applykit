# ApplyKit — Claude 작업 안내

## "이전 작업 불러와" 라고 하면

다른 컴퓨터에서 이어서 작업할 때 쓰는 절차다. 아래를 순서대로 바로 실행하고, 4번 보고까지 끝낸 뒤 사용자 승인을 받고 착수한다.

1. 저장소 동기화
   - `git status` 로 커밋 안 된 변경이 없는지 확인 (있으면 멈추고 보고)
   - `git fetch origin && git checkout develop && git pull`
   - `npm install` (node_modules 없거나 package-lock 변경 시), `.env.local` 존재 확인 (없으면 사용자에게 요청, 값은 출력하지 않음)
2. 상태 확인
   - `gh issue view 58 --comments`
   - `git log origin/master..develop --oneline` 으로 master에 아직 안 들어간 커밋 확인
3. 기록 읽기
   - `docs/work-log/server-deadline-check.md` (맨 위 "다음 작업 이어하기" 섹션)
   - `docs/work-log/admin-dashboard-revamp.md` 의 R23 항목과 작업 7 섹션 (마감 데이터 보정 SQL)
4. 사용자에게 보고: 현재 브랜치·PR·이슈 상태, 남은 일 목록과 제안 순서
   - 기존 마감 데이터 -9h 보정 (운영 DB 쓰기 → 대상 행 SELECT 확인 후 사용자 승인)
   - DB 차원 강제 (RLS with check 또는 트리거, `UNIQUE(program_id, user_id)` 마이그레이션)
   - 삭제 경로 마감 확인 정책 결정
   - 로그인 상태 브라우저 확인
   - (선택) N1~N4 정리

## 작업 방식

- 메인 에이전트가 조율하고 서브에이전트에 위임한다: 화면 `ui-builder`, 로직 `logic-builder`, 에러·검증 `debugger` (정의: `.claude/agents/`). 커스텀 타입이 등록되지 않았으면 general-purpose 에이전트에게 해당 정의 파일을 읽고 따르라고 지시한다.
- 서브에이전트 결과는 상세히 받아 `docs/work-log/<작업>.md` 에 정리한다.
- 범위가 커지거나 중요한 로직(인증, 권한, 마감 판정, DB 쓰기)을 건드리면 반드시 사용자에게 보고한다.
- 이슈 작업: 커밋 메시지에 `Refs #N`, 끝나면 이슈에 커밋 링크 댓글.
- 커밋 전 debugger 검증 (tsc, `npm run lint`, `npm test`, `npm run build`).
- `gh pr merge` 는 사용자가 직접 실행한다.
- 날짜·마감은 KST 기준 (`src/lib/datetime/kst.ts`). 모바일 가독성 규칙: `text-[Npx]` → `text-xs sm:text-[Npx]`.
