// Canonical difficulty IDs aligned to `docs/ultimate_sudoku_difficulty_contract_v1_0.md`.
export const DIFFICULTIES = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export function givensForDifficulty(difficulty: Difficulty): number {
  // Use the upper bound of each contract tier's clue target range.
  if (difficulty === 'novice') return 40;
  if (difficulty === 'skilled') return 34;
  if (difficulty === 'advanced') return 30;
  if (difficulty === 'expert') return 26;
  if (difficulty === 'fiendish') return 24;
  return 22; // ultimate
}


