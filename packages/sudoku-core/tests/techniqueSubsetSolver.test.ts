import { solveWithTechniquesSubset } from '../src/engine/techniqueSolver/subset';

describe('technique subset solver', () => {
  test('solves a trivial puzzle using only subset techniques (full house)', () => {
    const solved = [
      5, 3, 4, 6, 7, 8, 9, 1, 2,
      6, 7, 2, 1, 9, 5, 3, 4, 8,
      1, 9, 8, 3, 4, 2, 5, 6, 7,
      8, 5, 9, 7, 6, 1, 4, 2, 3,
      4, 2, 6, 8, 5, 3, 7, 9, 1,
      7, 1, 3, 9, 2, 4, 8, 5, 6,
      9, 6, 1, 5, 3, 7, 2, 8, 4,
      2, 8, 7, 4, 1, 9, 6, 3, 5,
      3, 4, 5, 2, 8, 6, 1, 7, 9,
    ];
    const puzzle = solved.slice();
    puzzle[80] = 0;

    const res = solveWithTechniquesSubset(puzzle);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.solution).toEqual(solved);
    expect(res.log.length).toBeGreaterThan(0);
    expect(res.log[0]?.technique).toBe('FULL_HOUSE');
  });

  test('is deterministic (running twice yields identical logs)', () => {
    const puzzle = [
      5, 3, 4, 6, 7, 8, 9, 1, 2,
      6, 7, 2, 1, 9, 5, 3, 4, 8,
      1, 9, 8, 3, 4, 2, 5, 6, 7,
      8, 5, 9, 7, 6, 1, 4, 2, 3,
      4, 2, 6, 8, 5, 3, 7, 9, 1,
      7, 1, 3, 9, 2, 4, 8, 5, 6,
      9, 6, 1, 5, 3, 7, 2, 8, 4,
      2, 8, 7, 4, 1, 9, 6, 3, 5,
      3, 4, 5, 2, 8, 6, 1, 7, 0,
    ];

    const a = solveWithTechniquesSubset(puzzle);
    const b = solveWithTechniquesSubset(puzzle);
    expect(a).toEqual(b);
  });
});


