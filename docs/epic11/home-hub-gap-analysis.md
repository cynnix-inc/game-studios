# Home Hub (Figma Make) — Bi-directional Gap Analysis

Source design: [Ultimate Sudoku (Figma Make)](https://www.figma.com/make/CWUV24rOWs5OY24YK5JVoK/Ultimate-Sudoku?t=RGsaDn8PHIYcsu9K-1)

This document is a **bi-directional** gap analysis between:
- **Figma Make Home Hub**: `MainMenu` + `DailyChallenge`
- **Current Expo app**: `apps/sudoku/*`

It explicitly captures what we will **drop** for now, what we will **build**, and what we must **flag as missing** (no invented UI).

## Targets (this iteration)

### Must match (ported)
- Home route `/` becomes a **Home Hub screen** (replaces the current redirect).
- Visual hierarchy from Figma:
  - Top-right account control (Sign In / Username)
  - Logo tile + title “Ultimate Sudoku” + subtitle
  - Featured Daily Challenge card
  - Primary CTA “Play Game”
  - Icon tiles row (Stats / Leaderboard / Settings)
  - Footer “Cynnix Studios © 2025”

### Supported navigation (in-app routes exist)
- “Play Game” → `/game`
- Daily Challenge card → `/daily`
- Leaderboard tile → `/leaderboard`
- Settings tile → `/settings`
- “Sign In” → `/auth`

### Visible but disabled (missing destinations; do not invent screens)
Per explicit decision, these entry points remain visible but **do not navigate**:
- Stats (tile)
- Profile (username button when signed-in)
- DailyChallenges (Daily card’s “view details” destination)

## Figma → App gaps

| Figma element / behavior | Status | Decision | Notes |
|---|---:|---|---|
| Profile screen (`Profile.tsx`) | Missing | **Keep entry point disabled** | We will not create `/profile` in this iteration. |
| Stats screen (`Stats.tsx`) | Missing | **Keep entry point disabled** | We will not create `/stats` in this iteration. |
| DailyChallenges screen (`DailyChallenges.tsx`) | Missing | **Keep entry point disabled** | App already has `/daily`, but not the multi-tab “DailyChallenges” surface. |
| Tailwind + DOM layout fidelity | Partial | **Adapt to RN/Expo** | We’ll port layout and hierarchy, but implementation is RN styles. |
| Lucide icons (`lucide-react`) | Missing | **Add deps (planned)** | Add RN-friendly icon library for matching glyphs. |
| Glassmorphism blur (`backdrop-blur`) | Missing | **Add deps (planned)** | Use `expo-blur` where possible; degrade gracefully if needed. |
| Animated particle background | Partial | **Build in RN** | Implement with RN `Animated` overlays to match the effect. |

## App → Figma gaps

| App requirement / behavior | Status | Decision | Notes |
|---|---:|---|---|
| Current `/` auto-resume redirect (`readLocalResumeTarget`) | Exists | **Dropped for now** | Figma home hub has no “Continue” UI. We will not invent one in this iteration. |
| Tabs wrapper chrome (`expo-router` Tabs) | Exists | **Hide on `/`** | The home hub should feel like a standalone screen per Figma. |
| Daily semantics are **UTC-based** (PRD) | Exists | **Use UTC** | Figma Make’s mock “resets at local midnight” differs; we align to PRD and document mismatch. |
| Daily “completed”/streak display | Exists partially | **Gap (not implemented yet)** | We will not use mock numbers. If we can’t derive real values from app state/services, we will omit those sub-states rather than invent. |

## Theme port gaps (Make glassmorphism → Expo/RN)

| Topic | Status | Decision | Notes |
|---|---:|---|---|
| Tailwind color tokens → hex values | Partial | **Mapped via Tailwind defaults** | Make uses Tailwind class tokens (e.g., `slate-900`, `purple-500`). We mapped these to hex using Tailwind’s default palette; if the Make project uses a customized palette, there may be slight mismatches. |
| Web CSS vars (`styles/globals.css`) | Partial | **Not applied directly** | We ported the “current” theme intent into app-local RN tokens instead of wiring CSS variables through Expo web, to keep parity across iOS/Android/web. |
| Backdrop blur parity | Partial | **Best-effort with `expo-blur`** | `BlurView` rendering differs across platforms and in exported web; we keep a translucent rgba background behind it so the glass effect remains readable even if blur is reduced. |

## Non-goals for this iteration (explicit)
- Implement new Profile/Stats/DailyChallenges screens.
- Add new copy/text not present in Figma (e.g., “Coming soon” labels).
- Reintroduce resume behavior with a new “Continue” button (would be invented UI).


