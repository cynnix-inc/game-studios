-- Sudoku v1.1 Daily runs (PRD-aligned)
--
-- Notes:
-- - Inserts should be performed only by Edge Functions using service role after validating input.
-- - Reads are allowed publicly (MVP leaderboards), subject to future privacy decisions.

create table if not exists public.daily_runs (
  id uuid primary key default gen_random_uuid(),
  utc_date text not null,
  player_id uuid not null,
  raw_time_ms bigint not null,
  score_ms bigint not null,
  mistakes_count int not null default 0,
  hints_used_count int not null default 0,
  hint_breakdown jsonb not null default '{}'::jsonb,
  ranked_submission boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists daily_runs_utc_date_score_idx on public.daily_runs (utc_date, score_ms asc);
create index if not exists daily_runs_utc_date_raw_time_idx on public.daily_runs (utc_date, raw_time_ms asc);
create index if not exists daily_runs_player_date_idx on public.daily_runs (player_id, utc_date);

alter table public.daily_runs enable row level security;

-- Allow public reads for leaderboards (anon + authenticated)
drop policy if exists "daily_runs_select_public" on public.daily_runs;
create policy "daily_runs_select_public"
on public.daily_runs
for select
to anon, authenticated
using (true);

-- No insert/update/delete policies => blocked for clients under RLS.
-- Edge Functions using service-role bypass RLS and write safely.



