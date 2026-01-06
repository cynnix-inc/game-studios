-- cynnix-studios-games initial schema (v0)
-- Notes:
-- - We do NOT hard-foreign-key `players.user_id` to `auth.users.id` to keep local/dev flexibility,
--   but we treat it conceptually as that relationship.
-- - Leaderboard writes are blocked to clients; only Edge Functions using the service role should write.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.saves (
  player_id uuid not null,
  game_key text not null,
  slot text not null default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (player_id, game_key, slot)
);

create table if not exists public.leaderboard_scores (
  game_key text not null,
  mode text not null check (mode in ('time_ms', 'mistakes')),
  player_id uuid not null,
  best_value bigint not null,
  updated_at timestamptz not null default now(),
  primary key (game_key, mode, player_id)
);

-- RLS
alter table public.players enable row level security;
alter table public.saves enable row level security;
alter table public.leaderboard_scores enable row level security;

-- Policies
-- players: authenticated user can read/update only their own row (user_id = auth.uid()).
drop policy if exists "players_select_own" on public.players;
create policy "players_select_own"
on public.players
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own"
on public.players
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- saves: authenticated user can read/write only their own saves (player row must match auth user).
drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own"
on public.saves
for select
to authenticated
using (
  exists (
    select 1 from public.players p
    where p.id = saves.player_id and p.user_id = auth.uid()
  )
);

drop policy if exists "saves_upsert_own" on public.saves;
create policy "saves_upsert_own"
on public.saves
for insert
to authenticated
with check (
  exists (
    select 1 from public.players p
    where p.id = saves.player_id and p.user_id = auth.uid()
  )
);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own"
on public.saves
for update
to authenticated
using (
  exists (
    select 1 from public.players p
    where p.id = saves.player_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players p
    where p.id = saves.player_id and p.user_id = auth.uid()
  )
);

-- leaderboard_scores:
-- - readable by everyone (including anon)
-- - writes MUST be blocked to clients and only performed by edge functions using service role.
drop policy if exists "leaderboard_select_public" on public.leaderboard_scores;
create policy "leaderboard_select_public"
on public.leaderboard_scores
for select
to anon, authenticated
using (true);

-- No insert/update/delete policies => blocked for clients under RLS.
-- Edge Functions using service-role bypass RLS, and can write safely after validating input.



