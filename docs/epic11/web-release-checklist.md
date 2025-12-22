# Epic 11 — Web release checklist (Netlify + Expo export)

This checklist is the Definition of Done for **Epic 11 (Web-only)** release readiness.

## Requirements and references

- Epic definition: `docs/sudoku-epics-v1.1.md` (Epic 11)
- Web export + Netlify conventions: `docs/sudoku-tech-spec-v1.1.md` section 7
- CI web export smoke step: `.github/workflows/ci.yml`

## Pre-flight (once per machine)

- Use Node **22.x** (see `.nvmrc`) and Corepack-pinned pnpm:

```bash
corepack enable
corepack prepare pnpm@9.15.2 --activate
corepack pnpm -v
```

- Install deps:

```bash
corepack pnpm install
```

## Environment variables (required for export)

The web export runs `scripts/verify-expo-public-env.mjs` (via `apps/sudoku/package.json` `export:web`).

Provide these **client-safe** variables (prefix `EXPO_PUBLIC_`):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL` (optional, but recommended)

Sudoku Daily fetching (runtime) may also require:

- `EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL` (used by `apps/sudoku/src/services/daily.ts`)

## Release gates (automated)

Repo gate tests in `packages/sudoku-mvp-gate/tests/` enforce:

- Netlify build command is `pnpm -w export:web:sudoku`
- Netlify publish directory is `apps/sudoku/dist`
- SPA redirect exists in `apps/sudoku/public/_redirects`:
  - `/* /index.html 200`
- Expo web output is static (`apps/sudoku/app.json`: `expo.web.output = "static"`)
- `apps/sudoku` `export:web` script:
  - runs env verification first
  - exports web to `dist`

## Local verification (must be green before PR)

From repo root:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
```

Web export smoke (same as CI):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=example-anon-key \
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=https://example.supabase.co/functions/v1 \
corepack pnpm -w export:web:sudoku
```

Notes:
- The values above are safe dummy values for export correctness; real values are set in Netlify.
- The export guard currently enforces only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `scripts/verify-expo-public-env.mjs`).

## Netlify config (must match)

- `apps/sudoku/netlify.toml`:
  - build command: `pnpm -w export:web:sudoku`
  - publish: `apps/sudoku/dist`
- `apps/sudoku/public/_redirects` includes SPA redirect.

## Versioning / bump process (Web-focused)

Source of truth for app version is `apps/sudoku/app.json`:

- `expo.version` (semver string)

For Web-only release readiness, a version bump is typically:

1. Update `apps/sudoku/app.json` `expo.version`
2. Run the local verification commands above
3. Export web and verify output is generated in `apps/sudoku/dist`

Future (Android/iOS expansion of Epic 11):

- Android uses `android.versionCode`
- iOS uses `ios.buildNumber`

Those are intentionally not required in this Web-only epic.


