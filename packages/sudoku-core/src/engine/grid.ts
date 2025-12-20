export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Grid = ReadonlyArray<CellValue>; // length 81

export function assertGrid(grid: ReadonlyArray<number>): asserts grid is Grid {
  if (grid.length !== 81) throw new Error('Grid must have length 81');
  for (const v of grid) {
    if (!Number.isInteger(v) || v < 0 || v > 9) throw new Error('Grid values must be integers 0..9');
  }
}

export function emptyGrid(): Grid {
  return Array.from({ length: 81 }, () => 0 as CellValue);
}

export function idx(r: number, c: number) {
  return r * 9 + c;
}

export function getCell(grid: Grid, r: number, c: number): CellValue {
  const i = idx(r, c);
  const v = grid[i];
  if (v == null) throw new Error(`Grid index out of range: ${i}`);
  return v;
}

export function setCell(grid: Grid, r: number, c: number, value: CellValue): Grid {
  const copy = grid.slice() as CellValue[];
  const i = idx(r, c);
  if (i < 0 || i >= 81) throw new Error(`Grid index out of range: ${i}`);
  copy[i] = value;
  return copy;
}

export function rowOf(i: number) {
  return Math.floor(i / 9);
}

export function colOf(i: number) {
  return i % 9;
}

export function boxOf(r: number, c: number) {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}


