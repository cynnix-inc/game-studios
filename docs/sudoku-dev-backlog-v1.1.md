# Sudoku v1.1 MVP Dev Backlog and Acceptance Criteria
Last updated: 2025-12-20

This backlog is ordered for Web first, then Android, then iOS.

## Epic 1: Core Sudoku play loop
### US-1 Start a Free Play puzzle
Acceptance:
- User can select difficulty (Novice..Ultimate) and start a new puzzle within 3 seconds
- Puzzle has a single unique solution and is valid Sudoku

### US-2 Input values and notes
Acceptance:
- Tap selects a cell
- Numpad sets value 1-9
- Notes mode toggle works
- Notes display per cell
- Clear removes value
- Undo and redo exist (see US-3)

### US-3 Undo and redo
Acceptance:
- Undo reverts last action (value or note)
- Redo restores undone action
- History persists across pause/resume for in-progress puzzles

## Epic 2: Daily mode (UTC, server-published)
### US-4 Load today's Daily
Acceptance:
- Daily puzzle is the same for all users worldwide for a given UTC date
- Countdown indicates next UTC day rollover
- If offline and daily cached, it loads

### US-5 Ranked first attempt and replays
Acceptance:
- First completed attempt on a UTC date is marked ranked
- Later completions are marked replay and do not change leaderboard ranking
- Player can replay the same daily after completing it
- Player can view ranked result and personal best separately

### US-6 Daily archive (30 days)
Acceptance:
- Player can access last 30 days
- Archived day loads correct puzzle for that date
- Leaderboard for that day is viewable

## Epic 3: Scoring and leaderboards
### US-7 Compute score with penalties
Acceptance:
- Score uses raw time plus penalties table:
  - mistakes: +30s each
  - explain: +30s
  - show candidates: +45s
  - next move highlight: +60s
  - check cell: +30s
  - check board: +90s
  - reveal value: +120s
- Timer does not count paused time

### US-8 Leaderboard UI with two tabs
Acceptance:
- Score tab sorted by score_ms
- Raw Time tab sorted by raw_time_ms
- Each row shows: score, raw time, mistakes, hints
- Top list loads within 2 seconds on broadband

## Epic 4: Saves and cross-device sync
### US-9 Local autosave
Acceptance:
- In-progress puzzle state saved locally
- Resume restores state after reload/crash

### US-10 Signed-in sync with move log merge
Acceptance:
- Signed-in player can continue on another device
- Concurrent edits merge deterministically
- Latest board state resolves the same on all devices

### US-11 Guest to account conversion
Acceptance:
- Guest can sign in later
- Local saves, stats, and settings migrate into the account

## Epic 5: Settings and UX polish
### US-12 Grid and font sizing with preview
Acceptance:
- User can change grid size, number font size, note font size
- Each has a 3x3 preview that updates live
- Settings persist

### US-13 Pause behavior
Acceptance:
- Pausing hides board
- Backgrounding/tab hidden auto-pauses and hides board
- Timer stops during pause

## Epic 6: Puzzle distribution and caching
### US-14 Puzzle pack manifest update
Acceptance:
- App checks manifest without blocking play
- Downloads updates when available
- Uses cached packs if offline

### US-15 Daily caching
Acceptance:
- App caches today plus last 30 daily payloads when available
- Evicts older dailies beyond 30 days

## Epic 7: Auth
### US-16 Sign in with Google
Acceptance:
- Web and mobile sign-in flow works
- Session persisted
- Errors handled cleanly

### US-17 Sign in with Apple
Acceptance:
- iOS sign-in works
- Web uses Supabase OAuth redirect if supported
- Session persisted

## Milestones
### M1 Web MVP
- Epics 1, 2, 3, 5, 6 (basic), 7
### M2 Android
- M1 plus Android packaging and store readiness
### M3 iOS TestFlight
- M1 plus iOS packaging and TestFlight distribution
