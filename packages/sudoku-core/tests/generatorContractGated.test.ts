import { generateContractGated } from '../src/engine/generator';
import { countSolutionsUpTo2 } from '../src/engine/uniqueness';
import { solveWithTechniquesSubset } from '../src/engine/techniqueSolver/subset';

describe('contract-gated generation', () => {
  test('generates a unique puzzle solvable by subset techniques (novice, seeded)', () => {
    const gen = generateContractGated('novice', { seed: 1234, maxAttempts: 5 });
    expect(gen.puzzle).toHaveLength(81);
    expect(gen.solution).toHaveLength(81);

    // Givens must match solution.
    for (let i = 0; i < 81; i++) {
      const v = gen.puzzle[i]!;
      if (v !== 0) expect(v).toBe(gen.solution[i]);
    }

    expect(countSolutionsUpTo2(gen.puzzle)).toBe(1);
    const solved = solveWithTechniquesSubset(gen.puzzle);
    expect(solved.ok).toBe(true);
  });
});


