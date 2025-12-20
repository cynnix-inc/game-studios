import type { CellValue, Grid } from './grid';
import { assertGrid } from './grid';

/**
 * Serialize grid into 81-char string:
 * - '1'..'9' for filled
 * - '.' for empty (0)
 */
export function serializeGrid(grid: ReadonlyArray<number>): string {
  assertGrid(grid);
  return grid
    .map((v) => (v === 0 ? '.' : String(v)))
    .join('');
}

export function parseGrid(text: string): Grid {
  if (text.length !== 81) throw new Error('Invalid grid string length');
  const arr: CellValue[] = [];
  for (const ch of text) {
    if (ch === '.') arr.push(0);
    else if (ch >= '1' && ch <= '9') arr.push(Number(ch) as CellValue);
    else throw new Error(`Invalid grid character: ${ch}`);
  }
  return arr as unknown as Grid;
}


