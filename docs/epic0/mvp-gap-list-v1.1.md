# Epic 0 — MVP gap list (Sudoku v1.1)

Last updated: 2025-12-21

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
### Backend + security readiness
- **P0.1 Daily runs table + policies (PRD 8, tech spec 3/5)** — Owner: Backend
  - Add `daily_runs` table (utc_date, score_ms, raw_time_ms, mistakes_count, hints_used_count, hint_breakdown, ranked_submission).
  - RLS: public read for leaderboard; writes only via service role (Edge Function).
- **P0.2 `submit-score` Edge Function real implementation (trusted writes)** — Owner: Backend
  - Validate payload at runtime.
  - Auth required; map auth user → player_id.
  - Compute `score_ms` server-side and enforce ranked-first-attempt per utc_date.
  - Return stable `{ ok, data?, error? }` shape.
- **P0.3 `upsert-save` Edge Function real implementation** — Owner: Backend
  - Validate payload and size.
  - Auth required; map auth user → player_id.
  - Upsert into `public.saves`, return stable shape.
- **P0.4 No secret leakage** — Owner: Platform/Infra
  - Confirm no service role key appears in Expo apps/packages.
  - Enforce via automated scan test.

### Core scoring/time primitives (shared logic)
- **P0.5 Implement PRD scoring computation function** — Owner: App/Core
  - `score_ms = raw_time_ms + mistakes*30_000 + hint_penalty_ms`
  - Add hint penalty mapping per PRD.
  - Unit tests for edge cases.
- **P0.6 UTC date key helper** — Owner: App/Core
  - Ensure `utc_date` is derived from UTC time, globally consistent.
- **P0.7 Puzzle key conventions** — Owner: App/Core
  - Daily `daily:YYYY-MM-DD`; free `free:<difficulty>:<puzzle_id>`.

## P1 gaps (important next)
- **P1.1 Web keyboard UX (PRD 7.2)** — Owner: App/UI (Epic 9)
- **P1.2 Notes mode, undo/redo (PRD 7.1)** — Owner: App/Core (Epic 1)
- **P1.3 Pause behavior + pause-aware raw_time (PRD 7.3, 8.2)** — Owner: App/Core (Epic 5)
- **P1.4 Daily mode (UTC global + archive) + caching model (PRD 4.1B, 6.1, 6.3, tech spec 2.1)** — Owner: App/Core (Epic 2 + 8)
- **P1.5 Daily leaderboards UI with required fields/tabs (PRD 8.3–8.4)** — Owner: App/UI (Epic 4)

## P2 gaps (later / polish)
- **P2.1 Analytics events (PRD 12)** — Owner: App (Epic 10)
- **P2.2 Cross-device sync (move-log merge) and minimal conflict UX (PRD 10)** — Owner: App/Backend (Epic 6)
- **P2.3 Guest-to-account conversion (PRD 9.1–9.2)** — Owner: App/Backend (Epic 7)


