import type { CellValue, Grid } from './grid';
import { assertGrid, boxOf, colOf, rowOf } from './grid';

export type SolveResult =
  | { ok: true; solution: Grid }
  | { ok: false; reason: 'invalid' | 'no-solution' };

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

function shuffle<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function solve(gridIn: ReadonlyArray<number>, opts?: { random?: boolean; seed?: number }): SolveResult {
  assertGrid(gridIn);
  const grid = gridIn.slice() as Grid as CellValue[];

  // Validate given clues
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    if (!allowed(grid as unknown as Grid, i, v)) return { ok: false, reason: 'invalid' };
  }

  const seed = opts?.seed ?? 1337;
  let s = seed >>> 0;
  const rnd = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };

  const digitsBase: CellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const backtrack = (): boolean => {
    const i = findEmpty(grid as unknown as Grid);
    if (i === -1) return true;

    const digits = opts?.random ? shuffle(digitsBase.slice(), rnd) : digitsBase;
    for (const v of digits) {
      if (!allowed(grid as unknown as Grid, i, v)) continue;
      (grid as CellValue[])[i] = v;
      if (backtrack()) return true;
      (grid as CellValue[])[i] = 0;
    }
    return false;
  };

  const ok = backtrack();
  return ok ? { ok: true, solution: grid as unknown as Grid } : { ok: false, reason: 'no-solution' };
}


