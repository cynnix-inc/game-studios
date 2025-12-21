# Sudoku v1.1 MVP One-Page Brief (Cynnix Studios)
Last updated: 2025-12-20

## What we are shipping
A fast, clean Sudoku experience built once (Expo) and released in this order:
1. Web (first)
2. Android (Play Store)
3. iOS (TestFlight until ready for public launch)

MVP modes:
- Free Play (difficulty: Easy, Medium, Hard, Expert, Extreme)
- Daily (global UTC, same puzzle worldwide, 30-day archive)

## Non-negotiables
- Daily is keyed to UTC date and is globally identical for that date.
- First completed attempt of the Daily is the only ranked submission.
- Replays of the Daily are allowed but never affect the leaderboard.
- Daily leaderboard has two tabs:
  - Score (primary)
  - Raw Time (secondary)
- Ranked scoring uses time plus penalties (see below).
- Signed-in users get cross-device sync via move-log merge.
- Guest play works offline and can later convert to an account while keeping saves and stats.
- Web keyboard controls must feel intentional and fast.

## Daily scoring
We store both raw time and ranked score.

Definitions:
- raw_time_ms: elapsed play time excluding paused time.
- score_ms: raw time plus penalties.

Score formula:
score_ms = raw_time_ms
         + (mistakes_count * 30_000)
         + hint_penalty_ms

Penalties:
- Mistake: +30 seconds each
- Explain technique: +30 seconds
- Show candidates: +45 seconds
- Highlight next logical move: +60 seconds
- Check selected cell: +30 seconds
- Check whole board: +90 seconds
- Reveal cell value: +120 seconds

Mistake definition:
- Any incorrect placement against the solution at time of entry counts as 1 mistake, even if later corrected.

## Puzzle sourcing
- Daily: server-published payloads, cached locally (guarantees global consistency).
- Free Play: hybrid packs:
  - small built-in starter packs per difficulty
  - downloadable packs updated via manifest
  - never block play on downloads, fall back to cached packs

Offline:
- Free Play works offline via cached or built-in packs.
- Daily works offline only if already cached for that date.

## Leaderboards (MVP)
- Daily leaderboards only (today and archived days).
- Primary ranking by score_ms (ascending).
- Secondary tab by raw_time_ms (ascending).
- Show Top 100 plus an "Around You" slice for signed-in players.

## Saves and sync (MVP)
- Autosave locally with debounce and on background/tab hidden.
- Signed-in sync uses a move log merge model for cross-device continuity.
- No conflict dialogs; merged state is deterministic.

## Web UX requirements (MVP minimum)
Desktop keyboard:
- 1-9 set value
- Backspace/Delete clear
- Arrow keys move
- N toggle notes
- U undo, R redo
- Esc unselect/close modal

Mobile web:
- touch-first, same as native mobile layout.

## What is out of scope (MVP)
- Additional Sudoku variants (Killer, etc.)
- Friends/social features
- Monetization/IAP
- Push notifications
- Heavy anti-cheat (beyond server-side writes and basic integrity checks)

## MVP success metrics
- Activation: start a puzzle within 60 seconds of first open
- Completion rate: started vs completed (Daily and Free Play)
- Daily return: play Daily again within 48 hours
- Retention: D1 and D7 by platform
- Share of Daily completions that are ranked submissions vs replays
