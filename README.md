# cynnix-studios-games

Monorepo for Cynnix Studios games using **pnpm workspaces** + **Turborepo** + **Expo (SDK 54)**. The first game is **Sudoku** (iOS/Android/Web). Auth, saves, and leaderboards are designed to use **Supabase**.

## Repo structure (high level)

- **`apps/`**: game apps (Expo). Initial app: `apps/sudoku`
- **`packages/`**: shared TS packages reused across games
- **`supabase/`**: local dev migrations + edge function skeletons
- **`.github/workflows/`**: CI
- **`.cursor/rules/`**: Cursor repo conventions

See:
- `docs/ARCHITECTURE.md` for the overall architecture and workflows
- `docs/PACKAGES.md` for what each `@cynnix-studios/*` package provides

## Prereqs

- Node **22.x LTS**
- pnpm **9.x** (recommended via Corepack)
- Expo CLI (optional): `pnpm dlx expo --help`
- Supabase CLI (optional for local dev): `supabase --version`

### pnpm via Corepack (recommended)

This repo pins pnpm in `package.json` via `packageManager`. Use Corepack so everyone (and CI) uses the same pnpm version:

```bash
corepack prepare pnpm@9.15.2 --activate
corepack pnpm -v
```

Note: the repo also includes a local `./pnpm` shim used by Turbo so tasks can run without requiring a globally-installed `pnpm`.

## Setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Create env file:
   - Copy `.env.example` to `.env`
   - Fill in the TODOs (Supabase URL + anon key, OAuth client IDs)

## Environment variables

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (safe to ship to clients)
- `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL`: Supabase edge functions base URL
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`: OAuth client IDs (TODO)

Notes:
- Do **not** commit secrets.
- Supabase **service role** key is server-only (CI / edge functions). Never ship it in Expo.

## Run Sudoku (mobile)

```bash
corepack pnpm dev:sudoku
```

Then choose iOS/Android from the Expo dev server.

## Run Sudoku (web)

```bash
corepack pnpm web:sudoku
```

## Export Sudoku web for Netlify

```bash
corepack pnpm export:web:sudoku
```

Output is in `apps/sudoku/dist`.

## Available shared packages

All shared packages are in `packages/*` and are imported as `@cynnix-studios/*`:

- **`@cynnix-studios/sudoku-core`**: pure TS Sudoku engine (generator/solver/serialization) + Jest tests
- **`@cynnix-studios/ui`**: lightweight React Native UI primitives and theme tokens
- **`@cynnix-studios/supabase`**: typed Supabase client factory + env helpers + DB types placeholder
- **`@cynnix-studios/game-foundation`**: auth/session helpers, save service (local + cloud placeholders), telemetry hooks, feature flags, env helpers
- **`@cynnix-studios/platform-services`**: platform service interfaces + web/no-op and native stubs (for future Game Center/PGS)

See `docs/PACKAGES.md` for details and usage notes.

## Supabase local dev (placeholder)

This repo includes:
- `supabase/migrations/0001_init.sql` (tables + RLS policies)
- `supabase/functions/*` (edge function skeletons)

Example workflow (once you have Supabase CLI configured):

```bash
supabase start
supabase db reset
```

## Deploy Sudoku web to Netlify

- Netlify config lives in `apps/sudoku/netlify.toml`.
- Build command: `pnpm -w export:web:sudoku`
- Publish directory: `apps/sudoku/dist`
- SPA redirects live in `apps/sudoku/public/_redirects`

## Add the next game

1. Copy `apps/sudoku` to `apps/<new-game>`.
2. Update:
   - `apps/<new-game>/package.json` name
   - `apps/<new-game>/app.json` identifiers (slug, bundle id, android package)
3. Reuse shared packages from `packages/*`.
4. Add root scripts if you want shortcut commands like `dev:<game>`.


