-- 기존 공고 마감일 -9시간 보정 (R23, 이슈 #58)
--
-- 배경
--   PR #57 이전에는 공고 생성·수정 모달의 datetime-local 값(오프셋 없음)을 그대로 저장해
--   DB가 UTC로 해석했다. KST 09:21 입력 → KST 18:21로 저장 (9시간 늦음).
--   PR #57(2026-10-18 12:56 KST 머지)부터 서버가 KST로 변환해 저장한다.
--   deadline을 쓰는 곳은 programActions.ts의 createProgram/updateProgram뿐이다.
--
-- 대상
--   PR #57 배포 전에 마감일이 저장된 공고. programs에 updated_at이 없어서
--   배포 후 수정 모달에서 마감일을 직접 고친 공고는 구별할 수 없다
--   (모달은 9시간 늦은 값을 그대로 보여 주므로, 손대지 않고 저장했다면 여전히 늦음).
--   → 1단계 결과를 보고 사람이 id를 확정한다.
--
-- 마이그레이션이 아니다. Supabase SQL Editor에서 단계별로 직접 실행한다.

-- ───────────────────────────────────────────────
-- 1단계: 확인 (SELECT만)
--   cutoff는 PR #57 머지 시각. Vercel에서 실제 배포 완료 시각을 확인해 필요하면 바꾼다.
--   created_after_merge = true 인 행은 배포 전후가 모호하니 따로 판단한다.
-- ───────────────────────────────────────────────
select id,
       title,
       status,
       created_at at time zone 'Asia/Seoul'                      as created_kst,
       deadline,
       deadline at time zone 'Asia/Seoul'                        as shown_kst,
       (deadline - interval '9 hours') at time zone 'Asia/Seoul' as intended_kst,
       created_at >= '2026-10-18 12:56:10+09'::timestamptz        as created_after_merge
from programs
where deadline is not null
order by created_at;

-- ───────────────────────────────────────────────
-- 2단계: 보정 (1단계에서 확정한 id만)
--   백업 테이블에 원래 값을 남긴 뒤 같은 트랜잭션에서 수정한다.
--   이미 백업된 id는 건너뛰므로 다시 실행해도 18시간 당겨지지 않는다.
--   반환 행 수가 id 개수와 다르면 commit 대신 rollback.
-- ───────────────────────────────────────────────
begin;

create table if not exists programs_deadline_backup_20261019 as
select id, deadline, now() as backed_up_at
from programs
where false;

with backed_up as (
  insert into programs_deadline_backup_20261019 (id, deadline, backed_up_at)
  select id, deadline, now()
  from programs
  where id in ('<id1>', '<id2>')
    and deadline is not null
    and id not in (select id from programs_deadline_backup_20261019)
  returning id
)
update programs
set deadline = deadline - interval '9 hours'
where id in (select id from backed_up)
returning id, title, deadline at time zone 'Asia/Seoul' as new_deadline_kst;

commit;

-- ───────────────────────────────────────────────
-- 되돌리기 (필요할 때만)
-- ───────────────────────────────────────────────
-- update programs p
-- set deadline = b.deadline
-- from programs_deadline_backup_20261019 b
-- where p.id = b.id;

-- 확인이 끝나면 백업 테이블 삭제
-- drop table programs_deadline_backup_20261019;
