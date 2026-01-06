# Daily Difficulty Schedule v1 (Monthly Mix + Guardrails)

Last updated: 2026-01-06

## Goals

- **Consistency without repetition**: Daily difficulty should feel intentionally scheduled, not random.
- **Streak-friendly**: avoid surprise spikes that cause churn.
- **Deterministic and publishable**: given a UTC date, the chosen difficulty is stable across platforms and rebuilds.
- **Contract-aligned**: difficulties are the canonical tiers:
  - `novice|skilled|advanced|expert|fiendish|ultimate`
  - See `docs/ultimate_sudoku_difficulty_contract_v1_0.md`.

## Non-goals (v1)

- No runtime changes to the app UI/UX.
- No “weekday always equals X” hard mapping (too repetitive).
- No Ultimate in regular rotation (reserve for announced events/special months).

## Inputs / outputs

**Input**: UTC `date_key` in format `YYYY-MM-DD`.

**Output**: one difficulty tier for that date.

## Monthly targets (distribution)

Default monthly targets (rounded deterministically per month length):

- Novice: **13%**
- Skilled: **40%**
- Advanced: **34%**
- Expert: **10%**
- Fiendish: **3%** (≈ 1 day/month)
- Ultimate: **0%** (special events only)

Notes:
- Targets are applied per **calendar month in UTC**.
- Rounding must be stable and deterministic.

## Guardrails (constraints)

These rules prevent “difficulty whiplash” and hard-day clustering:

1) **No large jumps**
- Adjacent days may change by at most **one tier**.
  - Tier order: `novice < skilled < advanced < expert < fiendish < ultimate`.

2) **Expert spacing**
- No consecutive `expert` days.

3) **Fiendish block (optional, once per month)**
- If the month includes at least one Fiendish day, schedule a single 3‑day block:
  - `expert → fiendish → expert`
- Keep this block isolated:
  - No other `expert` within **±2 days** of the block (outside of the block itself).

4) **Streak-friendly weekday bias (soft preference)**
- Mon–Thu: prefer `skilled/advanced`
- Fri–Sun: allow slightly more `advanced/expert`
- This is a **preference** only; guardrails and monthly targets win if they conflict.

## Determinism & versioning

- The schedule is generated with a deterministic algorithm seeded by:
  - `policyVersion` (string, starting at `"v1"`)
  - UTC `YYYY-MM`
- Any change to targets/guardrails/algorithm must bump `policyVersion` to avoid silent drift.

## Algorithm sketch (v1)

For a given `YYYY-MM` month:

1) Determine how many days are in the month.
2) Convert target percentages into **integer counts** per tier using deterministic rounding.
3) If Fiendish count ≥ 1, place a single `expert → fiendish → expert` block (consumes 2 Expert + 1 Fiendish).
4) Fill remaining days left-to-right using a deterministic weighted choice among tiers that:
   - still have remaining count
   - satisfy adjacency constraints
   - satisfy Expert spacing and Fiendish isolation
   - maximize weekday preference score (soft bias)
5) If a greedy pass gets stuck, restart with a deterministic seed offset (bounded attempts).

## Implementation references (code)

- Daily payload schema requires `difficulty` (no other scheduling metadata today):
  - `packages/sudoku-core/src/engine/dailyValidation.ts`
- Web export generates static Daily JSON:
  - `scripts/generate-daily-static.*`
  - invoked by `apps/sudoku/package.json` `export:web`


