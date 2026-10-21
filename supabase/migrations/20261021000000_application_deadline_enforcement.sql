-- 지원서 마감·상태를 DB에서도 강제 + closed 공고 공개 (이슈 #58, S5·S8)
--
-- 배경 (2026-10-21 운영 DB 조회 결과)
-- - programs RLS public_read_active: status = 'active'만 공개 → closed 공고가 지원자에게 안 보임 (S8)
-- - applications RLS anyone_insert: INSERT with check (true), 역할 public
--   → 비로그인 포함 누구나 아무 user_id·program_id·status로 지원서 행을 넣을 수 있음
--   앱은 로그인 사용자만 applicant_own(auth.uid() = user_id)으로 넣으므로 필요 없는 정책
-- - applicant_own(ALL)만 있어서 Supabase API로 직접 호출하면 마감 후 작성·제출,
--   제출된 지원서 수정·삭제가 가능 (서버 액션 확인을 우회)
-- - 중복 지원 행 0건 → UNIQUE(program_id, user_id) 바로 적용 가능
--
-- 규칙 (서버 checkProgramAcceptingApplications와 같음)
-- - 공고 status = 'active' 이고 마감일이 없거나 now() <= deadline 일 때만 작성·수정·파일 추가
-- - 제출된 지원서(is_complete)는 지원자가 수정·삭제할 수 없고 파일도 추가·삭제할 수 없음
-- - 작성 중 지원서와 그 파일은 마감 후에도 삭제 허용 (S6 결정)
--
-- 검사 대상은 anon / authenticated 역할의 쓰기뿐이다.
-- service_role, 대시보드 SQL Editor(postgres), FK cascade(테이블 소유자 권한으로 실행)는 그대로 통과한다.
-- 운영기관(authenticated)은 지원서 쓰기 정책이 없고, 파일은 지원자 본인 지원서일 때만 검사한다.

begin;

-- ───────────────────────────────────────────────
-- S8: closed 공고도 공개 (다음 사업 예측용). draft는 계속 비공개
-- ───────────────────────────────────────────────
drop policy if exists "public_read_active" on public.programs;
drop policy if exists "public_read_published" on public.programs;
create policy "public_read_published" on public.programs
  for select
  using (status in ('active', 'closed'));

-- ───────────────────────────────────────────────
-- 누구나 지원서를 넣을 수 있던 정책 제거 (applicant_own이 본인 INSERT를 허용)
-- ───────────────────────────────────────────────
drop policy if exists "anyone_insert" on public.applications;

-- ───────────────────────────────────────────────
-- 중복 지원 방지
-- ───────────────────────────────────────────────
alter table public.applications
  drop constraint if exists applications_program_id_user_id_key;
alter table public.applications
  add constraint applications_program_id_user_id_key unique (program_id, user_id);

-- ───────────────────────────────────────────────
-- 공고 접수 가능 여부 확인 (호출자 권한으로 조회 → RLS로 안 보이는 draft는 "찾을 수 없음")
-- ───────────────────────────────────────────────
create or replace function public.assert_program_accepting_applications(p_program_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
  v_deadline timestamptz;
begin
  select status, deadline into v_status, v_deadline
  from public.programs
  where id = p_program_id;

  if not found then
    raise exception '공고를 찾을 수 없습니다.' using errcode = 'P0001';
  end if;

  if v_status is distinct from 'active' then
    raise exception '현재 모집 중인 공고가 아닙니다.' using errcode = 'P0001';
  end if;

  -- 마감 정각까지 허용 (서버 판정과 같음)
  if v_deadline is not null and now() > v_deadline then
    raise exception '마감된 공고입니다. 지원서를 제출할 수 없습니다.' using errcode = 'P0001';
  end if;
end;
$$;

-- ───────────────────────────────────────────────
-- applications 쓰기 검사
-- ───────────────────────────────────────────────
create or replace function public.enforce_application_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.is_complete then
      raise exception '제출된 지원서는 삭제할 수 없습니다.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_complete then
      raise exception '제출된 지원서는 수정할 수 없습니다.' using errcode = 'P0001';
    end if;
    if new.program_id is distinct from old.program_id
       or new.user_id is distinct from old.user_id then
      raise exception '지원서의 공고나 작성자는 바꿀 수 없습니다.' using errcode = 'P0001';
    end if;
  end if;

  perform public.assert_program_accepting_applications(new.program_id);
  return new;
end;
$$;

drop trigger if exists enforce_application_write on public.applications;
create trigger enforce_application_write
  before insert or update or delete on public.applications
  for each row execute function public.enforce_application_write();

-- ───────────────────────────────────────────────
-- application_files 쓰기 검사 (지원자 본인 지원서일 때만)
-- ───────────────────────────────────────────────
create or replace function public.enforce_application_file_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_application_id uuid := coalesce(new.application_id, old.application_id);
  v_user_id uuid;
  v_program_id uuid;
  v_is_complete boolean;
begin
  if current_user not in ('anon', 'authenticated') then
    return coalesce(new, old);
  end if;

  select user_id, program_id, is_complete
    into v_user_id, v_program_id, v_is_complete
  from public.applications
  where id = v_application_id;

  -- 지원서가 안 보이거나 본인 것이 아니면 여기서 판단하지 않고 RLS에 맡김 (운영기관 등)
  if not found or v_user_id is distinct from auth.uid() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if v_is_complete then
      raise exception '제출된 지원서의 파일은 삭제할 수 없습니다.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if v_is_complete then
    raise exception '제출된 지원서에는 파일을 추가할 수 없습니다.' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and new.application_id is distinct from old.application_id then
    raise exception '파일이 속한 지원서는 바꿀 수 없습니다.' using errcode = 'P0001';
  end if;

  perform public.assert_program_accepting_applications(v_program_id);
  return new;
end;
$$;

drop trigger if exists enforce_application_file_write on public.application_files;
create trigger enforce_application_file_write
  before insert or update or delete on public.application_files
  for each row execute function public.enforce_application_file_write();

commit;

-- ───────────────────────────────────────────────
-- 되돌리기 (필요할 때만, SQL Editor에서 실행)
-- ───────────────────────────────────────────────
-- begin;
-- drop trigger if exists enforce_application_file_write on public.application_files;
-- drop trigger if exists enforce_application_write on public.applications;
-- drop function if exists public.enforce_application_file_write();
-- drop function if exists public.enforce_application_write();
-- drop function if exists public.assert_program_accepting_applications(uuid);
-- alter table public.applications drop constraint if exists applications_program_id_user_id_key;
-- create policy "anyone_insert" on public.applications for insert with check (true);
-- drop policy if exists "public_read_published" on public.programs;
-- create policy "public_read_active" on public.programs for select using (status = 'active');
-- commit;
