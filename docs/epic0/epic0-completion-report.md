# Epic 0 — MVP requirements validation (scaffolding + gaps) — Completion Report

Last updated: 2025-12-21

## Purpose
Epic 0 delivers:
- a validated “meets/doesn’t meet” checklist against Sudoku v1.1 MVP requirements, and
- a prioritized gap list with ownership and sequencing (Web first),
- plus an automated validation gate for Epic 0 P0 scaffolding/security readiness.

Primary references:
- PRD: `docs/sudoku-prd-v1.1-mvp.md`
- Tech spec: `docs/sudoku-tech-spec-v1.1.md`
- Epics: `docs/sudoku-epics-v1.1.md`
- Architecture: `docs/ARCHITECTURE.md`
- Packages: `docs/PACKAGES.md`

## What we shipped in Epic 0
- **Traceability matrix**: `docs/epic0/traceability-matrix-v1.1.md`
- **MVP gap list**: `docs/epic0/mvp-gap-list-v1.1.md`
- **Epic 0 validation gate** (tests): `packages/sudoku-mvp-gate`
- **PRD scoring + UTC/keying primitives**: `packages/sudoku-core/src/engine/{scoring,utc,puzzleKeys}.ts`
- **Daily runs schema**: `supabase/migrations/0002_daily_runs.sql`
- **Edge Functions upgraded**:
  - `supabase/functions/submit-score/index.ts`
  - `supabase/functions/upsert-save/index.ts`

## Epic 0 validation gate checks (P0)
- **Scoring model**: PRD 8.2 penalty table (pure function unit tests).
- **UTC date keying**: YYYY-MM-DD derived from UTC (pure function unit tests).
- **Puzzle key conventions**: `daily:YYYY-MM-DD` and `free:<difficulty>:<puzzle_id>` (pure function unit tests).
- **Edge function boundary**: stable error shapes + runtime payload validation (static + unit tests).
- **Secret safety**: no service role secrets or service-role usage in Expo apps/packages (static scan test).
- **Schema invariants**: required migrations/tables/policies exist for Daily runs (static migration scan test).

## Completion checklist (Epic 0)
- [x] `docs/epic0/traceability-matrix-v1.1.md` complete, with evidence links.
- [x] `docs/epic0/mvp-gap-list-v1.1.md` complete, prioritized P0/P1/P2, web-first sequencing.
- [x] `packages/sudoku-mvp-gate` exists and runs via `pnpm test`.
- [x] Gate tests pass locally: `PATH=$(pwd):$PATH ./pnpm test --filter @cynnix-studios/sudoku-mvp-gate`
- [x] Edge Functions use runtime validation and stable response shapes.
- [x] No service role secrets referenced from client code (enforced by gate scan).

## Notes / follow-ups
- This report is intentionally “Epic 0 scoped”: it validates readiness and identifies gaps, but does not implement full MVP product epics.
- Biggest remaining P0 product gaps are captured in `docs/epic0/mvp-gap-list-v1.1.md` (keyboard UX, Daily, leaderboards UI, etc.).


