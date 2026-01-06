import { countSolutionsUpTo2 } from '../src/engine/uniqueness';

describe('uniqueness', () => {
  test('empty grid has multiple solutions (we only count up to 2)', () => {
    const empty = Array.from({ length: 81 }, () => 0);
    expect(countSolutionsUpTo2(empty)).toBe(2);
  });

  test('a known valid puzzle has exactly one solution', () => {
    // 0 = empty
    const puzzle = [
      5, 3, 0, 0, 7, 0, 0, 0, 0,
      6, 0, 0, 1, 9, 5, 0, 0, 0,
      0, 9, 8, 0, 0, 0, 0, 6, 0,
      8, 0, 0, 0, 6, 0, 0, 0, 3,
      4, 0, 0, 8, 0, 3, 0, 0, 1,
      7, 0, 0, 0, 2, 0, 0, 0, 6,
      0, 6, 0, 0, 0, 0, 2, 8, 0,
      0, 0, 0, 4, 1, 9, 0, 0, 5,
      0, 0, 0, 0, 8, 0, 0, 7, 9,
    ];

    expect(countSolutionsUpTo2(puzzle)).toBe(1);
  });
});


