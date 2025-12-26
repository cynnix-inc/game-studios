import type { Grid } from '@cynnix-studios/sudoku-core';

/**
 * Returns indices of cells that are in conflict (duplicate non-zero values in a row/col/box).
 * Mirrors Make's `getCellConflicts` intent but computes all conflicts in one pass.
 */
export function computeGridConflicts(puzzle: Grid): ReadonlySet<number> {
  const rows: number[][][] = Array.from({ length: 9 }, () => Array.from({ length: 10 }, () => []));
  const cols: number[][][] = Array.from({ length: 9 }, () => Array.from({ length: 10 }, () => []));
  const boxes: number[][][] = Array.from({ length: 9 }, () => Array.from({ length: 10 }, () => []));

  for (let i = 0; i < 81; i++) {
    const v = puzzle[i] ?? 0;
    if (v === 0) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    rows[r]![v]!.push(i);
    cols[c]![v]!.push(i);
    boxes[b]![v]!.push(i);
  }

  const conflicts = new Set<number>();
  const mark = (lists: number[][][]) => {
    for (let g = 0; g < 9; g++) {
      for (let v = 1; v <= 9; v++) {
        const list = lists[g]![v]!;
        if (list.length <= 1) continue;
        for (const idx of list) conflicts.add(idx);
      }
    }
  };
  mark(rows);
  mark(cols);
  mark(boxes);

  return conflicts;
}


