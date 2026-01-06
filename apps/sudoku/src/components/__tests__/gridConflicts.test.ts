import type { Grid } from '@cynnix-studios/sudoku-core';

import { computeGridConflicts } from '../gridConflicts';

function makeGrid(): Grid {
  return Array.from({ length: 81 }, () => 0) as unknown as Grid;
}

describe('computeGridConflicts', () => {
  test('no conflicts on empty grid', () => {
    const g = makeGrid();
    expect(computeGridConflicts(g).size).toBe(0);
  });

  test('row duplicates are conflicts', () => {
    const g = makeGrid();
    (g as unknown as number[])[0] = 5;
    (g as unknown as number[])[1] = 5;
    const c = computeGridConflicts(g);
    expect(c.has(0)).toBe(true);
    expect(c.has(1)).toBe(true);
  });

  test('column duplicates are conflicts', () => {
    const g = makeGrid();
    (g as unknown as number[])[0] = 7;
    (g as unknown as number[])[9] = 7;
    const c = computeGridConflicts(g);
    expect(c.has(0)).toBe(true);
    expect(c.has(9)).toBe(true);
  });

  test('box duplicates are conflicts', () => {
    const g = makeGrid();
    (g as unknown as number[])[0] = 9; // row0 col0
    (g as unknown as number[])[10] = 9; // row1 col1 (same box)
    const c = computeGridConflicts(g);
    expect(c.has(0)).toBe(true);
    expect(c.has(10)).toBe(true);
  });

  test('different values in same unit are not conflicts', () => {
    const g = makeGrid();
    (g as unknown as number[])[0] = 1;
    (g as unknown as number[])[1] = 2;
    (g as unknown as number[])[9] = 3;
    expect(computeGridConflicts(g).size).toBe(0);
  });
});



