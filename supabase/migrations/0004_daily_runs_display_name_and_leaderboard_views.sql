-- Epic 4: Daily leaderboard display name + ranked views
--
-- Adds:
-- - daily_runs.display_name: public-safe name snapshot for leaderboard rows
-- - ranked leaderboard views for Score and Raw Time tabs (Top N + Around You)
--
-- Notes:
-- - We keep display_name on daily_runs to avoid public reads on players table.
-- - Views compute deterministic ranks per utc_date using row_number() with tie-breakers.

alter table public.daily_runs
add column if not exists display_name text not null default 'Player';

create or replace view public.daily_leaderboard_score_v1 as
select
  dr.utc_date,
  row_number() over (
    partition by dr.utc_date
    order by dr.score_ms asc, dr.created_at asc, dr.player_id asc
  ) as rank,
  dr.player_id,
  dr.display_name,
  dr.score_ms,
  dr.raw_time_ms,
  dr.mistakes_count,
  dr.hints_used_count,
  dr.created_at
from public.daily_runs dr
where dr.ranked_submission = true;

create or replace view public.daily_leaderboard_raw_time_v1 as
select
  dr.utc_date,
  row_number() over (
    partition by dr.utc_date
    order by dr.raw_time_ms asc, dr.created_at asc, dr.player_id asc
  ) as rank,
  dr.player_id,
  dr.display_name,
  dr.score_ms,
  dr.raw_time_ms,
  dr.mistakes_count,
  dr.hints_used_count,
  dr.created_at
from public.daily_runs dr
where dr.ranked_submission = true;

-- Public read access (MVP leaderboards)
grant select on public.daily_leaderboard_score_v1 to anon, authenticated;
grant select on public.daily_leaderboard_raw_time_v1 to anon, authenticated;


