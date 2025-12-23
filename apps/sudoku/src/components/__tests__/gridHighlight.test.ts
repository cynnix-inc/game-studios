import type { Grid } from '@cynnix-studios/sudoku-core';

import { computeGridHighlights } from '../gridHighlight';

function makeGrid(fill: number = 0): Grid {
  return Array.from({ length: 81 }, () => fill) as unknown as Grid;
}

describe('computeGridHighlights', () => {
  test('no selection => empty sets', () => {
    const g = makeGrid(0);
    const h = computeGridHighlights({ puzzle: g, selectedIndex: null });
    expect(h.row.size).toBe(0);
    expect(h.col.size).toBe(0);
    expect(h.sameValue.size).toBe(0);
  });

  test('selected cell highlights row + col', () => {
    const g = makeGrid(0);
    const h = computeGridHighlights({ puzzle: g, selectedIndex: 40 }); // row 4 col 4
    expect(h.row.size).toBe(9);
    expect(h.col.size).toBe(9);
    expect(h.row.has(36)).toBe(true);
    expect(h.col.has(4)).toBe(true);
  });

  test('sameValue highlights all cells matching selected value', () => {
    const g = makeGrid(0);
    (g as unknown as number[])[0] = 7;
    (g as unknown as number[])[10] = 7;
    (g as unknown as number[])[80] = 7;

    const h = computeGridHighlights({ puzzle: g, selectedIndex: 10 });
    expect(h.sameValue.has(0)).toBe(true);
    expect(h.sameValue.has(10)).toBe(true);
    expect(h.sameValue.has(80)).toBe(true);
    expect(h.sameValue.size).toBe(3);
  });

  test('selected value 0 => no sameValue highlights', () => {
    const g = makeGrid(0);
    const h = computeGridHighlights({ puzzle: g, selectedIndex: 0 });
    expect(h.sameValue.size).toBe(0);
  });
});


