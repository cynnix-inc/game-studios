export function makeDailyPuzzleKey(utcDate: string): string {
  // Intentionally lightweight validation; full validation belongs at boundaries.
  return `daily:${utcDate}`;
}

export function makeFreePuzzleKey(difficulty: string, puzzleId: string): string {
  return `free:${difficulty}:${puzzleId}`;
}


