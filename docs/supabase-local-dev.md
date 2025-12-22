# Supabase local dev (CLI + Docker)

## Prereqs

- Docker Desktop running
- Supabase CLI installed (macOS: `brew install supabase/tap/supabase`)

## Start / stop

From the repo root:

- `pnpm supabase:start`
- `pnpm supabase:status` (copy the **anon key**)
- `pnpm supabase:stop`

## Configure the Sudoku app

1. Copy the example env file:
   - macOS/Linux: `cp docs/env.example apps/sudoku/.env`
   - Windows (PowerShell): `Copy-Item docs/env.example apps/sudoku/.env`
2. Run `pnpm supabase:status` and set:
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=...` (use the local anon key from `supabase status`)

Local defaults are already set in `docs/env.example`:

- `EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321`
- `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1`

## Database reset (apply migrations)

- `pnpm supabase:reset`

## Generate TypeScript database types

- `pnpm supabase:gen:types`

This overwrites `packages/supabase/src/types/database.types.ts` (generated file; committed).


