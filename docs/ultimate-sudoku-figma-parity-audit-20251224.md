# Ultimate Sudoku — Figma Make ↔ App Parity Audit (2025-12-24)

Design source of truth: **Figma Make “Ultimate Sudoku”** (snapshotted into `apps/sudoku/figma-make/ultimate-sudoku/`).

Related doc: `docs/ultimate-sudoku-figma-gap-log.md` (tracks *design-vs-code contract gaps* and explicit decisions).

## Scope

This audit compares the **Make reference UI** (Tailwind/web React in the snapshot) against the current **Expo/RN “Ultimate” implementation**:

- **Make reference (snapshot)**: `apps/sudoku/figma-make/ultimate-sudoku/source/**`
- **Current implementation**: `apps/sudoku/src/ultimate/**` and supporting components in `apps/sudoku/src/components/**`

This is a **code-level audit** (structure, states, interactions, responsiveness and motion hooks). Pixel-perfect verification and visual diffs will be added in the `visual-gates` todo (Playwright screenshots at key breakpoints/states).

## Legend

- **Type**
  - **Visual**: layout/spacing/typography/color/icon/animation fidelity mismatch
  - **Interactive**: hover/focus/pressed states, tooltips, disabled affordances, keyboard behavior
  - **Functional**: flow/data/state/feature not present or not wired as designed
- **Severity**
  - **Blocking**: prevents using the screen/feature as designed (or major fidelity miss)
  - **Deferrable**: polish or non-critical parity; acceptable as follow-up

## Global / Cross-cutting gaps

- **Icon set mismatch (Make uses `lucide-react`, app uses `lucide-react-native`)**
  - **Type**: Visual
  - **Severity**: Deferrable (unless design requires exact shapes)
  - **Suggested fix**: Align icon shapes by exporting exact SVG assets from design and rendering via `react-native-svg`, or explicitly accept closest-match icons per `docs/ultimate-sudoku-figma-gap-log.md` ([GAP-001]).

- **Tailwind/CSS effects not 1:1 portable (backdrop blur, shadows, hover scale)**
  - **Type**: Visual / Interactive
  - **Severity**: Deferrable (unless specific effect is explicitly required)
  - **Suggested fix**: Keep using `expo-blur` + `expo-linear-gradient` (already in use) and add web-only `backdropFilter`/hover transitions where needed; respect reduced motion (see [GAP-002]).

## Menu (Main Menu)

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/MainMenu.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/MenuScreen.tsx` (`UltimateMenuScreen`)

### Issues

- **Stats tile disabled (present in design)**
  - **Type**: Functional
  - **Severity**: Blocking (for parity; screen exists in design navigation)
  - **Current behavior**: hard-disabled via `statsEnabled = false` and `opacity: 0.5`
  - **Suggested fix**: wire navigation to `UltimateStatsScreen` and enable tile; if data not ready, keep *content* placeholders but do not block navigation.

- **Profile entry disabled even when signed-in (design implies reachable profile)**
  - **Type**: Functional
  - **Severity**: Blocking (navigation parity)
  - **Current behavior**: `profileEnabled = false`, pressable disabled
  - **Suggested fix**: enable navigation to `UltimateProfileScreen` (even if screen content remains partially placeholder).

## Auth modal

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/AuthModal.tsx`
- **Current**: `apps/sudoku/src/ultimate/components/UltimateAuthModal.tsx`

### Issues

- **Sign in / Sign up tabs missing**
  - **Type**: Visual / Functional
  - **Severity**: Deferrable (unless design requires distinct modes)
  - **Suggested fix**: add a tab UI (even if “Sign up” maps to the same OAuth flow), or get explicit design decision to omit.

- **Email auth form is present in design; app renders it as disabled (intent mismatch)**
  - **Type**: Functional
  - **Severity**: Deferrable (depends on product decision)
  - **Suggested fix**: either implement email/password auth (if desired) or update design/decision; tracked in gap log ([GAP-003]).

## Difficulty

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/DifficultySelect.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/DifficultyScreen.tsx`

### Issues

- **Minor hover/shadow/scale fidelity differences likely**
  - **Type**: Visual / Interactive
  - **Severity**: Deferrable
  - **Suggested fix**: ensure `MakeCard` provides comparable default shadows; add web-only hover shadow bump if needed (Make uses `hover:shadow-2xl` + `hover:scale-105`).

- **“Extreme” difficulty exists in engine but is intentionally omitted (design lacks it)**
  - **Type**: Functional (design gap)
  - **Severity**: Deferrable (intentional)
  - **Suggested fix**: keep omitted until design includes it (gap log [GAP-004]).

## Game

- **Design reference**:
  - `apps/sudoku/figma-make/ultimate-sudoku/source/components/GameScreen.tsx`
  - `apps/sudoku/figma-make/ultimate-sudoku/source/components/Sudoku.tsx`
  - `apps/sudoku/figma-make/ultimate-sudoku/source/components/InGameMenu.tsx`
- **Current**:
  - `apps/sudoku/src/ultimate/screens/GameScreen.tsx` (`UltimateGameScreen`)
  - `apps/sudoku/src/components/SudokuGrid.tsx`
  - `apps/sudoku/src/components/NumberPad.tsx`

### Issues (in-game menu)

- **Slide-down menu sections exist but have no content (Audio / Gameplay / Grid)**
  - **Type**: Functional
  - **Severity**: Blocking (design’s in-game settings are part of core UX)
  - **Current behavior**: only section headers render; expanding doesn’t show controls
  - **Suggested fix**: port the Make `InGameMenu` sections into RN:
    - **Audio**: sound/music toggles + volume sliders + haptics switch
    - **Gameplay**: hint type select + auto-advance toggle (and any other assists present)
    - **Grid sizing**: grid/digit/note sliders + preview
    - Target file: `apps/sudoku/src/ultimate/screens/GameScreen.tsx` (replace the “simplified first pass” block around the menu).

### Issues (keypad + controls)

- **Keypad styling/structure does not match Make**
  - **Type**: Visual / Interactive
  - **Severity**: Blocking (high-visibility mismatch)
  - **Current behavior**: `NumberPad` renders 9 square buttons + a separate “Clear” button; Make uses a 9-wide keypad row and specific disabled/enabled behavior tied to selection and lock mode.
  - **Suggested fix**: restyle/replace `apps/sudoku/src/components/NumberPad.tsx` (or create an Ultimate-specific keypad under `apps/sudoku/src/ultimate/**`) to match the Make layout, sizing, typography, and press/hover states.

- **“Lock” control shown in Make but disabled in app**
  - **Type**: Functional
  - **Severity**: Blocking *for parity*; may be Deferrable per product decision
  - **Current behavior**: Lock button is rendered disabled with comment “not supported”
  - **Suggested fix**: either implement lock-mode semantics in `usePlayerStore` + `SudokuGrid` input plumbing, or get explicit design/product decision to remove/disable it; tracked in gap log ([GAP-005]).

### Issues (board visuals)

- **Notes rendering differs (Make shows 3×3 micro-grid; app shows concatenated string)**
  - **Type**: Visual
  - **Severity**: Blocking (cell visuals are the primary product surface)
  - **Current behavior**: `SudokuGrid` displays notes as `"123"` text
  - **Suggested fix**: render notes as a 3×3 grid inside each cell (like Make `Sudoku.tsx`), and apply sizing from settings (grid size + note scale) instead of fixed `width: 36`.

- **Sizing controls differ from Make settings model**
  - **Type**: Functional / Visual
  - **Severity**: Blocking
  - **Current behavior**: board cells are fixed 36px; Make design supports grid size / digit size / note size customization
  - **Suggested fix**: connect `useSettingsStore` sizing (gridSize/numberFontScale/noteFontScale) into `SudokuGrid` and the keypad sizing.

### Issues (completion + feedback)

- **Win state / score feedback not implemented**
  - **Type**: Functional / Visual
  - **Severity**: Deferrable (depending on MVP)
  - **Current behavior**: only a placeholder “Solve status”
  - **Suggested fix**: implement the Make “Puzzle Complete” card/overlay (and map to real score/time/mistakes/hints).

## Daily Challenges

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/DailyChallenges.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/DailyChallengesScreen.tsx`

### Issues

- **Daily start CTA is not defined in Make (design gap)**
  - **Type**: Functional (design gap)
  - **Severity**: Blocking for “play daily from calendar” UX
  - **Current behavior**: modal explicitly notes missing CTA design; `onStartDaily` exists but isn’t used from the modal
  - **Suggested fix**: request/confirm design for the day-detail “Play” CTA (and locked-day behavior). Once defined, wire `onStartDaily(selectedDay.dateKey)` from the modal.

- **Timezone semantics mismatch risk (UTC vs local)**
  - **Type**: Functional (design gap)
  - **Severity**: Blocking (edge-case correctness)
  - **Current behavior**: app uses UTC date keys and UTC month calendar
  - **Suggested fix**: keep UTC until design clarifies; add explicit “UTC” labeling in UI where needed (gap log [GAP-006]).

- **Stats tab fields partially placeholder**
  - **Type**: Functional
  - **Severity**: Deferrable
  - **Current behavior**: streak + completion count are real; avg score/personal best are placeholders unless in visual-test mode
  - **Suggested fix**: define stats contract and backfill from persisted history (gap log [GAP-007]).

## Settings

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/Settings.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/SettingsScreen.tsx`

### Issues

- **Missing Gameplay section (auto candidates, auto-advance, hint type, zen mode, lives)**
  - **Type**: Functional
  - **Severity**: Blocking
  - **Current behavior**: only Theme, Grid Sizing, and basic toggles for Sound/Haptics
  - **Suggested fix**: implement the full Settings structure from Make:
    - toggles + selects + disabled states (Zen mode disables Lives slider)
    - tooltips/info affordances on web (see below)
    - map to `useSettingsStore` / `settingsModel` equivalents

- **Missing Audio volumes + music toggle/volume**
  - **Type**: Functional
  - **Severity**: Blocking (design includes these controls)
  - **Suggested fix**: add musicEnabled/musicVolume and soundVolume controls to `useSettingsStore` if not present, and wire sliders.

- **Missing Display & Language section**
  - **Type**: Functional
  - **Severity**: Deferrable (unless localization is in scope)
  - **Suggested fix**: implement the UI; decide whether it is functional or display-only.

- **Missing Notifications toggle**
  - **Type**: Functional
  - **Severity**: Deferrable (depends on product scope)
  - **Suggested fix**: implement toggle UI and clarify whether it actually schedules push notifications.

- **Tooltips/hover info missing**
  - **Type**: Interactive
  - **Severity**: Deferrable (web-only, but explicitly shown in Make)
  - **Suggested fix**: implement a lightweight tooltip pattern for web (and a long-press/“info” modal on native if desired), matching Make `SettingTooltip`.

- **Theme persistence on native missing**
  - **Type**: Functional
  - **Severity**: Deferrable
  - **Suggested fix**: persist theme type via app settings storage and hydrate at boot (gap log [GAP-008]).

## Stats

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/Stats.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/StatsScreen.tsx`

### Issues

- **Screen is a placeholder; design has full content (cards, level progress, achievements w/ progress)**
  - **Type**: Functional / Visual
  - **Severity**: Blocking
  - **Suggested fix**: implement the full layout first (as UI), then backfill real data contracts; tracked in gap log ([GAP-010]).

## Leaderboard

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/Leaderboard.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/LeaderboardScreen.tsx`

### Issues

- **Visual layout mismatches (avatars, rank styling, score formatting)**
  - **Type**: Visual
  - **Severity**: Blocking (high-visibility)
  - **Current behavior**: list is functional and backed by real daily leaderboard rows; but does not match Make’s avatar + top-3 highlight presentation.
  - **Suggested fix**: re-skin list items to match Make, optionally using initials avatars; keep real data.

- **Raw-time tab intentionally omitted**
  - **Type**: Functional (design gap)
  - **Severity**: Deferrable (intentional)
  - **Suggested fix**: keep single-tab until design adds multi-tab UX (gap log [GAP-009]).

## Profile

- **Design reference**: `apps/sudoku/figma-make/ultimate-sudoku/source/components/Profile.tsx`
- **Current**: `apps/sudoku/src/ultimate/screens/ProfileScreen.tsx`

### Issues

- **Screen is a shell; design includes edit profile, stats cards, badges, recent activity**
  - **Type**: Functional / Visual
  - **Severity**: Blocking
  - **Suggested fix**: implement the layout parity first (UI), then decide data sources for each section (gap log [GAP-010]).

- **Menu does not link to Profile even when signed in**
  - **Type**: Functional
  - **Severity**: Blocking
  - **Suggested fix**: enable the Menu top-right profile pressable (see Menu section).

## Summary of top blockers (ordered)

1. **Game**: in-game menu content + keypad/board visuals + note rendering
2. **Settings**: missing large parts of design (gameplay, audio volumes, tooltips, notifications)
3. **Stats + Profile**: screens are placeholders vs full Make layouts
4. **Menu**: Stats/Profile navigation disabled
5. **Leaderboard**: visual reskin to match Make (data is present)
6. **Daily Challenges**: day “Play” CTA design decision + wiring; timezone labeling clarification


