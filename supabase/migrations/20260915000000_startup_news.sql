-- ============================================================
-- startup_news — 네이버 뉴스 API 수집 테이블
-- ============================================================

create table if not exists startup_news (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  description  text,
  url          text        not null,
  naver_url    text,
  press        text,
  published_at timestamptz not null,
  keyword      text,
  round_name   text,
  amount_text  text,
  score        int         not null default 0,
  url_hash     text        not null unique,
  content_key  text        not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_startup_news_published_at
  on startup_news (published_at desc);

create index if not exists idx_startup_news_content_key
  on startup_news (content_key, published_at desc);

create index if not exists idx_startup_news_created_at
  on startup_news (created_at);

alter table startup_news enable row level security;

create policy "startup_news_public_read"
  on startup_news for select
  to anon, authenticated
  using (true);
