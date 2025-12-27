# Free Play Packs + Generator Tooling

This repo supports **hybrid Free Play puzzle sourcing**:

- **Cached packs** (downloaded from a remote base URL and stored locally)
- **Bundled packs** (JSON shipped in the app bundle)
- **Generator fallback** (local generation when packs are exhausted)

The goal is to always have puzzles available instantly, while still allowing remote pack updates.

## How Free Play chooses puzzles (packs-first)

In `apps/sudoku`, Free Play selection is **packs-first**:

1. **Cached pack** (if present locally)  
2. **Bundled pack** (shipped with the app)  
3. **Generator fallback** (local generation)

Puzzles are tracked as **started** (per difficulty) so we avoid repeats until packs are exhausted.

## Pack creator tool (CLI)

The repo includes a script to generate pack JSONs for all difficulties:

```bash
corepack pnpm gen:freeplay-packs -- --outDir apps/sudoku/src/freeplayPacks/bundled --count 20
```

### Flags

- **`--outDir` / `--out`**: output directory (default: `apps/sudoku/src/freeplayPacks/bundled`)
- **`--count`**: puzzles per difficulty (default: `20`)
- **`--version`**: pack `version` field (default: `bundled-v1`)
- **`--prefix`**: prefix used when generating `puzzle_id` (default: `bundled`)
- **`--seedBase`**: starting seed for deterministic generation (default: `20250101`)
- **`--maxAttempts`**: generator retry cap per puzzle (default: `200`)
- **`--difficulty <name>`**: restrict generation to specific difficulties (repeatable)

Notes:

- Output files are written as `<difficulty>.json` inside `--outDir`.
- If you regenerate bundled packs, commit the JSON files so they ship with the app.

## Local generator API

The pack generator uses the **contract-gated** generator in `@cynnix-studios/sudoku-core`:

- `generateContractGated(difficulty, { seed, maxAttempts })`

This generator gates on:

- **Uniqueness** (exactly one solution)
- **A deterministic subset-technique solver** (currently: `FULL_HOUSE`, `NAKED_SINGLE`, `HIDDEN_SINGLE`)

## Tests

Relevant tests live in:

- `packages/sudoku-core/tests/uniqueness.test.ts`
- `packages/sudoku-core/tests/techniqueSubsetSolver.test.ts`
- `packages/sudoku-core/tests/generatorContractGated.test.ts`
- `apps/sudoku/src/services/__tests__/freeplayPacks.test.ts`

Run all tests via:

```bash
corepack pnpm test
```


