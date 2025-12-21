# Epic 1 — Core Sudoku play loop (Free Play) — Development Plan (TDD)

Last updated: 2025-12-21

## Goal
Deliver a fast, clean **Free Play** Sudoku experience that meets MVP requirements for:
- Starting a new puzzle by **difficulty** (Easy, Medium, Hard, Expert, Extreme)
- Core interactions: select cell, enter 1–9, clear/erase
- **Notes mode** with per-cell notes display and editing
- **Undo/Redo** with history persisting across pause/resume (at minimum: background/foreground + navigation; and via local save restore)
- Performance targets: “start puzzle” < 3s and instant-feeling inputs

## Scope (Epic 1)
Maps directly to dev backlog:
- **US-1** Start a Free Play puzzle (difficulty selection; valid Sudoku; unique solution)
- **US-2** Input values and notes (cell selection, digits, clear, notes mode, notes display)
- **US-3** Undo and redo (values + notes; persists across pause/resume)

## Non-goals (defer to later epics)
- Daily mode, archive, scoring, and leaderboards (Epics 2–4)
- Cross-device sync and server persistence (Epics 6–7)
- Full pause UX (hide board, timer stop) and richer autosave policy (Epic 5)
- Web keyboard shortcuts (Epic 9)

## Current baseline (repo reality)
Already present:
- A functional `apps/sudoku/app/game/index.tsx` Free Play grid with tap-select and digit entry
- Local save + hydration wiring via `apps/sudoku/src/services/saves.ts`

Missing to satisfy Epic 1:
- 5-difficulty model (core currently has 3)
- Unique-solution generation (core generator currently only checks solvable)
- Notes mode + notes UI
- Undo/redo and saving history in the local save payload

## Architecture approach (boundaries)
- **Domain / engine (packages)**: Put the Free Play “game state reducer” in `packages/sudoku-core` as pure TypeScript (no React / RN / storage).
- **App (apps/sudoku)**: Zustand store becomes a thin adapter over the reducer; UI stays thin and delegates to store actions; save service persists the reducer state.

## Proposed domain model (pure, serializable)

### Notes representation
Use a compact bitmask per cell:
- `notes[i]` is a number 0..511 (bits 1–9 represent candidate digits)
- Easy to serialize, fast to update, easy to test

### Actions for undo/redo
Represent each user mutation as an invertible action:
- Set digit
- Clear digit
- Add note / remove note (or toggle note)
- Toggle notes mode (optional to include in history; we will **not** include it unless needed)

Undo/redo stacks store actions with enough “before/after” data to be replayed without ambiguity.

### Save payload (local)
Persist (at minimum):
- puzzle grid, solution grid, givens mask, difficulty
- notes bitmask array (length 81)
- undo stack + redo stack (bounded to a reasonable max, e.g. 500)
- startedAtMs, mistakes (existing fields; mistakes isn’t Epic 1-critical but keep it stable)
- notesMode boolean

Backward compatibility: if older save payloads lack new fields, default them safely.

## TDD test plan

### `packages/sudoku-core` (unit tests)
- **Difficulty model**
  - Supports `easy|medium|hard|expert|extreme`
  - `givensForDifficulty` returns expected count per difficulty
- **Generator uniqueness**
  - For a fixed set of seeds per difficulty, `generate()` returns:
    - valid grid shapes (length 81, values 0..9)
    - puzzle solvable
    - **unique solution** (solution-count == 1)
- **Play-state reducer**
  - Digit input updates grid when not given; no-op on givens
  - Notes mode: digit toggles notes; value input clears notes for that cell (decision)
  - Clear removes value and optionally clears notes for that cell (decision)
  - Undo/redo restores prior state for both values and notes
  - Undo/redo stack behavior: redo cleared on new action
  - Serialization invariants (if we add helper serialize/parse)

### `packages/sudoku-mvp-gate` (invariant tests)
Add “gates” to lock Epic 1 MVP expectations:
- difficulty set includes the 5 labels
- generator uniqueness check exists and passes for representative samples
- undo/redo semantics are deterministic for a small scripted sequence

### `apps/sudoku` (manual verification checklist)
- Start Free Play for each difficulty from UI
- Tap select cell; enter digits; clear; notes toggle; add/remove notes
- Undo/redo for both values and notes
- Background the app / switch tabs / reload web → ensure history still present after hydration
- “Start puzzle” latency feels within target

## Implementation steps (sequenced)
1. Expand difficulty model in `sudoku-core` + tests.
2. Add solution-counting capability (limit=2) in solver and enforce uniqueness in generator + tests.
3. Implement pure play-state reducer + tests.
4. Wire `apps/sudoku` store to reducer; extend save payload/hydration (backward compatible).
5. Update Free Play UI:
   - difficulty picker
   - notes toggle + notes rendering
   - undo/redo controls
6. Add/adjust `sudoku-mvp-gate` tests to enforce Epic 1 invariants.
7. Quick performance validation and UX polish.

## Definition of done (Epic 1 complete)
- All US-1..US-3 acceptance criteria are met.
- `pnpm test` passes (including `sudoku-core` + `sudoku-mvp-gate`).
- Manual checklist above passes on web at minimum.


