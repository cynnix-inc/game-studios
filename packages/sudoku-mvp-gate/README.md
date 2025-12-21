# @cynnix-studios/sudoku-mvp-gate

Automated validation gate for **Sudoku v1.1 MVP** readiness (Epic 0).

This package is intentionally **Node/Jest-only** and does not run Expo/RN code. It validates:
- scoring rules + UTC invariants (pure logic)
- schema/migration invariants (static checks)
- edge function boundary conventions (static checks)
- secret leakage constraints (static checks)


