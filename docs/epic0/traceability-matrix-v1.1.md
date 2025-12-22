# Epic 0 — PRD/spec traceability matrix (Sudoku v1.1 MVP)

Last updated: 2025-12-21

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
| Web ships first; keyboard UX non-negotiable | Missing | N/A | Epic 9, Epic 11 | Game screen is RN Pressable/numpad only. |
| Mobile touch-first baseline input | Partial | `apps/sudoku/app/game/index.tsx` | Epic 1, Epic 9 | Touch selection + numpad exists; missing notes/undo/pause. |

## Modes (PRD 4.1)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Free Play start by difficulty | Partial | `packages/sudoku-core/src/engine/generator.ts`, `apps/sudoku/src/state/usePlayerStore.ts` | Epic 1 | UI does not expose difficulty selection; generator exists. |
| Daily (UTC global puzzle) | Missing | N/A | Epic 2, Epic 8 | No daily distribution/caching in app. |
| Daily archive (last 30 days) | Missing | N/A | Epic 2, Epic 8 | No daily archive. |

## Offline behavior (PRD 6.3)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Free Play works offline (cached/built-in) | Partial | `packages/sudoku-core` generator | Epic 8 | Uses generator, not packs/caching model from spec. |
| Daily blocked offline (requires internet) | Meets | `apps/sudoku/src/services/daily.ts` | Epic 2 | `loadDailyByDateKey` returns unavailable when fetch fails/offline; no cached fallback. |
| If offline at Daily completion, store pending submission and prompt later | Missing | N/A | Epic 3, Epic 2 | Requires local queue + online detection. |

## Gameplay UX (PRD 7.1, 7.3)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Notes mode | Missing | N/A | Epic 1 | Not implemented. |
| Undo/redo | Missing | N/A | Epic 1 | Not implemented. |
| Autosave debounced on meaningful changes | Partial | `apps/sudoku/app/game/index.tsx` (debounce + writeLocalSave) | Epic 5 | Saves puzzle/mistakes/start time; no pause/redo history. |
| Autosave on background/tab hidden | Partial | `apps/sudoku/app/game/index.tsx` (AppState listener) | Epic 5 | Web tab hidden handling not explicit; RN AppState covers some platforms. |
| Pause stops timer (raw_time excludes paused) | Missing | N/A | Epic 5 | Timer is `Date.now()-startedAtMs` with no pause. |

## UI sizing settings (PRD 7.4)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Grid size setting + 3x3 preview | Missing | N/A | Epic 9 | Not implemented. |
| Primary number font size + preview | Missing | N/A | Epic 9 | Not implemented. |
| Note font size + preview | Missing | N/A | Epic 9 | Not implemented. |

## Scoring + ranked submission rule (PRD 8.1–8.2)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Track raw_time_ms excluding paused time | Missing | N/A | Epic 3, Epic 5 | No pause-aware timer. |
| Track mistakes_count per PRD definition | Partial | `apps/sudoku/src/state/usePlayerStore.ts` increments mistakes on incorrect entry | Epic 3 | Not keyed to Daily, and mistake definition vs “solution at time placed” is consistent but lacks hint interactions. |
| Track hints_used_count + breakdown | Missing | N/A | Epic 3 | No hints system. |
| Compute score_ms via penalty table | Missing | N/A | Epic 3 | No scoring model implemented. |
| Enforce “first completion per UTC date is ranked” server-side | Missing | N/A | Epic 3 | Edge function is placeholder. |
| Submit via Edge Function; client untrusted | Partial | `apps/sudoku/src/services/leaderboard.ts`, `supabase/functions/submit-score/index.ts` | Epic 3 | Client calls function with bearer token, but function is stub and schema not PRD-aligned. |

## Leaderboards (PRD 8.3–8.4)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Daily-only leaderboards | Missing | N/A | Epic 4 | Current `leaderboard_scores` is game-wide modes `time_ms/mistakes`. |
| Two tabs: Score and Raw Time | Missing | N/A | Epic 4 | Not implemented. |
| Row transparency fields | Missing | N/A | Epic 4 | Not implemented. |
| Top 100 + Around You | Missing | N/A | Epic 4 | Not implemented. |

## Accounts & identity (PRD 9)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Guest play | Partial | `apps/sudoku/src/state/usePlayerStore.ts` (`continueAsGuest`) | Epic 7 | No conversion; app’s auth UX exists but not validated end-to-end. |
| Supabase auth (Google/Apple) | Partial | `apps/sudoku/src/services/auth.ts`, `packages/game-foundation/src/auth/*` | Epic 7 | Depends on env/provider configuration. |
| Guest-to-account conversion preserving saves/stats/settings | Missing | N/A | Epic 7 | Not implemented. |

## Saves & cross-device sync (PRD 10)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Local-first saves | Partial | `packages/game-foundation/src/saves/saveService.ts`, `apps/sudoku/src/services/saves.ts` | Epic 5 | Save object is snapshot-only; no move log merge. |
| Move log representation | Missing | N/A | Epic 6 | Not implemented. |
| Merge algorithm | Missing | N/A | Epic 6 | Not implemented. |
| Sync triggers | Partial | local triggers exist | Epic 6, Epic 5 | Cloud sync placeholders only. |

## Backend trusted writes & RLS (Tech spec 1, 5, 6)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Edge Functions validate inputs and stable error shapes | Partial | `supabase/functions/*` | Epic 0, Epic 3, Epic 6 | Current functions validate minimally but have unstable shapes and no auth mapping. |
| Leaderboard writes blocked for clients (RLS) | Meets | `supabase/migrations/0001_init.sql` (no insert/update policies on `leaderboard_scores`) | Epic 0 | Table model doesn’t match PRD Daily, but RLS pattern exists. |

## Analytics (PRD 12)
| Requirement | Status | Evidence | Owning epic(s) | Notes |
|---|---:|---|---|---|
| Track MVP events | Missing | N/A | Epic 10 | Telemetry hooks exist but app not emitting events. |



