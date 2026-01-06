import { assertPuzzleSolutionContract } from '../src/engine/puzzleContract';

const VALID_PUZZLE = [
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

const VALID_SOLUTION = [
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

describe('puzzle contract', () => {
  test('accepts a valid puzzle + solution pair', () => {
    expect(() => assertPuzzleSolutionContract(VALID_PUZZLE, VALID_SOLUTION)).not.toThrow();
  });

  test('rejects when a given does not match the solution', () => {
    const badPuzzle = VALID_PUZZLE.slice();
    badPuzzle[0] = 9;
    expect(() => assertPuzzleSolutionContract(badPuzzle, VALID_SOLUTION)).toThrow(/does not match/i);
  });

  test('rejects when the puzzle is not uniquely solvable (empty grid)', () => {
    const empty = Array.from({ length: 81 }, () => 0);
    expect(() => assertPuzzleSolutionContract(empty, VALID_SOLUTION)).toThrow(/exactly one solution/i);
  });
});



