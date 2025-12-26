# Ultimate Sudoku Difficulty Contract v1.0

This document defines the technical meaning of each difficulty level, how puzzles are rated, and the acceptance tests a puzzle must pass to ship.

---

## 1) Scope and non-negotiables

### Puzzle type
- Grid: 9x9 classic Sudoku (rows, columns, 3x3 boxes).
- Solution: exactly one (unique solution required).
- Player-facing expectation: solvable with logic, not trial-and-error guessing.

### Rating philosophy
- Difficulty is determined by the highest technique required by a deterministic solver that uses a fixed technique priority order.
- Clue ranges are targets, not the sole determinant of difficulty.

---

## 2) Data model

### Puzzle
- `givens[81]`: 0 for empty, 1..9 for a given.
- `solution[81]`: solved grid (used for generation and validation).
- `metadata`:
  - `clue_count`
  - `symmetry` (optional)
  - `variant_flags` (must be empty for Classic, variants handled separately)

### Solver log
Every move must produce a log entry:
- `step_index: int`
- `technique: TechniqueId`
- `placements: int` (0+)
- `eliminations: int` (0+)
- `inference_links: int` (0 if not a chain-based step)
- `branch_depth: int` (0 unless forcing or assumption logic)
- `notes`: optional detail for debugging

---

## 3) Technique enums (canonical IDs)

Use these IDs in code, telemetry, and any internal tooling.

```text
enum TechniqueId {
  // Singles
  FULL_HOUSE,
  NAKED_SINGLE,
  HIDDEN_SINGLE,

  // Basic patterns
  NAKED_PAIR,
  HIDDEN_PAIR,
  POINTING_PAIR_TRIPLE,
  CLAIMING_BOX_LINE,

  NAKED_TRIPLE,
  HIDDEN_TRIPLE,

  NAKED_QUAD,
  HIDDEN_QUAD,

  // Coloring
  SIMPLE_COLORING,        // single-digit coloring
  MULTI_COLORING,         // multi-digit or multi-constraint coloring (3D Medusa style)

  // Fish
  X_WING,
  SWORDFISH,
  JELLYFISH,              // optional, Ultimate only if enabled

  // Wings and related
  XY_WING,
  XYZ_WING,
  W_WING,                 // optional, Fiendish+

  // Chains
  AIC,                    // Alternating Inference Chain / nice loop
  FORCING_CHAIN,          // branch-based, but still logic-driven

  // Uniqueness and assumption logic
  UNIQUE_RECTANGLE,
  BUG_PLUS_ONE,           // optional if supported
  NISHIO                  // single-candidate assumption leading to contradiction
}
```

Notes:
- If you do not implement an optional technique, do not include it in shipping configs.
- Uniqueness tests are only allowed where explicitly permitted.

---

## 4) Chain and complexity metrics

These metrics are used as hard caps per difficulty.

### Definitions
- Inference link: one logical implication edge inside a chain (candidate implies candidate or eliminates candidate).
- Chain length: total inference links for that step.
- Branch depth: number of nested binary branches used to reach a contradiction or confirmation.

### Global caps defaults
These are defaults that each difficulty tightens or loosens.

- `max_chain_length`: max inference links in a single step.
- `max_branch_depth`: max nesting depth of assumptions.
- `max_branch_nodes`: max explored nodes in a forcing step (optional but recommended to prevent solver from "searching").

---

## 5) Clarity and fairness metrics

These do not define difficulty, but they prevent "rated correct, feels awful" puzzles.

### Metrics computed per puzzle (from solver trace)
- `avg_candidates_per_empty_cell` (sampled every N steps, or averaged across solve)
- `stall_runs`: count of times the solver needed to escalate technique because no cheaper technique was available
- `forced_step_ratio`: proportion of steps where exactly one cheapest move existed (too high can feel linear, too low can feel guessy)
- `backtracking_used`: must be false for all difficulties (this is not the same as Nishio, which is a constrained assumption step with logged proof)

### Recommended thresholds (tunable)
- Novice should have the strictest clarity requirements.
- Ultimate can tolerate higher candidate density, but should still avoid long stretches of "nothing to do".

---

## 6) Difficulty configs (the contract)

Each difficulty is defined by:
- Clue target range
- Allowed techniques (cap)
- Required signature (must appear at least once)
- Chain caps
- Clarity thresholds (recommended minimums)

### 6.1 Novice (Warm-Up Mode)
- Clues target: 36-40
- Allowed techniques: `FULL_HOUSE`, `NAKED_SINGLE`, `HIDDEN_SINGLE`
- Signature required: at least 1 `FULL_HOUSE` or `HIDDEN_SINGLE` (prevents "all naked singles" monotony)
- Chain caps: `max_chain_length = 0`, `max_branch_depth = 0`
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 4.0`
  - `stall_runs <= 1`

### 6.2 Skilled (Standard Play)
- Clues target: 30-34
- Allowed techniques: all Novice plus
  - `NAKED_PAIR`, `HIDDEN_PAIR`, `POINTING_PAIR_TRIPLE`, `CLAIMING_BOX_LINE`
- Signature required: at least 1 of {pair, pointing, claiming}
- Chain caps: `max_chain_length = 0`, `max_branch_depth = 0`
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 5.5`
  - `stall_runs <= 3`

### 6.3 Advanced (Thinker's Level)
- Clues target: 26-30
- Allowed techniques: all Skilled plus
  - `NAKED_TRIPLE`, `HIDDEN_TRIPLE`, `SIMPLE_COLORING`
- Signature required: at least 1 of {triple, simple coloring}
- Chain caps:
  - `SIMPLE_COLORING max_chain_length <= 8`
  - `max_branch_depth = 0`
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 6.5`
  - `stall_runs <= 6`

### 6.4 Expert (Puzzle Master)
- Clues target: 22-26
- Allowed techniques: all Advanced plus
  - `NAKED_QUAD`, `HIDDEN_QUAD` (if enabled)
  - `X_WING`, `SWORDFISH`
  - `MULTI_COLORING` (restricted)
- Signature required: at least 1 of {X-Wing, Swordfish, Multi-coloring}
- Chain caps:
  - `MULTI_COLORING max_chain_length <= 12`
  - No `AIC`, no `FORCING_CHAIN`
  - `max_branch_depth = 0`
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 7.5`
  - `stall_runs <= 10`

### 6.5 Fiendish (Logic Warrior)
- Clues target: 20-24
- Allowed techniques: all Expert plus
  - `XY_WING`, `XYZ_WING`
  - `FORCING_CHAIN` (restricted)
  - Optional: `W_WING` (if implemented)
- Signature required: at least 1 of {XY-Wing, XYZ-Wing, Forcing chain}
- Chain caps:
  - `FORCING_CHAIN max_chain_length <= 16`
  - `max_branch_depth <= 2`
  - Optional: `max_branch_nodes <= 40`
  - No `NISHIO`
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 8.5`
  - `stall_runs <= 16`

### 6.6 Ultimate (Legend Mode)
- Clues target: 17-22
- Allowed techniques: all Fiendish plus
  - `AIC`
  - `UNIQUE_RECTANGLE` (and other uniqueness tools if implemented)
  - `NISHIO`
  - Optional: `JELLYFISH`, `BUG_PLUS_ONE`
- Signature required: at least 1 of {AIC, Uniqueness, Nishio}
- Chain caps:
  - `AIC max_chain_length <= 28`
  - `NISHIO max_branch_depth <= 3`
  - Optional: `max_branch_nodes <= 120`
  - Hard rule: no unrestricted backtracking search
- Clarity (recommended):
  - `avg_candidates_per_empty_cell <= 10.0`
  - `stall_runs` uncapped, but monitor for outliers

---

## 7) Solver priority order (deterministic rating)

The solver must always attempt techniques in this fixed order (or a strictly defined cost model that yields the same outcome):

1) Singles
2) Pairs and box-line
3) Triples
4) Quads
5) Simple coloring
6) Fish
7) Multi-coloring
8) Wings
9) AIC
10) Forcing chain
11) Uniqueness
12) Nishio

Rule:
- If multiple moves exist within a technique bucket, pick deterministically (for example: lowest row, then lowest column, then lowest digit). This prevents rating drift.

---

## 8) Rating algorithm (pseudocode)

```text
solve_and_rate(puzzle):
  assert unique_solution(puzzle) == true

  state = init_state(puzzle)
  log = []

  while not solved(state):
    move = find_cheapest_move(state)   // uses the fixed priority order
    assert move != null

    apply(move, state)
    log.append(move.log_entry)

    assert move.used_backtracking == false

  highest = max(log.technique)
  metrics = compute_metrics(state_history, log)

  tier = tier_from_highest_technique(highest)

  assert puzzle_respects_tier_constraints(tier, log, metrics)
  return tier, log, metrics
```

`tier_from_highest_technique` maps techniques to the lowest tier that permits them.

---

## 9) Acceptance tests (must-pass checks)

### A) Validity
- A1: Puzzle has exactly one solution.
- A2: Given cells match the solution grid.
- A3: No invalid givens (row, col, box duplicates).

### B) Tier compliance
For a candidate tier `T`:
- B1: Solver completes puzzle with no technique outside `T.allowed_techniques`.
- B2: Solver log contains at least one technique in `T.signature_set`.
- B3: All chain steps respect `T.max_chain_length`.
- B4: All assumption steps respect `T.max_branch_depth`.
- B5: `backtracking_used == false`.

### C) Clue targeting
- C1: `clue_count` is within the tier target range OR within an approved tolerance (recommend tolerance: plus or minus 1) and the puzzle still rates correctly by solver.

### D) Clarity and fairness (recommended gates)
- D1: `avg_candidates_per_empty_cell` under tier threshold.
- D2: `stall_runs` under tier threshold.
- D3: No dead start: at least one step available in the first state.

### E) Regression stability
- E1: Running the solver twice yields the same tier and identical highest technique label.
- E2: Changing deterministic tie-breaks must not change tier for any puzzle in the test suite.

---

## 10) Implementation notes (so it stays fair in production)

### Separate leaderboards by ruleset
- If you allow assists, you must record them and segment boards (Standard, No-Hint, Proof).

### Proof mode (optional but recommended for credibility)
- Require each placement to be justified by an allowed technique at the selected tier.
- Store a compact proof trace using the same `TechniqueId` enum.

### Versioning
- This contract is v1.0. Any change to:
  - technique definitions,
  - solver priority order,
  - chain caps,
  - signature requirements,
should bump the version and tag puzzles with the version they were rated under.
