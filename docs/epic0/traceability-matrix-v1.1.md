# Epic 0 — PRD/spec traceability matrix (Sudoku v1.1 MVP)

Last updated: 2025-12-23

## How to read this
- **Status**:
  - **Meets**: implemented and aligned with PRD/spec.
  - **Partial**: implemented, but missing required behaviors/constraints.
  - **Missing**: not implemented.
- **Evidence**: links to code or tests that prove behavior.
- **Owning epic(s)**: where the requirement belongs per `docs/sudoku-epics-v1.1.md`.

## Platform order + input expectations (PRD 3, 7.2)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Web ships first; keyboard UX non-negotiable | Meets | `apps/sudoku/src/components/SudokuGrid.tsx`, `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx`, `packages/sudoku-mvp-gate/tests/a11y-keyboard.test.ts` | Epic 9, Epic 11 | Keyboard shortcuts + focus ring are implemented on web; Playwright smoke adds runtime validation next. |
| Mobile touch-first baseline input | Meets | `apps/sudoku/app/game/index.tsx`, `apps/sudoku/src/components/NumberPad.tsx`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 1, Epic 9 | Touch select + numpad + notes/undo/redo + clear are supported. |

## Modes (PRD 4.1)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Free Play start by difficulty | Meets | `apps/sudoku/app/game/index.tsx`, `apps/sudoku/src/services/freeplayPacks.ts`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 1 | Difficulty selection UI exists; puzzles sourced via packs service (generator fallback is not required for MVP). |
| Daily (UTC global puzzle) | Meets | `apps/sudoku/src/services/daily.ts`, `apps/sudoku/app/daily/index.tsx`, `packages/sudoku-core/src/engine/dailyUtc.ts`, `packages/sudoku-core/src/engine/dailyValidation.ts` | Epic 2, Epic 8 | Server-published daily via manifest/payload with runtime validation. |
| Daily archive (last 30 days) | Meets | `apps/sudoku/app/daily/index.tsx`, `packages/sudoku-core/src/engine/dailyUtc.ts` | Epic 2, Epic 8 | Archive selector lists the last 30 UTC dates and loads by date key. |

## Offline behavior (PRD 6.3)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Free Play works offline (cached/built-in) | Meets | `apps/sudoku/src/services/freeplayPacks.ts`, `apps/sudoku/src/services/__tests__/freeplayPacks.test.ts` | Epic 8 | Starter packs ship locally; updates are opportunistic and never block play. |
| Daily blocked offline (requires internet) | Meets | `apps/sudoku/src/services/daily.ts`, `apps/sudoku/app/daily/index.tsx` | Epic 2 | PRD policy: Daily requires internet; app shows “Daily unavailable” when offline. |
| If offline at Daily completion, store pending submission and prompt later | Meets | `apps/sudoku/src/services/leaderboard.ts` (enqueue/flush), `apps/sudoku/app/daily/index.tsx` (flush + “Will submit when online”) | Epic 3, Epic 2 | Pending submissions are queued and flushed on resume/foreground. |
| Backlog note: “offline daily loads if cached” | N/A | `docs/sudoku-prd-v1.1-mvp.md` (6.3) | Epic 0 | PRD explicitly blocks offline Daily even if cached; we follow PRD as the source of truth. |

## Gameplay UX (PRD 7.1, 7.3)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Notes mode | Meets | `apps/sudoku/src/state/usePlayerStore.ts`, `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx` | Epic 1 | Notes are per-cell and toggled via UI and keyboard. |
| Undo/redo | Meets | `apps/sudoku/src/state/usePlayerStore.ts`, `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx` | Epic 1 | Undo/redo works for values and notes (per-device UX). |
| Autosave debounced on meaningful changes | Meets | `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx`, `apps/sudoku/src/services/saves.ts` | Epic 5 | Saves include move log + undo/redo stacks + timer state. |
| Autosave on background/tab hidden | Meets | `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx` | Epic 5 | Uses RN `AppState` and web `visibilitychange/pagehide` handlers. |
| Pause stops timer (raw_time excludes paused) | Meets | `packages/sudoku-core/src/engine/runTimer.ts`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 5 | Run timer uses pausedAt/totalPausedMs and is referenced from game/daily screens. |

## UI sizing settings (PRD 7.4)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Grid size setting + 3x3 preview | Meets | `apps/sudoku/app/settings/index.tsx`, `apps/sudoku/src/components/SudokuSizingPreview.tsx`, `apps/sudoku/src/services/settingsModel.ts` | Epic 9 | Live preview updates as sliders change. |
| Primary number font size + preview | Meets | `apps/sudoku/app/settings/index.tsx`, `apps/sudoku/src/components/SudokuSizingPreview.tsx` | Epic 9 | Slider controls the primary number scale. |
| Note font size + preview | Meets | `apps/sudoku/app/settings/index.tsx`, `apps/sudoku/src/components/SudokuSizingPreview.tsx` | Epic 9 | Slider controls the note scale. |

## Scoring + ranked submission rule (PRD 8.1–8.2)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Track raw_time_ms excluding paused time | Meets | `packages/sudoku-core/src/engine/runTimer.ts`, `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx` | Epic 3, Epic 5 | `getRunTimerElapsedMs` excludes paused time. |
| Track mistakes_count per PRD definition | Meets | `apps/sudoku/src/state/usePlayerStore.ts` | Epic 3 | Mistakes increment on wrong placements; changing later does not remove the prior mistake. |
| Track hints_used_count + breakdown | Meets | `apps/sudoku/src/state/usePlayerStore.ts`, `apps/sudoku/app/daily/index.tsx` | Epic 3 | MVP ships “Reveal cell value” hint; breakdown supports the PRD penalty table vocabulary. |
| Compute score_ms via penalty table | Meets | `packages/sudoku-core/src/engine/scoring.ts`, `packages/sudoku-core/tests/runTimer.test.ts`, `packages/sudoku-mvp-gate/tests/scoring.test.ts`, `supabase/functions/submit-score/index.ts` | Epic 3 | Both core and edge compute score from the PRD penalty table. |
| Enforce “first completion per UTC date is ranked” server-side | Meets | `supabase/migrations/0003_daily_runs_idempotency.sql`, `supabase/functions/submit-score/index.ts` | Epic 3 | Partial unique index + conflict fallback ensure race-safe ranked-first enforcement. |
| Submit via Edge Function; client untrusted | Meets | `apps/sudoku/src/services/leaderboard.ts`, `supabase/functions/submit-score/index.ts`, `supabase/functions/_shared/http.ts` | Epic 3 | Client submits bearer token; edge uses service role to write and returns stable envelopes. |

## Leaderboards (PRD 8.3–8.4)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Daily-only leaderboards | Meets | `supabase/migrations/0002_daily_runs.sql`, `supabase/migrations/0004_daily_runs_display_name_and_leaderboard_views.sql` | Epic 4 | Leaderboards are derived from `daily_runs` ranked submissions. |
| Two tabs: Score and Raw Time | Meets | `apps/sudoku/app/leaderboard/index.tsx` | Epic 4 | UI provides both tabs and calls the corresponding views. |
| Row transparency fields | Meets | `apps/sudoku/app/leaderboard/index.tsx`, `supabase/migrations/0004_daily_runs_display_name_and_leaderboard_views.sql` | Epic 4 | Rows show score, raw time, mistakes, hints. |
| Top 100 + Around You | Meets | `apps/sudoku/app/leaderboard/index.tsx`, `apps/sudoku/src/services/leaderboard.ts` | Epic 4 | Top 100 is public; Around You requires auth and uses player lookup. |

## Accounts & identity (PRD 9)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Guest play | Meets | `apps/sudoku/app/auth/index.tsx`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 7 | Guests can play with local-only persistence and telemetry (best-effort). |
| Supabase auth (Google/Apple) | Meets | `apps/sudoku/app/auth/index.tsx`, `apps/sudoku/src/services/auth.ts`, `packages/game-foundation/src/auth/*` | Epic 7 | Requires correct provider setup in the Supabase project (runtime configuration). |
| Guest-to-account conversion preserving saves/stats/settings | Partial | `apps/sudoku/src/services/settings.ts`, `apps/sudoku/src/services/stats.ts`, `apps/sudoku/src/services/sync.ts` | Epic 7 | Sync paths exist for signed-in users; explicit “convert guest” UX and migration flow still needs validation/coverage. |

## Saves & cross-device sync (PRD 10)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Local-first saves | Meets | `apps/sudoku/src/services/saves.ts`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 5 | Saves include move log + timer + undo/redo stacks and resume routing. |
| Move log representation | Meets | `packages/sudoku-core/src/engine/moveLog.ts`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 6 | Moves are schema-versioned and keyed by (device_id, rev). |
| Merge algorithm | Meets | `packages/sudoku-core/src/engine/moveLog.ts`, `apps/sudoku/src/services/sync.ts`, `supabase/functions/upsert-save/index.ts` | Epic 6 | Merge is deterministic by ts/device_id/rev; last-write-wins for values. |
| Sync triggers | Meets | `apps/sudoku/app/game/index.tsx`, `apps/sudoku/app/daily/index.tsx` | Epic 6, Epic 5 | Debounced pushes + lifecycle pulls; cloud writes via edge `upsert-save`. |

## Backend trusted writes & RLS (Tech spec 1, 5, 6)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Edge Functions validate inputs and stable error shapes | Meets | `supabase/functions/_shared/http.ts`, `supabase/functions/submit-score/index.ts`, `supabase/functions/upsert-save/index.ts`, `packages/sudoku-mvp-gate/tests/edge-function-contract.test.ts` | Epic 0, Epic 3, Epic 6 | Functions include CORS/OPTIONS, requestId envelopes, timeouts, and stable error codes. |
| Leaderboard writes blocked for clients (RLS) | Meets | `supabase/migrations/0001_init.sql` (no insert/update policies on `leaderboard_scores`) | Epic 0 | Table model doesn’t match PRD Daily, but RLS pattern exists. |

## Analytics (PRD 12)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Track MVP events | Partial | `apps/sudoku/src/services/telemetry.ts`, `apps/sudoku/app/*/index.tsx`, `supabase/functions/track-event/index.ts` | Epic 10 | Core events exist (start, complete, hint, sign-in success, leaderboard_view). Remaining events/coverage are validated next with Playwright + explicit “app_open” and “convert_guest_to_account” decisions. |



