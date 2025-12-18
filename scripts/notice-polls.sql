-- Notice polls/surveys schema
-- Apply this to your Supabase project's SQL editor.

create table if not exists public.notice_polls (
  id bigserial primary key,
  notice_id bigint not null unique references public.notices(id) on delete cascade,
  question text,
  multiple boolean not null default false,
  anonymous boolean not null default false,
  allow_change boolean not null default true,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notice_poll_options (
  id bigserial primary key,
  poll_id bigint not null references public.notice_polls(id) on delete cascade,
  label text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notice_poll_votes (
  id bigserial primary key,
  poll_id bigint not null references public.notice_polls(id) on delete cascade,
  option_id bigint not null references public.notice_poll_options(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now()
);

-- Prevent duplicate votes per option (useful for multiple-choice polls).
create unique index if not exists notice_poll_votes_unique_choice
  on public.notice_poll_votes (poll_id, user_id, option_id);

create index if not exists notice_poll_votes_poll_id_idx
  on public.notice_poll_votes (poll_id);

