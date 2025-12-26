import type { CellValue, Grid } from './grid';
import { assertGrid, boxOf, colOf, rowOf } from './grid';

export function candidatesForCell(gridIn: ReadonlyArray<number>, i: number): CellValue[] {
  assertGrid(gridIn);
  if (!Number.isInteger(i) || i < 0 || i >= 81) throw new Error(`Cell index out of range: ${i}`);

  const grid = gridIn as unknown as Grid;
  if (grid[i] !== 0) return [];

  const r = rowOf(i);
  const c = colOf(i);
  const b = boxOf(r, c);

  const used = new Set<number>();
  for (let j = 0; j < 81; j++) {
    const v = grid[j]!;
    if (v === 0) continue;
    const jr = rowOf(j);
    const jc = colOf(j);
    if (jr === r || jc === c || boxOf(jr, jc) === b) used.add(v);
  }

  const out: CellValue[] = [];
  for (let v = 1 as CellValue; v <= 9; v = (v + 1) as CellValue) {
    if (!used.has(v)) out.push(v);
  }
  return out;
}


