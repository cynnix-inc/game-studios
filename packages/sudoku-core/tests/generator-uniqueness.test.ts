import { generate } from '../src/engine/generator';
import { DIFFICULTIES } from '../src/engine/difficulty';
import { countSolutions, solve } from '../src/engine/solver';

describe('generator uniqueness', () => {
  it('generates puzzles with a unique solution for representative seeds', () => {
    // Keep this small so unit tests stay fast, while still catching regressions.
    const seeds = [42, 1337];

    for (const difficulty of DIFFICULTIES) {
      for (const seed of seeds) {
        const { puzzle, solution, givensMask } = generate(difficulty, { seed });

        // Basic invariants
        expect(puzzle).toHaveLength(81);
        expect(solution).toHaveLength(81);
        expect(givensMask).toHaveLength(81);

        // Givens line up with solution and mask
        for (let i = 0; i < 81; i++) {
          const v = puzzle[i]!;
          if (v === 0) {
            expect(givensMask[i]).toBe(false);
          } else {
            expect(givensMask[i]).toBe(true);
            expect(v).toBe(solution[i]);
          }
        }

        // Solvable + unique
        const solved = solve(puzzle);
        expect(solved.ok).toBe(true);
        const solutions = countSolutions(puzzle, { limit: 2 });
        expect(solutions).toBe(1);
      }
    }
  });
});


