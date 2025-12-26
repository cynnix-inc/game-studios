import type { CellValue, Grid } from '../grid';
import { assertGrid, boxOf, colOf, rowOf } from '../grid';

export type TechniqueId = 'FULL_HOUSE' | 'NAKED_SINGLE' | 'HIDDEN_SINGLE';

export type SolverLogEntry = {
  step_index: number;
  technique: TechniqueId;
  placements: number;
  eliminations: number;
  inference_links: number;
  branch_depth: number;
  notes?: string;
};

export type TechniqueSolveResult =
  | { ok: true; solution: Grid; log: SolverLogEntry[] }
  | { ok: false; reason: 'invalid' | 'stuck'; partial: Grid; log: SolverLogEntry[] };

function allowed(grid: Grid, i: number, v: CellValue): boolean {
  const r = rowOf(i);
  const c = colOf(i);
  const b = boxOf(r, c);

  for (let j = 0; j < 81; j++) {
    const vv = grid[j]!;
    if (vv === 0) continue;
    if (j === i) continue;
    if (rowOf(j) === r && vv === v) return false;
    if (colOf(j) === c && vv === v) return false;
    if (boxOf(rowOf(j), colOf(j)) === b && vv === v) return false;
  }
  return true;
}

function candidatesMaskForCell(grid: Grid, i: number): number {
  if (grid[i] !== 0) return 0;
  let mask = 0;
  for (let v = 1 as CellValue; v <= 9; v = (v + 1) as CellValue) {
    if (allowed(grid, i, v)) mask |= 1 << (v - 1);
  }
  return mask;
}

function maskToSingleDigit(mask: number): CellValue | null {
  if (mask === 0) return null;
  if ((mask & (mask - 1)) !== 0) return null;
  const idx = Math.floor(Math.log2(mask));
  return (idx + 1) as CellValue;
}

function digitMissingInUnit(values: CellValue[]): CellValue | null {
  let usedMask = 0;
  for (const v of values) {
    if (v === 0) continue;
    usedMask |= 1 << (v - 1);
  }
  // if exactly one digit missing, then (~usedMask) has exactly one bit set in 1..9 range.
  const missingMask = (~usedMask) & 0x1ff;
  const d = maskToSingleDigit(missingMask);
  return d;
}

function unitIndicesRow(r: number): number[] {
  return Array.from({ length: 9 }, (_, c) => r * 9 + c);
}

function unitIndicesCol(c: number): number[] {
  return Array.from({ length: 9 }, (_, r) => r * 9 + c);
}

function unitIndicesBox(b: number): number[] {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const out: number[] = [];
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) out.push((br + dr) * 9 + (bc + dc));
  }
  return out;
}

function findFullHouseMove(grid: Grid): { cell: number; value: CellValue; notes: string } | null {
  // Deterministic order: rows, cols, boxes; lowest unit index first.
  for (let r = 0; r < 9; r++) {
    const idxs = unitIndicesRow(r);
    const empties = idxs.filter((i) => grid[i] === 0);
    if (empties.length !== 1) continue;
    const missing = digitMissingInUnit(idxs.map((i) => grid[i]!));
    if (!missing) continue;
    return { cell: empties[0]!, value: missing, notes: `row:${r}` };
  }
  for (let c = 0; c < 9; c++) {
    const idxs = unitIndicesCol(c);
    const empties = idxs.filter((i) => grid[i] === 0);
    if (empties.length !== 1) continue;
    const missing = digitMissingInUnit(idxs.map((i) => grid[i]!));
    if (!missing) continue;
    return { cell: empties[0]!, value: missing, notes: `col:${c}` };
  }
  for (let b = 0; b < 9; b++) {
    const idxs = unitIndicesBox(b);
    const empties = idxs.filter((i) => grid[i] === 0);
    if (empties.length !== 1) continue;
    const missing = digitMissingInUnit(idxs.map((i) => grid[i]!));
    if (!missing) continue;
    return { cell: empties[0]!, value: missing, notes: `box:${b}` };
  }
  return null;
}

function findNakedSingleMove(grid: Grid): { cell: number; value: CellValue } | null {
  // Deterministic: lowest cell index first.
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const mask = candidatesMaskForCell(grid, i);
    const single = maskToSingleDigit(mask);
    if (single) return { cell: i, value: single };
  }
  return null;
}

function findHiddenSingleMove(grid: Grid): { cell: number; value: CellValue; notes: string } | null {
  const unitKinds: Array<{ kind: 'row' | 'col' | 'box'; index: number; indices: number[] }> = [];
  for (let r = 0; r < 9; r++) unitKinds.push({ kind: 'row', index: r, indices: unitIndicesRow(r) });
  for (let c = 0; c < 9; c++) unitKinds.push({ kind: 'col', index: c, indices: unitIndicesCol(c) });
  for (let b = 0; b < 9; b++) unitKinds.push({ kind: 'box', index: b, indices: unitIndicesBox(b) });

  for (const unit of unitKinds) {
    // For each digit, find how many cells in this unit can take it.
    const empties = unit.indices.filter((i) => grid[i] === 0);
    if (empties.length === 0) continue;

    const masks = empties.map((i) => ({ i, mask: candidatesMaskForCell(grid, i) }));
    for (let d = 1 as CellValue; d <= 9; d = (d + 1) as CellValue) {
      const bit = 1 << (d - 1);
      let onlyCell: number | null = null;
      for (const m of masks) {
        if ((m.mask & bit) === 0) continue;
        if (onlyCell == null) onlyCell = m.i;
        else {
          onlyCell = -1;
          break;
        }
      }
      if (onlyCell == null || onlyCell === -1) continue;
      return { cell: onlyCell, value: d, notes: `${unit.kind}:${unit.index}` };
    }
  }

  return null;
}

function isSolved(grid: Grid): boolean {
  for (let i = 0; i < 81; i++) if (grid[i] === 0) return false;
  return true;
}

export function solveWithTechniquesSubset(gridIn: ReadonlyArray<number>): TechniqueSolveResult {
  assertGrid(gridIn);
  const grid = gridIn.slice() as Grid as CellValue[];

  // Validate givens
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    if (!allowed(grid as unknown as Grid, i, v)) {
      return { ok: false, reason: 'invalid', partial: grid as unknown as Grid, log: [] };
    }
  }

  const log: SolverLogEntry[] = [];
  let step = 0;

  // Safety cap to avoid infinite loops if we introduce a buggy technique.
  const maxSteps = 10_000;
  while (!isSolved(grid as unknown as Grid) && step < maxSteps) {
    const fullHouse = findFullHouseMove(grid as unknown as Grid);
    if (fullHouse) {
      grid[fullHouse.cell] = fullHouse.value;
      log.push({
        step_index: step++,
        technique: 'FULL_HOUSE',
        placements: 1,
        eliminations: 0,
        inference_links: 0,
        branch_depth: 0,
        notes: fullHouse.notes,
      });
      continue;
    }

    const naked = findNakedSingleMove(grid as unknown as Grid);
    if (naked) {
      grid[naked.cell] = naked.value;
      log.push({
        step_index: step++,
        technique: 'NAKED_SINGLE',
        placements: 1,
        eliminations: 0,
        inference_links: 0,
        branch_depth: 0,
      });
      continue;
    }

    const hidden = findHiddenSingleMove(grid as unknown as Grid);
    if (hidden) {
      grid[hidden.cell] = hidden.value;
      log.push({
        step_index: step++,
        technique: 'HIDDEN_SINGLE',
        placements: 1,
        eliminations: 0,
        inference_links: 0,
        branch_depth: 0,
        notes: hidden.notes,
      });
      continue;
    }

    return { ok: false, reason: 'stuck', partial: grid as unknown as Grid, log };
  }

  if (!isSolved(grid as unknown as Grid)) {
    return { ok: false, reason: 'stuck', partial: grid as unknown as Grid, log };
  }

  return { ok: true, solution: grid as unknown as Grid, log };
}


