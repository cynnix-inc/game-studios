import { create } from 'zustand';

import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import { generate, serializeGrid, parseGrid, type Difficulty, type Grid, type CellValue } from '@cynnix-studios/sudoku-core';

type SudokuState = {
  profile: PlayerProfile | null;
  guestEnabled: boolean;

  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  givensMask: boolean[];
  selectedIndex: number | null;
  mistakes: number;
  startedAtMs: number;

  setProfile: (p: PlayerProfile | null) => void;
  continueAsGuest: () => void;
  newPuzzle: (difficulty?: Difficulty) => void;

  selectCell: (i: number) => void;
  inputDigit: (d: CellValue) => void;
  clearCell: () => void;

  hydrateFromSave: (serializedPuzzle: string, serializedSolution: string, givensMask: boolean[], meta?: { mistakes?: number; startedAtMs?: number }) => void;
  getSavePayload: () => {
    serializedPuzzle: string;
    serializedSolution: string;
    givensMask: boolean[];
    mistakes: number;
    startedAtMs: number;
    difficulty: Difficulty;
  };
};

const GAME_KEY = 'sudoku';

function newGuestId() {
  return `guest_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const initial = generate('easy', { seed: 1337 });

export const usePlayerStore = create<SudokuState>((set, get) => ({
  profile: null,
  guestEnabled: false,

  difficulty: 'easy',
  puzzle: initial.puzzle,
  solution: initial.solution,
  givensMask: [...initial.givensMask],
  selectedIndex: null,
  mistakes: 0,
  startedAtMs: Date.now(),

  setProfile: (p) => set({ profile: p, guestEnabled: p?.mode === 'guest' }),

  continueAsGuest: () =>
    set({
      profile: { mode: 'guest', guestId: newGuestId(), displayName: 'Guest' },
      guestEnabled: true,
    }),

  newPuzzle: (difficulty = get().difficulty) => {
    const gen = generate(difficulty);
    set({
      difficulty,
      puzzle: gen.puzzle,
      solution: gen.solution,
      givensMask: [...gen.givensMask],
      selectedIndex: null,
      mistakes: 0,
      startedAtMs: Date.now(),
    });
  },

  selectCell: (i) => set({ selectedIndex: i }),

  inputDigit: (d) => {
    const { selectedIndex, puzzle, givensMask, solution, mistakes } = get();
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;
    const next = puzzle.slice() as number[];
    next[selectedIndex] = d;
    const correct = solution[selectedIndex] === d;
    set({
      puzzle: next as unknown as Grid,
      mistakes: correct ? mistakes : mistakes + 1,
    });
  },

  clearCell: () => {
    const { selectedIndex, puzzle, givensMask } = get();
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;
    const next = puzzle.slice() as number[];
    next[selectedIndex] = 0;
    set({ puzzle: next as unknown as Grid });
  },

  hydrateFromSave: (serializedPuzzle, serializedSolution, givensMask, meta) => {
    set({
      puzzle: parseGrid(serializedPuzzle),
      solution: parseGrid(serializedSolution),
      givensMask: [...givensMask],
      mistakes: meta?.mistakes ?? 0,
      startedAtMs: meta?.startedAtMs ?? Date.now(),
      selectedIndex: null,
    });
  },

  getSavePayload: () => {
    const { puzzle, solution, givensMask, mistakes, startedAtMs, difficulty } = get();
    return {
      serializedPuzzle: serializeGrid(puzzle),
      serializedSolution: serializeGrid(solution),
      givensMask: [...givensMask],
      mistakes,
      startedAtMs,
      difficulty,
    };
  },
}));

export { GAME_KEY };


