import type { Grid } from '@cynnix-studios/sudoku-core';

export type GridHighlights = {
  row: ReadonlySet<number>;
  col: ReadonlySet<number>;
  box: ReadonlySet<number>;
  sameValue: ReadonlySet<number>;
};

export function computeGridHighlights(args: { puzzle: Grid; selectedIndex: number | null }): GridHighlights {
  if (args.selectedIndex == null) return { row: new Set(), col: new Set(), box: new Set(), sameValue: new Set() };

  const sel = args.selectedIndex;
  const r = Math.floor(sel / 9);
  const c = sel % 9;

  const row = new Set<number>();
  const col = new Set<number>();
  const box = new Set<number>();
  const boxR0 = Math.floor(r / 3) * 3;
  const boxC0 = Math.floor(c / 3) * 3;
  for (let i = 0; i < 81; i++) {
    if (Math.floor(i / 9) === r) row.add(i);
    if (i % 9 === c) col.add(i);
    const ir = Math.floor(i / 9);
    const ic = i % 9;
    if (ir >= boxR0 && ir < boxR0 + 3 && ic >= boxC0 && ic < boxC0 + 3) box.add(i);
  }

  const v = args.puzzle[sel];
  const sameValue = new Set<number>();
  if (typeof v === 'number' && v >= 1 && v <= 9) {
    for (let i = 0; i < 81; i++) {
      if (args.puzzle[i] === v) sameValue.add(i);
    }
  }

  return { row, col, box, sameValue };
}


