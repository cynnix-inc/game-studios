# Architecture

## Goals
- **Monorepo**: multiple games, shared code reused safely.
- **Expo-first**: iOS/Android/Web from a single codebase using Expo Router.
- **Supabase-backed**: auth, saves, and leaderboards (RLS enforced; sensitive writes via edge functions).

## Key directories
- `apps/`: Expo apps (one per game)
- `packages/`: reusable TypeScript packages
- `supabase/`: migrations + edge function skeletons for local dev and deployment

## Build and orchestration
- **pnpm workspaces** manage dependencies and linking across apps/packages.
- **Turborepo** orchestrates tasks across the workspace:
  - `lint`, `typecheck`, `test` run in parallel where possible
  - caching is enabled by Turbo (remote caching optional)

### Why there is a `./pnpm` file
Some environments (including certain CI/sandboxes) may not have `pnpm` on PATH. Turbo calls the package manager binary directly. This repo includes a tiny `./pnpm` shim that delegates to `corepack pnpm` to keep Turbo tasks reliable.

## Runtime architecture (Sudoku)

### App state
- `apps/sudoku/src/state/usePlayerStore.ts` (Zustand):
  - player profile (`guest` or `supabase`)
  - puzzle state (grid, givens, solution), selected cell, mistakes, start time
  - helpers to generate new puzzles and serialize state for saving

### Game engine
- `@cynnix-studios/sudoku-core` is pure TS:
  - solver and generator are Node-compatible
  - serialization helpers convert grid ↔ string

### Saves
- Local saves are written via `@cynnix-studios/game-foundation` `createSaveService()` (AsyncStorage).
- App writes local saves:
  - debounced on puzzle changes
  - on background / app state change

Cloud sync is intentionally a placeholder: the interfaces are present but wired later through Supabase.

### Auth
- Supabase auth is wired with placeholders for keys.
- Native:
  - Apple helper: `expo-apple-authentication`
  - Google helper: `@react-native-google-signin/google-signin`
- Web:
  - OAuth redirect flow via Supabase (requires provider config on the Supabase project)

### Leaderboards
- Two modes:
  - `time_ms` (lower is better)
  - `mistakes` (lower is better)
- Client **must not** write `leaderboard_scores` directly (RLS blocks writes).
- Intended flow: client calls edge function (`submit-score`) which uses service-role to upsert best score.

## Adding a new game (workflow)
1. Copy `apps/sudoku` → `apps/<new-game>`.
2. Update identifiers in `app.json` (slug/bundle id/android package).
3. Update package name in `package.json`.
4. Add any new shared logic into `packages/*` instead of duplicating it.
5. Add root scripts (optional) to provide `dev:<new-game>`, `web:<new-game>`, `export:web:<new-game>`.



