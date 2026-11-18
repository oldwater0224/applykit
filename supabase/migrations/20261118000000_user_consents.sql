-- 이용약관·개인정보 처리방침 버전과 사용자 동의 기록 (이슈 #69)
--
-- 적용 방법
-- - Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여 넣고 실행한다 (postgres 권한 필요:
--   auth.users 트리거 생성).
-- - 앱 코드(src/lib/consent/policy.ts)의 TERMS_VERSION / PRIVACY_VERSION 과
--   아래 시드의 version 이 같아야 한다. 다르면 재동의가 반복된다.
-- - 앱을 먼저 배포해도 된다: proxy는 has_current_consents() 호출이 실패하면 게이트를 통과시킨다.
--   이 파일을 적용하는 순간부터 동의 기록이 없는 기존 가입자는 보호 경로 진입 시 /consent 로 이동한다.
--
-- 구성
-- - legal_documents: 문서 종류별 버전과 현재 버전(is_current). 누구나 조회 가능
-- - user_consents: 사용자별 동의 이력(추가만). 탈퇴(auth.users 삭제) 시 함께 삭제
-- - has_current_consents(): 로그인 사용자가 현재 약관·처리방침 버전과 만 14세 이상에 동의했는지
-- - record_signup_consents(): 가입 시 raw_user_meta_data.consents 를 user_consents 로 기록
--   (이메일 확인 ON이면 가입 직후 세션이 없어 앱에서 insert할 수 없으므로 트리거로 기록)
--
-- 버전 갱신 절차 (나중에 약관을 바꿀 때)
-- 1) insert into public.legal_documents(kind, version, effective_at, is_current) values (..., false);
--    effective_at 에는 새 판의 제정일을 넣는다
-- 2) 같은 트랜잭션에서 기존 is_current=false → 새 버전 is_current=true
-- 3) 앱의 *_VERSION 상수를 같은 값으로 배포

begin;

-- ───────────────────────────────────────────────
-- legal_documents
-- ───────────────────────────────────────────────
create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('terms', 'privacy')),
  version text not null,
  -- 이 판의 제정일(앱 LEGAL_EFFECTIVE_DATE와 같은 날짜). 실제 적용은 "게시한 날부터"이며
  -- 재동의 판단에는 쓰지 않는다(has_current_consents()는 is_current 버전만 본다).
  effective_at timestamptz not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kind, version)
);

-- 종류별 현재 버전은 하나만
create unique index if not exists legal_documents_one_current_per_kind
  on public.legal_documents (kind)
  where is_current;

alter table public.legal_documents enable row level security;

drop policy if exists "legal_documents_public_read" on public.legal_documents;
create policy "legal_documents_public_read" on public.legal_documents
  for select
  using (true);

-- Supabase 기본 권한(anon·authenticated에 ALL)을 걷고 조회만 허용한다
revoke all on public.legal_documents from anon, authenticated;
grant select on public.legal_documents to anon, authenticated;

insert into public.legal_documents (kind, version, effective_at, is_current)
values
  ('terms', '2026-11-01', '2026-11-01 00:00:00+09', true),
  ('privacy', '2026-11-01', '2026-11-01 00:00:00+09', true)
on conflict (kind, version) do nothing;

-- ───────────────────────────────────────────────
-- user_consents (추가만 하는 이력)
-- ───────────────────────────────────────────────
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('terms', 'privacy', 'age14')),
  version text, -- age14 는 null
  agreed boolean not null,
  source text not null check (source in ('signup', 'reconsent')),
  created_at timestamptz not null default now()
);

create index if not exists user_consents_user_kind_idx
  on public.user_consents (user_id, kind);

alter table public.user_consents enable row level security;

-- 본인 이력 조회
drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own" on public.user_consents
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 본인 재동의만 추가 가능. 가입 동의(source='signup')는 트리거만 기록한다.
-- update/delete 정책은 두지 않는다 (이력 변경 불가)
drop policy if exists "user_consents_insert_own" on public.user_consents;
create policy "user_consents_insert_own" on public.user_consents
  for insert
  to authenticated
  with check (auth.uid() = user_id and source = 'reconsent');

-- Supabase 기본 권한(ALL, truncate 포함)을 걷고 필요한 권한만 다시 준다. update/delete는 권한 차원에서도 막는다
revoke all on public.user_consents from anon, authenticated;
grant select, insert on public.user_consents to authenticated;

-- ───────────────────────────────────────────────
-- has_current_consents(): 인자 없이 auth.uid() 기준
-- ───────────────────────────────────────────────
create or replace function public.has_current_consents()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.legal_documents d
      join public.user_consents c
        on c.kind = d.kind and c.version = d.version
      where d.kind = 'terms' and d.is_current
        and c.user_id = auth.uid() and c.agreed
    )
    and exists (
      select 1
      from public.legal_documents d
      join public.user_consents c
        on c.kind = d.kind and c.version = d.version
      where d.kind = 'privacy' and d.is_current
        and c.user_id = auth.uid() and c.agreed
    )
    and exists (
      select 1
      from public.user_consents c
      where c.user_id = auth.uid() and c.kind = 'age14' and c.agreed
    );
$$;

revoke all on function public.has_current_consents() from public, anon;
grant execute on function public.has_current_consents() to authenticated;

-- ───────────────────────────────────────────────
-- record_signup_consents(): 가입 트리거. 어떤 경우에도 가입을 실패시키지 않는다
-- ───────────────────────────────────────────────
create or replace function public.record_signup_consents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consents jsonb;
  v_terms text;
  v_privacy text;
begin
  v_consents := new.raw_user_meta_data -> 'consents';
  if v_consents is null or jsonb_typeof(v_consents) <> 'object' then
    return new;
  end if;

  select version into v_terms
    from public.legal_documents where kind = 'terms' and is_current;
  select version into v_privacy
    from public.legal_documents where kind = 'privacy' and is_current;

  -- 현재 버전과 일치할 때만 기록 (캐스트 없이 문자열 비교)
  if v_terms is not null and v_consents ->> 'terms' = v_terms then
    insert into public.user_consents (user_id, kind, version, agreed, source)
    values (new.id, 'terms', v_terms, true, 'signup');
  end if;

  if v_privacy is not null and v_consents ->> 'privacy' = v_privacy then
    insert into public.user_consents (user_id, kind, version, agreed, source)
    values (new.id, 'privacy', v_privacy, true, 'signup');
  end if;

  if v_consents ->> 'age14' = 'true' then
    insert into public.user_consents (user_id, kind, version, agreed, source)
    values (new.id, 'age14', null, true, 'signup');
  end if;

  return new;
exception when others then
  -- 기록 실패는 가입을 막지 않는다. 기록이 없으면 다음 보호 경로 진입 때 /consent 로 재동의한다.
  raise warning 'record_signup_consents failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function public.record_signup_consents() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_record_consents on auth.users;
create trigger on_auth_user_created_record_consents
  after insert on auth.users
  for each row execute function public.record_signup_consents();

commit;

-- ───────────────────────────────────────────────
-- 되돌리기 (필요할 때만, SQL Editor에서 실행. user_consents 이력이 함께 삭제된다)
-- ───────────────────────────────────────────────
-- begin;
-- drop trigger if exists on_auth_user_created_record_consents on auth.users;
-- drop function if exists public.record_signup_consents();
-- drop function if exists public.has_current_consents();
-- drop table if exists public.user_consents;
-- drop table if exists public.legal_documents;
-- commit;
