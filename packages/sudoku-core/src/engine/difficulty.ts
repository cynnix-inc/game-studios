export type Difficulty = 'easy' | 'medium' | 'hard';

export function givensForDifficulty(difficulty: Difficulty): number {
  if (difficulty === 'easy') return 40;
  if (difficulty === 'medium') return 32;
  return 26;
}


