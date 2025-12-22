-- Epic 10: MVP telemetry events (server-side capture via Edge Function)
--
-- Stores analytics events for product metrics by platform (web/android/ios).
-- Clients are untrusted; inserts should happen via Edge Function using service role.

create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  event_name text not null,
  props jsonb not null default '{}'::jsonb,

  platform text not null check (platform in ('web', 'android', 'ios')),
  app_version text null,

  device_id text not null,
  session_id text not null,

  -- Optional: auth.uid() when present. Null for guests.
  user_id uuid null
);

-- Basic query support (by name, time, user/device)
create index if not exists telemetry_events_created_at_idx on public.telemetry_events (created_at desc);
create index if not exists telemetry_events_name_created_at_idx on public.telemetry_events (event_name, created_at desc);
create index if not exists telemetry_events_user_created_at_idx on public.telemetry_events (user_id, created_at desc) where user_id is not null;
create index if not exists telemetry_events_device_created_at_idx on public.telemetry_events (device_id, created_at desc);

alter table public.telemetry_events enable row level security;

-- MVP: no direct client reads/writes. Keep table private; only service role (Edge Function) writes.
revoke all on public.telemetry_events from anon, authenticated;


