import { assertGrid } from './grid';
import { solve } from './solver';
import { countSolutionsUpTo2 } from './uniqueness';

/**
 * Ensures a puzzle + solution pair meets our quality contract:
 * - puzzle and solution are 81-length grids
 * - solution contains only 1..9 (no zeros)
 * - all given cells in puzzle match solution
 * - solution grid is internally valid
 * - puzzle has exactly one solution
 *
 * Throws on any violation.
 */
export function assertPuzzleSolutionContract(puzzleIn: ReadonlyArray<number>, solutionIn: ReadonlyArray<number>): void {
  assertGrid(puzzleIn);
  assertGrid(solutionIn);

  for (let i = 0; i < 81; i++) {
    const v = solutionIn[i]!;
    if (v === 0) throw new Error('solution must not contain 0 values');
  }

  // Validate the solution has no conflicts.
  const solved = solve(solutionIn);
  if (!solved.ok) throw new Error('solution is not a valid solved grid');

  // Ensure all given puzzle values match the solution.
  for (let i = 0; i < 81; i++) {
    const p = puzzleIn[i]!;
    if (p !== 0 && p !== solutionIn[i]!) {
      throw new Error(`puzzle given at index ${i} does not match solution`);
    }
  }

  const count = countSolutionsUpTo2(puzzleIn);
  if (count !== 1) {
    throw new Error(`puzzle must have exactly one solution (got ${count})`);
  }
}


