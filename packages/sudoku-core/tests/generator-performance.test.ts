import { DIFFICULTIES } from '../src/engine/difficulty';
import { generate } from '../src/engine/generator';

describe('generator performance', () => {
  it('generates puzzles quickly enough for interactive use (generous budget)', () => {
    // This is a coarse guardrail to prevent accidental performance regressions.
    // Keep budgets generous to avoid flakiness on slower machines/CI.
    for (const d of DIFFICULTIES) {
      const start = Date.now();
      generate(d, { seed: 20251221 });
      const elapsed = Date.now() - start;
      const budgetMs = d === 'extreme' ? 2500 : d === 'expert' ? 2000 : 1500;
      expect(elapsed).toBeLessThan(budgetMs);
    }
  });
});


