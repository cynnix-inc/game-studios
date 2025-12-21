import type { CellValue, Grid } from './grid';
import { assertGrid, boxOf, colOf, rowOf } from './grid';

export type SolveResult =
  | { ok: true; solution: Grid }
  | { ok: false; reason: 'invalid' | 'no-solution' };

function shuffle<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

const ALL_DIGITS_MASK = 0x1ff; // 9 bits

function bitForDigit(d: CellValue): number {
  return 1 << (d - 1);
}

function popcount9(n: number): number {
  // n is at most 9 bits wide (0..511). Use Kernighan loop for correctness.
  n = n & ALL_DIGITS_MASK;
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

function digitsFromMask(mask: number): CellValue[] {
  const out: CellValue[] = [];
  for (let d = 1 as CellValue; d <= 9; d = (d + 1) as CellValue) {
    if (mask & bitForDigit(d)) out.push(d);
  }
  return out;
}

function makeRng(seed: number) {
  // xorshift32
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function countSolutions(
  gridIn: ReadonlyArray<number>,
  opts?: { limit?: number; random?: boolean; seed?: number },
): number {
  assertGrid(gridIn);
  const grid = gridIn.slice() as Grid as CellValue[];

  const limit = opts?.limit ?? 2;
  if (limit <= 0) return 0;

  const seed = opts?.seed ?? 1337;
  const rnd = makeRng(seed);

  const rowMask = Array.from({ length: 9 }, () => 0);
  const colMask = Array.from({ length: 9 }, () => 0);
  const boxMask = Array.from({ length: 9 }, () => 0);

  // Initialize masks + validate givens
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(r, c);
    const bit = bitForDigit(v);
    if (rowMask[r]! & bit) return 0;
    if (colMask[c]! & bit) return 0;
    if (boxMask[b]! & bit) return 0;
    rowMask[r] = (rowMask[r] ?? 0) | bit;
    colMask[c] = (colMask[c] ?? 0) | bit;
    boxMask[b] = (boxMask[b] ?? 0) | bit;
  }

  const allowedMaskAt = (i: number) => {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(r, c);
    return (~(rowMask[r]! | colMask[c]! | boxMask[b]!) & ALL_DIGITS_MASK) >>> 0;
  };

  let count = 0;

  const backtrack = () => {
    if (count >= limit) return;

    let bestI = -1;
    let bestMask = 0;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if ((grid as CellValue[])[i] !== 0) continue;
      const mask = allowedMaskAt(i);
      const pc = popcount9(mask);
      if (pc === 0) return; // dead end
      if (pc < bestCount) {
        bestCount = pc;
        bestI = i;
        bestMask = mask;
        if (pc === 1) break;
      }
    }

    if (bestI === -1) {
      count++;
      return;
    }

    const r = rowOf(bestI);
    const c = colOf(bestI);
    const b = boxOf(r, c);

    const candidates = digitsFromMask(bestMask);
    const ordered = opts?.random ? shuffle(candidates, rnd) : candidates;

    for (const v of ordered) {
      const bit = bitForDigit(v);
      (grid as CellValue[])[bestI] = v;
      rowMask[r] = (rowMask[r] ?? 0) | bit;
      colMask[c] = (colMask[c] ?? 0) | bit;
      boxMask[b] = (boxMask[b] ?? 0) | bit;

      backtrack();

      (grid as CellValue[])[bestI] = 0;
      rowMask[r] = (rowMask[r] ?? 0) & ~bit;
      colMask[c] = (colMask[c] ?? 0) & ~bit;
      boxMask[b] = (boxMask[b] ?? 0) & ~bit;
      if (count >= limit) return;
    }
  };

  backtrack();
  return count;
}

export function solve(gridIn: ReadonlyArray<number>, opts?: { random?: boolean; seed?: number }): SolveResult {
  assertGrid(gridIn);
  const grid = gridIn.slice() as Grid as CellValue[];

  const seed = opts?.seed ?? 1337;
  const rnd = makeRng(seed);

  const rowMask = Array.from({ length: 9 }, () => 0);
  const colMask = Array.from({ length: 9 }, () => 0);
  const boxMask = Array.from({ length: 9 }, () => 0);

  // Initialize masks + validate givens
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(r, c);
    const bit = bitForDigit(v);
    if (rowMask[r]! & bit) return { ok: false, reason: 'invalid' };
    if (colMask[c]! & bit) return { ok: false, reason: 'invalid' };
    if (boxMask[b]! & bit) return { ok: false, reason: 'invalid' };
    rowMask[r] = (rowMask[r] ?? 0) | bit;
    colMask[c] = (colMask[c] ?? 0) | bit;
    boxMask[b] = (boxMask[b] ?? 0) | bit;
  }

  const allowedMaskAt = (i: number) => {
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(r, c);
    return (~(rowMask[r]! | colMask[c]! | boxMask[b]!) & ALL_DIGITS_MASK) >>> 0;
  };

  const backtrack = (): boolean => {
    let bestI = -1;
    let bestMask = 0;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if ((grid as CellValue[])[i] !== 0) continue;
      const mask = allowedMaskAt(i);
      const pc = popcount9(mask);
      if (pc === 0) return false;
      if (pc < bestCount) {
        bestCount = pc;
        bestI = i;
        bestMask = mask;
        if (pc === 1) break;
      }
    }

    if (bestI === -1) return true;

    const r = rowOf(bestI);
    const c = colOf(bestI);
    const b = boxOf(r, c);

    const candidates = digitsFromMask(bestMask);
    const ordered = opts?.random ? shuffle(candidates, rnd) : candidates;

    for (const v of ordered) {
      const bit = bitForDigit(v);
      (grid as CellValue[])[bestI] = v;
      rowMask[r] = (rowMask[r] ?? 0) | bit;
      colMask[c] = (colMask[c] ?? 0) | bit;
      boxMask[b] = (boxMask[b] ?? 0) | bit;

      if (backtrack()) return true;

      (grid as CellValue[])[bestI] = 0;
      rowMask[r] = (rowMask[r] ?? 0) & ~bit;
      colMask[c] = (colMask[c] ?? 0) & ~bit;
      boxMask[b] = (boxMask[b] ?? 0) & ~bit;
    }
    return false;
  };

  const ok = backtrack();
  return ok ? { ok: true, solution: grid as unknown as Grid } : { ok: false, reason: 'no-solution' };
}


