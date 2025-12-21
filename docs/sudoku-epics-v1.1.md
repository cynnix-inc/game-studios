# Sudoku v1.1 MVP — Epics (High-Level)

Last updated: 2025-12-20

## Purpose
Break down the Sudoku v1.1 MVP requirements into manageable epics. Each epic should deliver a specific feature or functionality. We will do a deeper WBD (work breakdown) per epic later.

This doc is derived primarily from:
- `docs/sudoku-prd-v1.1-mvp.md`
- `docs/sudoku-tech-spec-v1.1.md`
- `docs/sudoku-dev-backlog-v1.1.md`
- `docs/sudoku-one-page-brief-v1.1.md`
- `docs/ARCHITECTURE.md`
- `docs/PACKAGES.md`

## Guiding principles (from PRD/brief/spec)
- Web ships first; keyboard UX is non-negotiable.
- Daily is keyed to UTC and globally identical for that date.
- First completed Daily attempt is the only ranked submission; replays never affect leaderboard ranking.
- Leaderboards are Daily-only for MVP, with two tabs (Score primary, Raw Time secondary).
- Signed-in users get cross-device sync (move-log merge); guests work offline locally and can later convert.
- Trusted writes: leaderboard submissions happen server-side (Edge Functions); client is untrusted.

Primary references:
- PRD: `docs/sudoku-prd-v1.1-mvp.md` sections 0, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13
- One-page brief: `docs/sudoku-one-page-brief-v1.1.md` (Non-negotiables)
- Tech spec: `docs/sudoku-tech-spec-v1.1.md` sections 1–8

---

## Epic 0 — MVP requirements validation (scaffolding + gaps)
**Delivers:** A validated “meets/doesn’t meet” checklist against MVP requirements, plus a prioritized gap list with ownership and sequencing (Web first).

**Why:** Tech scaffolding *should* be done, but we must validate the implementation truly satisfies the PRD/spec requirements (especially Daily invariants, trusted writes, offline behavior, and keyboard UX).

**Scope (high-level):**
- Validate feature completeness vs PRD “musts” (platform order, modes, UX, scoring, leaderboards, saves, sync, auth).
- Validate architectural constraints: no secret leakage to clients; server-side enforcement for ranked submissions and scoring.
- Validate offline behavior and caching invariants.
- Produce a “known-unknowns” list (requirements that need WBD decisions).

**Primary references:**
- PRD: full document (requirements baseline)
- Tech spec: full document (intended backend + caching model)
- Architecture reality: `docs/ARCHITECTURE.md` (Saves/Auth/Leaderboards notes)
- Package boundaries: `docs/PACKAGES.md` (cloud sync placeholders, client env rules)

**Suggested output artifacts:**
- Traceability matrix (PRD section → epic(s) → status)
- MVP gap list (P0/P1/P2) aligned to PRD rollout (Web MVP → Android → iOS TestFlight)

---

## Epic 1 — Core Sudoku play loop (Free Play)
**Delivers:** A fast, clean classic Sudoku experience for Free Play.

**Scope (high-level):**
- Start a Free Play puzzle by difficulty (Easy, Medium, Hard, Expert, Extreme).
- Core interactions: select cell, enter 1–9, clear/erase.
- Notes mode: add/remove notes; notes displayed per cell.
- Undo/redo with history persisting across pause/resume for in-progress puzzles.
- Performance feel: input latency and “start puzzle” targets.

**Primary references:**
- PRD: 4.1A (Free Play), 5 (Core rules), 7 (Gameplay UX & input), 11 (Performance targets)
- Dev backlog: Epic 1 (US-1..US-3)
- Architecture/packages: `docs/ARCHITECTURE.md` (App state; engine), `docs/PACKAGES.md` (`@cynnix-studios/sudoku-core`)

---

## Epic 2 — Daily mode (UTC global puzzle + 30-day archive)
**Delivers:** Daily puzzle experience that is globally consistent by UTC date, including a 30-day archive.

**Scope (high-level):**
- Load today’s Daily (UTC-keyed; globally identical).
- Show next UTC rollover countdown (or equivalent UX).
- Access last 30 days (archive) and load the correct puzzle per date.
- Offline behavior for Daily: playable only if the payload is already cached.

**Primary references:**
- PRD: 4.1B (Daily), 6.1 (server-published Daily), 6.3 (Offline behavior)
- Tech spec: 2.1 (Daily manifest/payload layout + caching)
- Dev backlog: Epic 2 (US-4..US-6)
- One-page brief: Non-negotiables + Puzzle sourcing

---

## Epic 3 — Scoring, ranked-first-attempt enforcement, and trusted submission
**Delivers:** Fair Daily scoring and ranked submission rules enforced server-side.

**Scope (high-level):**
- Track run metrics:
  - raw_time_ms excluding paused time (PRD definition)
  - mistakes_count (PRD definition)
  - hints_used_count and hint breakdown (PRD penalty table)
- Compute score_ms using the PRD penalty table.
- Enforce “first completion per UTC date is ranked; later completions are replays” (server-side).
- Submit results via Edge Function (trusted write; client is untrusted).
- Handle “offline at completion” by storing a pending submission and prompting to submit when back online.

**Primary references:**
- PRD: 8.1 (Ranked attempt rule), 8.2 (Scoring model + penalties + mistake definition), 6.3 (pending submission)
- Tech spec: 3.1–3.2 (fields + first attempt enforcement), 6.1 (Edge Function `submit-score`)
- One-page brief: Daily scoring + Non-negotiables
- Dev backlog: Epic 3 (US-7) and Epic 2 (US-5)

---

## Epic 4 — Daily leaderboards (two tabs, Top 100 + Around You)
**Delivers:** Daily leaderboard UI/UX with required tabs and transparency fields.

**Scope (high-level):**
- Daily leaderboard for “today” and archived days.
- Two tabs:
  - Score (primary): score_ms ascending
  - Raw Time (secondary): raw_time_ms ascending
- Row transparency fields: score_ms, raw_time_ms, mistakes_count, hints_used_count (and optionally types).
- Top 100 plus “Around You” slice for signed-in players.

**Primary references:**
- PRD: 8.3 (Tabs + row fields), 8.4 (Leaderboard scope)
- Tech spec: 3.3 (Tabs), 6.1 (`submit-score` returns rank and nearby slice)
- One-page brief: Leaderboards (MVP)
- Dev backlog: Epic 3 (US-8)

---

## Epic 5 — Saves, autosave, pause, and resume (local-first)
**Delivers:** Reliable local persistence for in-progress play and correct pause behavior (including lifecycle auto-pause).

**Scope (high-level):**
- Autosave on meaningful changes (debounced).
- Autosave on background/tab hidden.
- Resume returns player to last in-progress puzzle after reload/crash.
- Pause hides board and stops timer (raw_time excludes paused time).

**Primary references:**
- PRD: 7.3 (Autosave/resume), 7.1 (Mobile baseline), 11 (Performance targets)
- Dev backlog: Epic 4 (US-9), Epic 5 (US-13)
- Tech spec: 4.3 (Sync triggers—pattern aligns with autosave triggers)

---

## Epic 6 — Cross-device sync via move-log merge (signed-in)
**Delivers:** Deterministic cross-device continuation for signed-in users via move-log merge (no conflict dialogs).

**Scope (high-level):**
- Move-log representation for each puzzle:
  - puzzle_key conventions (daily vs free play)
  - per-device revision and timestamps
  - “fold” reducer to current state
- Merge rules (union moves; deterministic ordering; last-write-wins for cell values; notes merge as sets).
- Sync triggers during play and on lifecycle events.
- Minimal conflict UX: no dialogs; subtle sync indicator / last sync time surface.

**Primary references:**
- PRD: 10.1–10.3 (Data model concept; merge rules; conflict UX)
- Tech spec: 4.1–4.3 (Save object; merge algorithm; triggers), 6.2 (Edge Function `upsert-save`)
- One-page brief: Saves and sync (MVP)
- Dev backlog: Epic 4 (US-10)

---

## Epic 7 — Accounts & identity (guest, sign-in, conversion)
**Delivers:** Guest play + sign-in flows + guest-to-account conversion retaining saves/stats/settings.

**Scope (high-level):**
- Guest play (local-only saves/stats/settings).
- Signed-in play via Supabase auth:
  - Google sign-in
  - Apple sign-in
- Guest-to-account conversion:
  - migrate saves, stats, and settings into the account
  - preserve continuity across devices after conversion

**Primary references:**
- PRD: 9.1–9.2 (Guest vs signed-in expectations)
- Tech spec: 1 (Supabase overview), 6 (Edge Functions verify auth)
- Dev backlog: Epic 7 (US-16..US-17) and Epic 4 (US-11)
- Architecture: `docs/ARCHITECTURE.md` (Auth notes)

---

## Epic 8 — Puzzle distribution & caching (Daily + Free Play packs)
**Delivers:** Consistent puzzle sourcing with offline-friendly caching and non-blocking updates.

**Scope (high-level):**
- Daily distribution:
  - manifest/payload download strategy (ETag/cache)
  - local caching and 30-day retention/eviction
  - checksum/version mismatch handling
- Free Play packs:
  - built-in starter packs ship in app bundle (instant play)
  - downloadable packs updated via manifest/versioning
  - never block play on downloads; fall back to cached/old packs

**Primary references:**
- PRD: 6.1 (Daily payload requirements), 6.2 (Free Play packs), 6.3 (Offline behavior)
- Tech spec: 2.1 (Daily manifest/payload; caching), 2.2 (Free Play pack format; update strategy)
- Dev backlog: Epic 6 (US-14..US-15)
- One-page brief: Puzzle sourcing + Offline

---

## Epic 9 — Settings & required UX polish (sizing + web keyboard)
**Delivers:** The required settings and platform UX expectations (especially keyboard on web).

**Scope (high-level):**
- UI sizing settings (required):
  - grid size
  - primary number font size
  - note font size
  - each with a 3x3 preview that updates live
- Web keyboard shortcuts (minimum set per PRD/brief):
  - 1–9, Backspace/Delete, Arrow keys, N, U, R, Esc
- Mobile/touch-first behavior (including mobile web parity).

**Primary references:**
- PRD: 7.2 (Web keyboard requirements), 7.4 (UI sizing), 3 (platform expectations)
- One-page brief: Web UX requirements + Non-negotiables
- Dev backlog: Epic 5 (US-12)
- Tech spec: 8 (Web first: keyboard UX is non-negotiable)

---

## Epic 10 — Analytics (MVP telemetry)
**Delivers:** Key events captured to measure MVP success metrics by platform.

**Scope (high-level):**
- Track events listed in PRD:
  - app_open
  - start_freeplay / start_daily
  - complete_puzzle
  - abandon_puzzle
  - hint_used
  - sign_in_success
  - convert_guest_to_account
  - leaderboard_view

**Primary references:**
- PRD: 12 (Analytics events + success metrics)
- Architecture/packages: `docs/PACKAGES.md` (`@cynnix-studios/game-foundation` telemetry hooks)

---

## Epic 11 — Release readiness by platform (Web → Android → iOS TestFlight)
**Delivers:** Packaging/export and rollout readiness aligned to the PRD platform order.

**Scope (high-level):**
- Web export + Netlify SPA behavior for release (publish dist; redirects).
- Android packaging and store readiness checks.
- iOS TestFlight readiness checks.
- Platform-specific validation: input latency, touch behavior, performance targets.

**Primary references:**
- PRD: 3 (Platforms), 11 (Performance targets), 13 (Rollout plan)
- Tech spec: 7 (Web build + Netlify), 8 (Platform rollout notes)
- Dev backlog: Milestones (M1/M2/M3)

---

## PRD/spec traceability (high-level)
This section maps requirements sections to the epic(s) responsible for delivering them.

### PRD: `docs/sudoku-prd-v1.1-mvp.md`
- **0 Executive summary**
  - Epic 0 (validation)
  - Epics 1–11 (implementation scope)
- **1 Goals**
  - Epic 1 (excellent feel), Epic 2 (Daily meaning), Epic 6 (sync), Epic 8 (puzzle quality distribution patterns), Epic 10 (metrics)
- **2 Non-goals**
  - Epic 0 (validation: ensure out-of-scope items don’t creep in)
- **3 Platforms and support policy**
  - Epic 9 (input expectations), Epic 11 (platform rollout readiness), Epic 0 (validate web-first)
- **4 Product scope**
  - 4.1 Modes:
    - Free Play → Epic 1
    - Daily + archive → Epic 2
  - 4.2 Difficulty system:
    - Free Play difficulties → Epic 1
    - Daily difficulty metadata → Epic 2 + Epic 8
- **5 Core game rules**
  - Epic 1 (rules-compliant play loop, validation)
- **6 Puzzle sourcing and distribution**
  - 6.1 Daily puzzles → Epic 2 + Epic 8
  - 6.2 Free Play puzzles → Epic 8
  - 6.3 Offline behavior + pending submission → Epic 2 + Epic 3 + Epic 8
- **7 Gameplay UX and input**
  - 7.1 Mobile baseline → Epic 1 + Epic 9
  - 7.2 Web keyboard requirements → Epic 9 (+ Epic 11 validation)
  - 7.3 Autosave and resume → Epic 5
  - 7.4 UI sizing → Epic 9
- **8 Daily scoring, ranking, and leaderboards**
  - 8.1 Ranked attempt rule → Epic 3
  - 8.2 Scoring model → Epic 3
  - 8.3 Leaderboard tabs → Epic 4
  - 8.4 Leaderboard scope → Epic 4
- **9 Accounts and identity**
  - 9.1 Guest play → Epic 7 + Epic 5
  - 9.2 Signed-in play → Epic 7 + Epic 6 + Epic 3/4 (submission/leaderboards)
- **10 Saves and cross-device sync**
  - 10.1–10.3 Move log + merge + conflict UX → Epic 6 (and Epic 5 for local-first behavior)
- **11 Performance targets**
  - Epic 1 (input latency), Epic 8 (puzzle load), Epic 11 (platform validation)
- **12 Analytics**
  - Epic 10
- **13 Rollout plan**
  - Epic 11 (platform rollout), Epic 0 (validation gates)

### Tech spec: `docs/sudoku-tech-spec-v1.1.md`
- **1 System overview (trusted writes)**
  - Epic 3 (submit-score), Epic 6 (upsert-save), Epic 0 (security validation)
- **2 Puzzle distribution**
  - Epic 2 + Epic 8
- **3 Leaderboards and scoring**
  - Epic 3 + Epic 4
- **4 Saves and move log merge**
  - Epic 6 (+ Epic 5 for local autosave parallels)
- **5 Supabase schema**
  - Epic 0 (schema/RLS validation), Epic 3/4/6 (data needs)
- **6 Edge Functions**
  - Epic 3 (`submit-score`), Epic 6 (`upsert-save`)
- **7 Web build and Netlify**
  - Epic 11
- **8 Platform rollout notes**
  - Epic 11 (validation focus: keyboard + latency)

### Dev backlog: `docs/sudoku-dev-backlog-v1.1.md`
- Epic 1 (US-1..US-3) → Epic 1 (Core play loop)
- Epic 2 (US-4..US-6) → Epic 2 (Daily mode)
- Epic 3 (US-7..US-8) → Epic 3 (Scoring/submission) + Epic 4 (Leaderboards)
- Epic 4 (US-9..US-11) → Epic 5 (Local saves) + Epic 6 (Sync) + Epic 7 (Conversion)
- Epic 5 (US-12..US-13) → Epic 9 (Settings/UX polish) + Epic 5 (Pause/resume behavior)
- Epic 6 (US-14..US-15) → Epic 8 (Distribution/caching)
- Epic 7 (US-16..US-17) → Epic 7 (Auth)

---

## Notes / WBD flags (to clarify later)
- **Hint UX scope**: PRD/brief defines penalty types (PRD 8.2) but does not fully specify hint UX/availability. WBD should explicitly define which hint types ship in MVP and how they are triggered.
- **Daily offline completion**: PRD requires storing a pending ranked submission when offline and prompting to submit once online (PRD 6.3). Ensure WBD covers exact UX + retry rules.



