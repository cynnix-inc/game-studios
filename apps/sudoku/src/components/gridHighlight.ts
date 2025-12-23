import type { Grid } from '@cynnix-studios/sudoku-core';

export type GridHighlights = {
  row: ReadonlySet<number>;
  col: ReadonlySet<number>;
  sameValue: ReadonlySet<number>;
};

export function computeGridHighlights(args: { puzzle: Grid; selectedIndex: number | null }): GridHighlights {
  if (args.selectedIndex == null) return { row: new Set(), col: new Set(), sameValue: new Set() };

  const sel = args.selectedIndex;
  const r = Math.floor(sel / 9);
  const c = sel % 9;

  const row = new Set<number>();
  const col = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (Math.floor(i / 9) === r) row.add(i);
    if (i % 9 === c) col.add(i);
  }

  const v = args.puzzle[sel];
  const sameValue = new Set<number>();
  if (typeof v === 'number' && v >= 1 && v <= 9) {
    for (let i = 0; i < 81; i++) {
      if (args.puzzle[i] === v) sameValue.add(i);
    }
  }

  return { row, col, sameValue };
}


