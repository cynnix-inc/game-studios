# Sudoku v1.1 MVP Technical Spec (Dev Bundle)
Last updated: 2025-12-20

## 1. System overview
Clients:
- Expo app (web, android, ios) sharing code

Backend:
- Supabase (Postgres, Auth, Storage)
- Supabase Edge Functions for trusted writes:
  - submit-score
  - upsert-save
  - fetch-daily (optional, can be direct storage fetch)

Key principle:
- All leaderboard writes happen server-side (Edge Function) to prevent client tampering.

## 2. Puzzle distribution
### 2.1 Daily puzzles (server-published)
Storage layout (example):
- storage bucket: puzzles
- daily index: daily/manifest.json
- daily payloads: daily/YYYY-MM-DD.json

manifest.json includes:
- current_version
- list of available days (today plus last 30)
- checksums and sizes
- optional difficulty metadata

Client behavior:
- On app open and once every N hours, fetch manifest (cache with ETag)
- If today's daily is missing or checksum mismatch, download payload
- Cache payload locally:
  - mobile: expo-file-system
  - web: IndexedDB recommended, localStorage acceptable if size stays small

### 2.2 Free Play packs (hybrid)
Pack format:
- pack manifest: freeplay/manifest.json
- pack files per difficulty: freeplay/<difficulty>/<version>.json (or multiple chunk files)

Each pack file contains a list of puzzles:
- puzzle_id
- givens grid
- solution grid (optional client side)
- difficulty numeric rating
- checksum

Update strategy:
- ship starter pack in app bundle for instant play
- download updated packs opportunistically when manifest version changes
- never block play on downloads. If download fails, keep old pack.

## 3. Leaderboards and scoring
### 3.1 Data recorded per run
Store transparency fields:
- utc_date
- player_id
- raw_time_ms
- score_ms
- mistakes_count
- hints_used_count
- hint_breakdown json
- ranked_submission boolean (true only for first completed attempt that day)
- created_at

### 3.2 First attempt enforcement
Server enforces first attempt ranked:
- If player already has ranked_submission for that utc_date, new submissions are stored as replay with ranked_submission=false and do not affect the leaderboard ranking.

### 3.3 Tabs
- Score tab sorts by score_ms
- Raw Time tab sorts by raw_time_ms
Both tabs show mistake and hint counts for context.

## 4. Saves and move log merge
### 4.1 Save object shape
- game_key: "sudoku"
- puzzle_key: daily uses "daily:YYYY-MM-DD", free play uses "free:<difficulty>:<puzzle_id>"
- device_id: stable per install
- revision: monotonic integer per puzzle per device
- moves: list of {rev, ts, cell, kind, value}
  - kind: set, clear, note_add, note_remove, toggle_notes_mode (optional)
- snapshot: derived grid state (optional for MVP)

### 4.2 Merge algorithm
Server and client merge:
- union moves by unique key (device_id, rev)
- sort by (ts, device_id, rev)
- fold into a current-state reducer

Conflict resolution:
- last write wins for current value in a cell
- notes merge as sets per cell (add/remove operations)

### 4.3 Sync triggers
- Debounced during play
- On background / tab hidden
- On app close (best effort)

Implementation notes (MVP):
- The local “in-progress” slot is **local-first** and flushed on lifecycle events.
- When signed in, lifecycle flush should also attempt a **best-effort cloud sync** of the main save slot so another device can resume (no realtime guarantee).

## 5. Supabase schema (MVP baseline)
Tables (conceptual; migration can differ):
- players
- saves
- daily_runs (recommended)

RLS:
- players: user can read/update own by user_id = auth.uid()
- saves: user can read/write own
- daily_runs: insert only via Edge Function (service role), select allowed (public read) subject to privacy decision

## 6. Edge Functions
### 6.1 submit-score
Input:
- utc_date
- raw_time_ms
- mistakes_count
- hints_used_count
- hint_breakdown

Server:
- verify auth (must be signed in for leaderboard submission)
- compute score_ms using penalty table
- enforce first attempt ranked
- insert daily_runs row
- return rank and nearby slice

### 6.2 upsert-save
Input:
- puzzle_key
- device_id
- revision
- moves delta (or full log)

Server:
- verify auth
- merge or upsert save record
- return merged canonical state

## 7. Web build and Netlify
- Use Expo web export
- Netlify build runs pnpm -w export:web:sudoku
- Publish directory: apps/sudoku/dist
- SPA redirect: /* /index.html 200

## 8. Platform rollout notes
Web first:
- keyboard UX is non-negotiable
Android:
- focus on input latency and battery use
iOS:
- distribute through TestFlight, then later App Store
