# Standards compliance review (2025-12-22)

Branch: `feature/standards-compliance-20251222` (based on `dev`)

Rules source: `.cursor/rules/*.mdc` (`00`–`11`)

## Executive summary

- **Current health (automated)**: `pnpm lint`, `pnpm typecheck`, `pnpm test` are green on this branch after two small type-safety fixes in `packages/sudoku-core` and one test cleanup in `packages/sudoku-mvp-gate`.
- **Main remaining gaps vs new standards**:
  - **Edge Functions** are missing required **CORS/OPTIONS**, **`requestId`**, and **observability/timeout/retry** behavior (`08`, `11`).
  - **Client-side external calls** (`fetch`) do not enforce **timeouts/retries** (`11`).
  - **Sudoku web a11y** likely lacks required **keyboard + focus** interaction for the grid (`10`).
  - Root scripts include a **shell-specific PATH** hack (`09`).

## Findings by rule file

### `00-repo-conventions.mdc` (layout/scripts/env)
- **OK**: monorepo layout matches `apps/*`, `packages/*`, `supabase/*`.
- **OK**: `.nvmrc` present; Node engines set to `22.x` (see also `06`).
- **OK**: Supabase client env uses `EXPO_PUBLIC_*` (see also `03`).

### `01-typescript-and-imports.mdc`
- **Fixed (high)**: removed `any` usage in a boundary validator (`packages/sudoku-core/src/engine/dailyValidation.ts`) by using `unknown` + narrowing.
- **OK**: app imports use package entrypoints for shared packages (e.g., `@cynnix-studios/ui`, `@cynnix-studios/sudoku-core`).

### `02-expo-and-web.mdc`
- **OK**: Expo Router structure and identifiers match expectations (`apps/sudoku/app/**`, `apps/sudoku/app.json`).
- **To verify (low)**: `_redirects` presence and correctness for SPA export (`apps/sudoku/public/_redirects`).

### `03-supabase.mdc`
- **OK**: apps use typed client factory from `@cynnix-studios/supabase` (`apps/sudoku/src/services/auth.ts`, `packages/supabase/src/client.ts`).
- **OK**: migrations enable RLS and block client writes where required (`supabase/migrations/0001_init.sql`, `0002_daily_runs.sql`).
- **Risk (medium)**: app-side `submitScore` uses an Edge Function endpoint but does not handle stable envelope/error mapping yet (see `08`/`11`).

### `04-architecture-boundaries.mdc`
- **Risk (medium)**: `apps/sudoku/app/game/index.tsx` contains persistence orchestration and app-state side effects; consider extracting into app service/hooks to keep routes thin.
- **OK**: `packages/sudoku-core` remains platform-agnostic/pure TS.

### `05-formatting-and-repo-hygiene.mdc`
- **OK**: `.editorconfig` and `.gitattributes` exist and enforce LF defaults.
- **To verify (low)**: `.prettierrc` exists and is aligned with `pnpm format`.

### `06-versioning-and-toolchain.mdc`
- **OK**: root `package.json` has `engines.node: 22.x` and `packageManager: pnpm@...`.
- **OK**: Expo pinned to a minor line (`apps/sudoku/package.json` uses `expo: ~54.0.0`).
- **To address (medium)**: root scripts use `PATH=$(pwd):$PATH turbo ...` which is not cross-platform (see `09`).

### `07-testing.mdc`
- **OK**: logic packages have deterministic Jest tests (`packages/sudoku-core/tests/**`, `packages/sudoku-mvp-gate/tests/**`).
- **Gap (high, upcoming work)**: new Edge Function contract requirements (`08`) need tests that assert CORS, `requestId`, and stable envelopes; current tests do not cover these.

### `08-supabase-edge-functions.mdc`
- **Gap (blocker)**: Edge Functions do not fully comply with required HTTP behavior and response contract:
  - Missing `OPTIONS` + CORS headers
  - Missing `requestId` in success/error envelopes
  - Error codes/status mapping don’t match the required set (`VALIDATION_ERROR`, `UNAUTHENTICATED`, etc.)
  - `supabase/functions/submit-score/index.ts`
  - `supabase/functions/upsert-save/index.ts`

### `09-process-and-governance.mdc`
- **Gap (high)**: root scripts currently depend on shell-specific PATH syntax; must be cross-platform.
- **OK (process)**: work is on a `feature/*` branch off `dev`.

### `10-design-system-and-a11y.mdc`
- **Gap (high)**: Sudoku grid interaction on web likely lacks required **keyboard support** and **focus management** (`apps/sudoku/src/components/SudokuGrid.tsx`, route usage in `apps/sudoku/app/game/index.tsx` / `apps/sudoku/app/daily/index.tsx`).
- **OK**: interactive elements have labels/roles in several places (e.g., cell `accessibilityLabel`).

### `11-observability-and-integrations.mdc`
- **Gap (high)**: external calls lack **timeouts** and **bounded retries**:
  - `apps/sudoku/src/services/daily.ts` (`fetchDailyManifest`, `fetchDailyPayload`)
  - `apps/sudoku/src/services/leaderboard.ts` (`submitScore`)
  - Edge Functions should also apply timeouts/retries to upstream calls and log with correlation/request IDs (ties back to `08`).

## Proposed remediation order (matches todo plan)
1. Edge Functions contract + observability (`08`, `11`) with tests first (`07`).
2. Client-side fetch wrapper for timeouts/retries (`11`) with tests first.
3. Sudoku web keyboard + focus for the grid (`10`) with tests (or deterministic controller tests).
4. Make root scripts cross-platform (`09`).
5. Token strategy alignment (`10`) with minimal, non-disruptive changes.


