# Epic 0 — MVP gap list (Sudoku v1.1)

Last updated: 2025-12-23

## Purpose
This is the actionable output of Epic 0: a prioritized gap list with ownership and sequencing (Web first). It is derived from:
- PRD: `docs/sudoku-prd-v1.1-mvp.md`
- Tech spec: `docs/sudoku-tech-spec-v1.1.md`
- Traceability: `docs/epic0/traceability-matrix-v1.1.md`

## Sequencing (Web first)
Recommended order:
1. **Epic 0**: validation gate + trusted writes readiness + schema alignment primitives
2. **Epic 1**: core Free Play loop (notes/undo/redo)
3. **Epic 9**: web keyboard UX + sizing settings
4. **Epic 2 + 8**: Daily distribution/caching + archive
5. **Epic 3 + 4**: scoring + trusted submission + Daily leaderboards
6. **Epic 5 + 6**: pause/autosave refinement + move-log sync
7. **Epic 7**: guest conversion + auth polish
8. **Epic 10**: analytics
9. **Epic 11**: release readiness (export/package validation)

## P0 gaps (must for MVP Web)
### Completed P0 (shipped)
- **Daily runs table + public leaderboard reads + client write blocked** — Evidence:
  - `supabase/migrations/0002_daily_runs.sql`
  - `supabase/migrations/0004_daily_runs_display_name_and_leaderboard_views.sql`
- **Trusted score submission (server-side scoring + ranked-first enforcement + idempotency)** — Evidence:
  - `supabase/functions/submit-score/index.ts`
  - `supabase/migrations/0003_daily_runs_idempotency.sql`
- **Trusted save upsert + deterministic move-log merge** — Evidence:
  - `supabase/functions/upsert-save/index.ts`
  - `apps/sudoku/src/services/sync.ts`
- **Secret safety** enforced by gate tests — Evidence:
  - `packages/sudoku-mvp-gate/tests/secret-safety.test.ts`
- **PRD scoring, UTC keying, puzzle keys** (pure TS + tests) — Evidence:
  - `packages/sudoku-core/src/engine/scoring.ts`
  - `packages/sudoku-core/src/engine/dailyUtc.ts`
  - `packages/sudoku-core/src/engine/puzzleKeys.ts`
  - `packages/sudoku-mvp-gate/tests/scoring.test.ts`
  - `packages/sudoku-mvp-gate/tests/utc-and-keys.test.ts`
  - `packages/sudoku-mvp-gate/tests/edge-function-contract.test.ts`

### Remaining “must-fix before PR” items (if any are discovered by runtime smoke/E2E)
- **Web runtime E2E coverage** (Playwright smoke) to validate keyboard/focus and core flows (see Epic 11 + rule 10). Owner: App/UI
- **Explicitly decide + implement `app_open` emission** (PRD 12). Owner: App

## P1 gaps (important next)
### Remaining P1 (validate + harden)
- **Guest-to-account conversion UX + migration validation** (PRD 9.1–9.2): saves/stats/settings should survive sign-in. Owner: App
- **Telemetry completeness** (PRD 12): ensure all required events are emitted and validated (especially `app_open` and `convert_guest_to_account`). Owner: App
- **Hint UX scope**: PRD defines penalty types but does not fully specify hint UX; current MVP ships `reveal_cell_value`. Owner: Product/Eng (WBD decision)

## P2 gaps (later / polish)
### P2 (optional / future work)
- Additional hint types beyond `reveal_cell_value` (if/when product wants them).
- Conflict UX polish (sync indicator surfaces last sync times in Settings already; consider in-game surfacing).



