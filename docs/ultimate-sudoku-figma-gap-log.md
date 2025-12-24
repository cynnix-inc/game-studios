# Ultimate Sudoku — Figma ↔ Code Gap Log

Design source of truth: [Figma Make “Ultimate Sudoku”](https://www.figma.com/make/CWUV24rOWs5OY24YK5JVoK/Ultimate-Sudoku?t=RGsaDn8PHIYcsu9K-1)

This doc tracks **bi-directional gaps** during the UI replacement work:

- **Figma → Code**: the design shows UI/behavior, but the app/backend doesn’t support it yet.
  - Policy: **build the UI anyway**, but **disable the functionality** and make the disabled state clear.
- **Code → Figma**: the current app has functionality that is **not represented in the design**.
  - Policy: **do not ship it in the new UI**. Log it here as “functionality without design”.

## Entry format (required)

### [GAP-000] Short title
- **type**: figma_to_code | code_to_figma
- **screen**: menu | difficulty | game | dailyChallenges | settings | stats | leaderboard | profile | auth | global
- **status**: logged | blocked | implemented | deferred
- **source**:
  - **figma**: component/screen name and/or notable UI element
  - **code**: file(s) and/or service(s)
- **summary**: what’s missing or conflicting
- **expected_in_design**: what the design implies (exact wording/behavior if stated)
- **expected_in_code**: what exists today / what is feasible
- **decision**: how we’re shipping it now (disabled UI, placeholder, removed, etc.)
- **notes**: portability constraints (web vs native), a11y considerations, etc.

## Gaps

### [GAP-001] Icons from `lucide-react` in Make reference code
- **type**: figma_to_code
- **screen**: global
- **status**: logged
- **source**:
  - **figma**: Make reference code uses `lucide-react` icons throughout (e.g., `Play`, `Grid3x3`, `Trophy`)
  - **code**: Expo/RN app does not include `lucide-react`
- **summary**: Icon set is web React specific; native needs an equivalent source of truth for icon shapes.
- **expected_in_design**: exact icons/shapes used across menu, game header, settings, etc.
- **expected_in_code**: we need a cross-platform icon implementation (likely `@expo/vector-icons` or bundled SVG assets).
- **decision**: use the closest existing icon set already available in the app; if exact shapes are required, request exportable SVGs from design and bundle them.
- **notes**: Treat icon mismatches as a design gap until exact assets are available.

### [GAP-002] Tailwind classes / CSS backdrop blur in Make reference code
- **type**: figma_to_code
- **screen**: global
- **status**: logged
- **source**:
  - **figma**: Make reference code relies on Tailwind (`className`, `blur-3xl`, `backdrop-blur-xl`, gradients)
  - **code**: RN uses styles; blur differs on native/web
- **summary**: Exact CSS effects may not be 1:1 portable.
- **expected_in_design**: glassmorphism cards, blurred particles, smooth transitions.
- **expected_in_code**: use existing `expo-blur`, `expo-linear-gradient`, and platform-specific web styles where needed.
- **decision**: implement best-effort cross-platform; document residual differences (especially backdrop blur strength and performance).
- **notes**: Must respect reduced-motion preferences; blur intensity may be lowered on low-end devices if needed (log as performance gap if it impacts fidelity).

### [GAP-003] Make `AuthModal` implies email auth UX but backend contract is Supabase OAuth + sessions
- **type**: figma_to_code
- **screen**: auth
- **status**: logged
- **source**:
  - **figma**: `AuthModal` includes email username/password fields and platform buttons
  - **code**: app uses Supabase auth flows (Google/Apple) and stores profile in `usePlayerStore`
- **summary**: Email auth UI exists in design reference but may not be implemented/desired in current product.
- **expected_in_design**: Sign in/up tabs, email/password form, success/error handling.
- **expected_in_code**: Google/Apple supported; email/password unknown/unsupported.
- **decision**: render the email form UI but disable submission unless email auth exists; wire Google/Apple to existing flows; log missing error/loading states if not in design.
- **notes**: Any auth error messaging not specified by design must be treated as a design gap.

### [GAP-004] Difficulty “Extreme” exists in engine but is not in the Figma Make UI
- **type**: code_to_figma
- **screen**: difficulty
- **status**: logged
- **source**:
  - **figma**: Difficulty selection shows `easy | medium | hard | expert`
  - **code**: `packages/sudoku-core/src/engine/difficulty.ts` includes `extreme`
- **summary**: The app supports an additional difficulty not present in the redesign.
- **expected_in_design**: Either include “Extreme” in the UI, or explicitly omit it.
- **expected_in_code**: Extreme difficulty is available and test-covered.
- **decision**: Omit “Extreme” from the new UI until design includes it; keep engine support intact.
- **notes**: This is an explicit “functionality without design” item.

### [GAP-011] Legacy route-based UI removed in favor of Make state-machine navigation
- **type**: code_to_figma
- **screen**: global
- **status**: logged
- **source**:
  - **figma**: Single-screen state machine navigation (no tabs, no separate route chrome)
  - **code**: Previously shipped route surfaces (`/game`, `/daily`, `/settings`, `/leaderboard`, `/auth`)
- **summary**: Old route-based UI is not represented in the redesign.
- **expected_in_design**: Navigation happens inside the Make UI shell.
- **expected_in_code**: Remove legacy route UI and keep only the new entry surface.
- **decision**: Deleted legacy route screens and updated E2E to validate new navigation.

### [GAP-005] “Lock” control exists in Make game UI but is not supported by current app gameplay UI/engine wiring
- **type**: figma_to_code
- **screen**: game
- **status**: logged
- **source**:
  - **figma**: Make Sudoku UI includes a Lock mode and “locked number” behavior
  - **code**: Current gameplay flow uses `SudokuGrid` + `NumberPad` + `usePlayerStore` without lock-mode semantics
- **summary**: Design includes a control not implemented in the existing UX contract.
- **expected_in_design**: Locking a number enables rapid entry / toggling on click (as implied by Make reference component).
- **expected_in_code**: No lock state; would require new input-mode state and keyboard/touch behavior changes.
- **decision**: Render the Lock button in the new UI but keep it **disabled** until the behavior is defined and implemented.
- **notes**: Treat as a future UX enhancement requiring keyboard + a11y review (color-only state not sufficient).

### [GAP-006] DailyChallenges calendar uses UTC keys; Figma Make reference uses local time for month/timer
- **type**: figma_to_code
- **screen**: dailyChallenges
- **status**: logged
- **source**:
  - **figma**: Make reference code uses `new Date()` (local) for calendar + reset timer
  - **code**: Product logic is UTC-keyed for daily puzzles and leaderboard
- **summary**: Design doesn’t explicitly specify timezone semantics for the calendar, but the game rules rely on UTC.
- **expected_in_design**: Explicit guidance on whether the calendar reflects local dates or UTC dates.
- **expected_in_code**: Daily is UTC-based; showing local dates can mislead users around midnight.
- **decision**: Implement the calendar using **UTC date keys** and label it as UTC in the day detail modal until design clarifies.
- **notes**: If design later mandates local calendar, we’ll need a clear mapping/labeling strategy to avoid breaking daily rules.

### [GAP-007] DailyChallenges “Stats” tab is not fully defined by current app data contracts
- **type**: figma_to_code
- **screen**: dailyChallenges
- **status**: logged
- **source**:
  - **figma**: DailyChallenges shows current streak, longest streak, total completed, average score, personal best
  - **code**: We can compute streak + completion count from local completion index; other metrics lack a defined source/contract
- **summary**: Missing data mapping for several stats fields shown in design.
- **expected_in_design**: Exact definitions and sources for average score, personal best, longest streak, etc.
- **expected_in_code**: Only completion index is currently deterministic; score history requires additional persisted stats.
- **decision**: Show only **current streak** (real), and keep the rest disabled/placeholder until contract exists.

### [GAP-008] Theme persistence is web-only in the current port
- **type**: figma_to_code
- **screen**: settings
- **status**: logged
- **source**:
  - **figma**: Theme selection implies persistence across sessions
  - **code**: Theme is persisted to `localStorage` on web; native persistence is not yet implemented
- **summary**: Theme choice may reset on native app restart.
- **expected_in_design**: Persist theme choice everywhere or specify platform differences.
- **expected_in_code**: Add native persistence via a local save slot (or platform storage) and hydrate on startup.
- **decision**: Ship theme switching now; log persistence gap for native until implemented.

### [GAP-009] Daily leaderboard has two-tab UX in current app requirements, but redesign shows a single leaderboard surface
- **type**: code_to_figma
- **screen**: leaderboard
- **status**: logged
- **source**:
  - **figma**: Leaderboard design is a single list surface (no score/raw-time tabs)
  - **code**: Existing leaderboard feature supports `score` and `raw_time` tabs
- **summary**: Feature parity (two tabs) lacks a design in the new UI.
- **expected_in_design**: A design for the two-tab leaderboard UX, or explicit removal.
- **expected_in_code**: We can continue to support both server views, but UI should match design.
- **decision**: Ship the redesigned leaderboard as **single-tab (score)** only; log missing raw-time surface for future design inclusion.

### [GAP-010] Stats/Profile data (achievements, badges, history) not currently backed by stable app data
- **type**: figma_to_code
- **screen**: stats
- **status**: logged
- **source**:
  - **figma**: Stats and Profile screens include achievements/badges/recent activity and aggregate metrics
  - **code**: Current persisted stats focus on daily submissions and basic counters; many fields shown in design have no defined source
- **summary**: UI exists in design but data contracts are missing or incomplete.
- **expected_in_design**: Definitions and sources for each metric/section (and whether they are per-account vs per-device).
- **expected_in_code**: Extend stats persistence + sync (and/or add backend views) before enabling these sections.
- **decision**: Render Stats/Profile shells; keep data-heavy sections disabled/placeholder until contracts exist.


