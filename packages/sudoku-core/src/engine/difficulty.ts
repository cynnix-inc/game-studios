export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert', 'extreme'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export function givensForDifficulty(difficulty: Difficulty): number {
  // Note: these are "givens targets" for generation, not a strict difficulty rating.
  // We keep legacy values for easy/medium/hard and extend for expert/extreme.
  if (difficulty === 'easy') return 40;
  if (difficulty === 'medium') return 32;
  if (difficulty === 'hard') return 26;
  if (difficulty === 'expert') return 24;
  return 22;
}


