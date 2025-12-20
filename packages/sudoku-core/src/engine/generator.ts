import type { CellValue, Grid } from './grid';
import { assertGrid, emptyGrid } from './grid';
import { givensForDifficulty, type Difficulty } from './difficulty';
import { solve } from './solver';

export type GeneratedPuzzle = {
  puzzle: Grid; // 0 = empty
  solution: Grid;
  givensMask: ReadonlyArray<boolean>; // length 81, true where puzzle has fixed given
};

function shuffle<T>(arr: T[], rnd: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function generate(difficulty: Difficulty, opts?: { seed?: number }): GeneratedPuzzle {
  const seed = opts?.seed ?? Date.now();
  // xorshift32 RNG
  let s = seed >>> 0;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };

  // Step 1: get a full solved grid from an empty grid with randomized solve order
  const solved = solve(emptyGrid(), { random: true, seed });
  if (!solved.ok) {
    // extremely unlikely
    throw new Error('Failed to generate a solved grid');
  }

  const solution = solved.solution;
  assertGrid(solution);

  // Step 2: remove cells until we reach target givens count (no uniqueness enforcement yet)
  const targetGivens = givensForDifficulty(difficulty);
  const puzzleArr = solution.slice() as CellValue[];

  const indices = shuffle(Array.from({ length: 81 }, (_, i) => i), rnd);
  let removed = 0;
  const maxRemove = 81 - targetGivens;
  for (const i of indices) {
    if (removed >= maxRemove) break;
    const backup = puzzleArr[i]!;
    puzzleArr[i] = 0;

    // Ensure still solvable; we don't enforce uniqueness for v0.
    const check = solve(puzzleArr);
    if (!check.ok) {
      puzzleArr[i] = backup;
      continue;
    }
    removed++;
  }

  const puzzle = puzzleArr as unknown as Grid;
  const givensMask = puzzle.map((v) => v !== 0);
  return { puzzle, solution, givensMask };
}


