-- Epic 3: idempotent daily run submissions + race-safe ranked-first-attempt enforcement
--
-- Adds:
-- - client_submission_id: client-generated UUID idempotency key for retries
-- - unique index on client_submission_id (when present)
-- - partial unique index enforcing a single ranked submission per (player_id, utc_date)

alter table public.daily_runs
add column if not exists client_submission_id uuid;

-- Idempotency: allow at-most-once insertion per client submission id.
create unique index if not exists daily_runs_client_submission_id_unique
on public.daily_runs (client_submission_id)
where client_submission_id is not null;

-- Ranked-first-attempt: enforce only one ranked submission per player per utc date.
create unique index if not exists daily_runs_player_date_ranked_unique
on public.daily_runs (player_id, utc_date)
where ranked_submission = true;


