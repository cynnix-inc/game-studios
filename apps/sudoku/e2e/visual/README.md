# Visual regression specs (Ultimate Sudoku fidelity pass)

Policy:
- Snapshots are taken at **mobile/tablet/desktop** viewports.
- We run with **reduced motion** to avoid animation-driven flake.
- **Do not** update snapshots unless explicitly approved.

Run:
- Baseline (no updates): `corepack pnpm -C apps/sudoku test:e2e -- e2e/visual/**`
- Update snapshots (manual approval only): `corepack pnpm -C apps/sudoku test:e2e -- --update-snapshots e2e/visual/**`


