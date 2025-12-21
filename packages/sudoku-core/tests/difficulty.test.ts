import { DIFFICULTIES, givensForDifficulty } from '../src/engine/difficulty';

describe('difficulty', () => {
  it('exports the 5 MVP difficulty labels', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard', 'expert', 'extreme']);
  });

  it('maps difficulty to a givens target count', () => {
    const table = Object.fromEntries(DIFFICULTIES.map((d) => [d, givensForDifficulty(d)]));
    expect(table).toEqual({
      easy: 40,
      medium: 32,
      hard: 26,
      expert: 24,
      extreme: 22,
    });
  });
});


