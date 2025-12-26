import { candidatesForCell } from '../src/engine/candidates';

describe('candidatesForCell', () => {
  test('returns empty for a filled cell', () => {
    const grid = Array.from({ length: 81 }, () => 0);
    grid[0] = 5;
    expect(candidatesForCell(grid, 0)).toEqual([]);
  });

  test('returns only the missing digit in a row/col/box constrained spot', () => {
    // Row 0 has 1..8, missing 9 at index 8.
    const grid = Array.from({ length: 81 }, () => 0);
    grid[0] = 1;
    grid[1] = 2;
    grid[2] = 3;
    grid[3] = 4;
    grid[4] = 5;
    grid[5] = 6;
    grid[6] = 7;
    grid[7] = 8;
    // col/box don't include 9 elsewhere

    expect(candidatesForCell(grid, 8)).toEqual([9]);
  });

  test('throws on invalid index', () => {
    const grid = Array.from({ length: 81 }, () => 0);
    expect(() => candidatesForCell(grid, -1)).toThrow(/out of range/i);
    expect(() => candidatesForCell(grid, 999)).toThrow(/out of range/i);
  });
});


