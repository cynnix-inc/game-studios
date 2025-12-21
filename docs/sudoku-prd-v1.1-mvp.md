# Sudoku v1.1 MVP PRD (Cynnix Studios)
Last updated: 2025-12-20

## 0. Executive summary
Sudoku v1.1 is a cross-platform Sudoku product shipping in this order:
1. Web (first)
2. Android (Play Store)
3. iOS (TestFlight until production ready)

v1.1 MVP ships two modes:
- Free Play
- Daily (global UTC, same puzzle for everyone)

Core differentiators for MVP:
- Fast, clean play experience (mobile-first, web supports keyboard)
- Trustworthy Daily with a fair scoring system
- Cross-device sync (move log merge) for signed-in users
- Clear, configurable UI sizing for grid and numbers

Monetization is out of scope for MVP, but the data model and UX must not block future monetization.

## 1. Goals
- Ship a playable MVP with excellent feel (input speed, clarity, low friction)
- Make Daily meaningful and fair, globally consistent
- Support guest play (local-only) and signed-in play (cloud sync plus leaderboards)
- Maintain puzzle quality: unique solution, difficulty grading standards, deterministic dailies

## 2. Non-goals (MVP)
- Additional variants (Killer, etc.)
- Social graph (friends)
- Paid features / IAP
- Push notifications
- Anti-cheat beyond basic integrity checks and server-side score writes

## 3. Target platforms and support policy
### Platforms
- Web: modern evergreen browsers on desktop and mobile
- Android: Play Store release (phone first; tablets acceptable if responsive)
- iOS: TestFlight until ready; then App Store

### Input expectations
- Mobile: touch-first with on-screen numpad
- Desktop web: keyboard-first (numpad optional UI)

## 4. Product scope
### 4.1 Modes included (MVP)
#### A) Free Play
- User chooses difficulty (Easy, Medium, Hard, Expert, Extreme)
- Starts a new puzzle
- Can pause, resume, and autosave
- Stats tracked locally (guest) or in cloud (signed-in)

#### B) Daily (UTC)
- One globally shared puzzle per UTC date
- Same puzzle for everyone worldwide
- Archive: last 30 days available
- First attempt per day is the only ranked submission (see scoring rules below)
- Replays are allowed after the first completion, but they are personal-only and never affect the leaderboard

### 4.2 Difficulty system (MVP)
- Free Play difficulties: Easy, Medium, Hard, Expert, Extreme
- Daily difficulty: can vary by day (defined in Daily payload metadata), but rule set stays consistent

## 5. Core game rules (classic Sudoku)
- Standard 9x9 Sudoku
- Digits 1-9
- Each row, column, and 3x3 box must contain 1-9 exactly once

## 6. Puzzle sourcing and distribution
### 6.1 Daily puzzles (server-published)
Daily puzzles are fetched from the backend and cached locally.

Daily payload must include:
- utc_date (YYYY-MM-DD)
- puzzle_id (stable)
- givens grid
- difficulty label and numeric rating
- checksum and version metadata

Notes:
- Whether the client receives the solution grid is a security and UX tradeoff. For MVP, allow client-side validation for fast feedback, but compute leaderboard score server-side and treat client data as untrusted.

Rationale:
- Guarantees global consistency across platforms
- Avoids algorithm drift where web and mobile generate different dailies
- Enables controlled difficulty scheduling

### 6.2 Free Play puzzles (hybrid)
MVP supports:
- A small built-in starter pack per difficulty (ships in the app)
- Downloadable puzzle packs per difficulty (periodic updates)
- Optional local generator fallback (future). For MVP, prefer packs for consistency and grading.

### 6.3 Offline behavior
- If offline, user can still play:
  - Free Play using cached/built-in packs
  - Daily only if already cached for that day (and archive cached)
- Submitting ranked Daily results requires online connectivity at submission time
- If offline at completion, store a pending submission and prompt to submit when back online

## 7. Gameplay UX and input (MVP)
### 7.1 Mobile baseline
- Tap to select a cell
- Numpad 1-9 plus erase
- Notes mode toggle
- Undo/redo
- Clear cell (and clear notes for that cell)

### 7.2 Web keyboard requirements (desktop)
Minimum shortcuts:
- 1-9: set value (or note value if notes mode)
- Backspace/Delete: clear cell
- Arrow keys: move selection
- N: toggle notes mode
- U: undo
- R: redo
- Esc: unselect / close modal

On mobile web, UI should behave like mobile native.

### 7.3 Autosave and resume
- Autosave on meaningful changes (debounced)
- Autosave on background/tab hidden
- Resume returns the player to the last in-progress puzzle

### 7.4 UI sizing (required)
Settings must allow resizing:
1. Grid size
2. Primary number font size
3. Note font size

Each setting includes a 3x3 preview.

## 8. Daily scoring, ranking, and leaderboards
### 8.1 Ranked attempt rule
- The first completed attempt of the UTC day is the only ranked submission
- After completion, the player may replay the same puzzle to improve personal best
- Personal best shown separately from ranked submission

### 8.2 Scoring model
We compute:
- raw_time_ms: elapsed play time excluding paused time
- mistakes_count: number of incorrect placements (see definition below)
- hints_used_count and hint breakdown
- score_ms: ranked score used for the main leaderboard

Score formula:
score_ms = raw_time_ms
         + (mistakes_count * 30_000)
         + hint_penalty_ms

Mistake penalty:
- +30 seconds per mistake

Hint penalties (added to score_ms):
- Explain technique: +30 seconds
- Show candidates for selected cell: +45 seconds
- Highlight next logical move: +60 seconds
- Check selected cell: +30 seconds
- Check whole board: +90 seconds
- Reveal cell value: +120 seconds

Definition: mistake
- Any placement that is not equal to the solution for that cell at the time it is placed counts as a mistake.
- If a player places the wrong value, then later changes it, the mistake still counts once.

### 8.3 Leaderboard tabs (MVP)
Daily leaderboard has two tabs:
1. Score (primary): sorted by score_ms ascending
2. Raw Time (secondary): sorted by raw_time_ms ascending

For transparency, each row should show:
- score_ms
- raw_time_ms
- mistakes_count
- hints_used_count (and optionally hint types)

Raw Time tab is informational. Score is the fair competitive metric.

### 8.4 Leaderboard scope (MVP)
- Daily leaderboards only (today and archived days)
- Show Top 100 plus an "Around You" slice when signed in
- No friends leaderboard (non-goal)

## 9. Accounts and identity (MVP)
### 9.1 Guest play
- Guests can play Free Play and Daily locally
- Guests have local stats and local saves only
- Guest can later convert to an account and keep:
  - saves
  - stats
  - settings

### 9.2 Signed-in play
- Supabase auth
- Google sign-in
- Apple sign-in
- Cloud sync (saves and stats)
- Leaderboard submissions

## 10. Saves and cross-device sync
MVP supports cross-device sync using a move-log merge model.

### 10.1 Data model concept
For each in-progress puzzle, store:
- puzzle reference (daily date or free-play puzzle id)
- move log: ordered list of moves (cell, value, mode, timestamp, source device id, revision)
- derived state snapshot (optional cache)

### 10.2 Merge rules
- Merge by (revision, timestamp) with stable tiebreaker (device id)
- If two moves target the same cell:
  - the later move wins for current value
  - both moves remain in history for undo and audit (nice to have for MVP)

### 10.3 Conflict UX
- No conflict dialogs for MVP
- The board always resolves to the merged latest state
- Show a subtle sync indicator and last sync time (settings or pause menu)

## 11. Performance targets (MVP)
- Grid input latency: less than 50ms perceived response (web and mobile)
- Start new puzzle: less than 1s for cached puzzles, less than 3s with download in progress (show loading)
- App should feel instant on modern midrange phones and mainstream laptops

## 12. Analytics (MVP)
Track platform separately (web, android, ios).

Key events:
- app_open
- start_freeplay (difficulty)
- start_daily (utc_date)
- complete_puzzle (mode, difficulty, raw_time_ms, mistakes_count, hints_used_count, score_ms, ranked=true/false)
- abandon_puzzle (mode, reason)
- hint_used (type)
- sign_in_success (provider)
- convert_guest_to_account
- leaderboard_view (tab)

Success metrics (MVP):
- activation: start a puzzle within 60 seconds of first open
- completion rate: started vs completed (daily and free play)
- daily return: plays daily again within 48 hours
- retention: D1 and D7 by platform
- percent of Daily completions that are ranked submissions vs replays

## 13. Rollout plan
### Phase 1: Web MVP
- Free Play plus Daily
- Guest supported
- Auth required for leaderboard submission (recommended)
- Daily leaderboard with two tabs
- Puzzle pack caching
- Core settings (grid and font sizing)

### Phase 2: Android
- Same feature set
- Play Store release
- Validate performance and touch behavior

### Phase 3: iOS (TestFlight)
- Same feature set
- TestFlight distribution until ready for public launch
