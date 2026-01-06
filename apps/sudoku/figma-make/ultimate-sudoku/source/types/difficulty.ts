// Difficulty levels for Ultimate Sudoku
export type Difficulty = 'novice' | 'skilled' | 'advanced' | 'expert' | 'fiendish' | 'ultimate';

export const DIFFICULTIES: readonly Difficulty[] = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'] as const;
