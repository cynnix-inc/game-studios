# Packages

All shared packages live under `packages/*` and are imported by name (no deep imports).

## `@cynnix-studios/sudoku-core`
**Pure TypeScript Sudoku engine** (Node-compatible; no Expo/React dependencies).

- **What it provides**
  - `solve(grid)` → solved grid (or invalid/no-solution)
  - `generate(difficulty)` → puzzle + solution + givens mask
  - `serializeGrid(grid)` / `parseGrid(string)`
  - `Difficulty` helpers
- **Where used**
  - `apps/sudoku` uses it to generate puzzles and validate input.

## `@cynnix-studios/ui`
**Lightweight React Native UI primitives** and theme tokens.

- **What it provides**
  - `theme` tokens
  - `Screen`, `AppText`, `AppCard`, `AppButton`
- **Design rules**
  - Keep deps minimal; prefer plain RN styles.
  - Avoid pulling in heavy UI frameworks.

## `@cynnix-studios/supabase`
**Supabase client + env helpers**.

- **What it provides**
  - `createTypedSupabaseClient()` (uses `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
  - `getSupabasePublicEnv()`
  - `Database` type placeholder (`src/types/database.types.ts`)
- **Important**
  - Do not include service-role key anywhere in Expo apps.
  - Replace the placeholder `Database` types by generating via Supabase CLI when ready.

## `@cynnix-studios/game-foundation`
Shared “foundation” for games: auth/session, saves, telemetry hooks, feature flags, env helpers.

- **Auth**
  - `signInWithApple(supabase)` (native iOS)
  - `signInWithGoogle(supabase)` (native Android/iOS)
  - `signInWithOAuthRedirect(supabase, provider, redirectTo?)` (web OAuth flow)
- **Saves**
  - `createSaveService()` provides:
    - `local.read/write/clear`
    - `cloud.pull/push` placeholders (intentionally TODO)
- **Feature flags / telemetry**
  - Small interfaces + default no-op implementations for now

## `@cynnix-studios/platform-services`
Interfaces + placeholder implementations for platform features (future Game Center / Play Games Services).

- **What it provides**
  - `PlatformServices` interface (leaderboards etc.)
  - `createWebPlatformServices()` no-op
  - `createNativePlatformServices()` stubs

## Adding a new shared package
1. Create `packages/<name>/package.json`, `tsconfig.json`, and `src/index.ts`.
2. Export through the package entrypoint only.
3. Keep the package focused and reusable (no app-specific imports).



