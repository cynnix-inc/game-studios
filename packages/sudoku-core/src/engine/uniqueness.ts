import type { CellValue, Grid } from './grid';
import { assertGrid, boxOf, colOf, rowOf } from './grid';

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

function findEmpty(grid: Grid): number {
  for (let i = 0; i < 81; i++) if (grid[i]! === 0) return i;
  return -1;
}

/**
 * Counts solutions up to 2 (0, 1, or 2 meaning "2 or more").
 * Deterministic and intended for uniqueness enforcement / gating.
 */
export function countSolutionsUpTo2(gridIn: ReadonlyArray<number>): 0 | 1 | 2 {
  assertGrid(gridIn);
  const grid = gridIn.slice() as Grid as CellValue[];

  // Validate given clues
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    if (!allowed(grid as unknown as Grid, i, v)) return 0;
  }

  // Use a number internally to avoid TypeScript narrowing pitfalls, then clamp to 0|1|2 on return.
  let count = 0;
  const digits: CellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const backtrack = (): void => {
    if (count >= 2) return;
    const i = findEmpty(grid as unknown as Grid);
    if (i === -1) {
      count = count === 0 ? 1 : 2;
      return;
    }

    for (const v of digits) {
      if (!allowed(grid as unknown as Grid, i, v)) continue;
      (grid as CellValue[])[i] = v;
      backtrack();
      (grid as CellValue[])[i] = 0;
      if (count >= 2) return;
    }
  };

  backtrack();
  if (count <= 0) return 0;
  if (count === 1) return 1;
  return 2;
}


