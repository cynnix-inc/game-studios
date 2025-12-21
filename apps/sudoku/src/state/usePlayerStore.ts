import { create } from 'zustand';

import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import {
  DIFFICULTIES,
  generate,
  serializeGrid,
  parseGrid,
  createFreePlayState,
  selectCell as coreSelectCell,
  inputDigit as coreInputDigit,
  clearCell as coreClearCell,
  toggleNotesMode as coreToggleNotesMode,
  undo as coreUndo,
  redo as coreRedo,
  type Difficulty,
  type Grid,
  type CellValue,
  type NotesMask,
  type HistoryEntry,
} from '@cynnix-studios/sudoku-core';

type SudokuState = {
  profile: PlayerProfile | null;
  guestEnabled: boolean;

  // Free Play state
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  givensMask: boolean[];
  notes: NotesMask[];
  notesMode: boolean;
  selectedIndex: number | null;
  mistakes: number;
  startedAtMs: number;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  setProfile: (p: PlayerProfile | null) => void;
  continueAsGuest: () => void;
  newPuzzle: (difficulty?: Difficulty) => void;

  selectCell: (i: number) => void;
  inputDigit: (d: CellValue) => void;
  clearCell: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  redo: () => void;

  hydrateFromSave: (data: {
    difficulty?: Difficulty;
    serializedPuzzle: string;
    serializedSolution: string;
    givensMask: boolean[];
    notes?: number[];
    notesMode?: boolean;
    undoStack?: HistoryEntry[];
    redoStack?: HistoryEntry[];
    mistakes?: number;
    startedAtMs?: number;
  }) => void;
  getSavePayload: () => {
    schemaVersion: 2;
    serializedPuzzle: string;
    serializedSolution: string;
    givensMask: boolean[];
    notes: number[];
    notesMode: boolean;
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    mistakes: number;
    startedAtMs: number;
    difficulty: Difficulty;
  };
};

const GAME_KEY = 'sudoku';

function newGuestId() {
  return `guest_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const initialGen = generate('easy', { seed: 1337 });
const initial = createFreePlayState({ difficulty: 'easy', generated: initialGen, startedAtMs: Date.now() });

export const usePlayerStore = create<SudokuState>((set, get) => ({
  profile: null,
  guestEnabled: false,

  difficulty: initial.difficulty,
  puzzle: initial.puzzle,
  solution: initial.solution,
  givensMask: [...initial.givensMask],
  notes: [...initial.notes],
  notesMode: initial.notesMode,
  selectedIndex: initial.selectedIndex,
  mistakes: initial.mistakes,
  startedAtMs: initial.startedAtMs,
  undoStack: [...initial.undoStack],
  redoStack: [...initial.redoStack],

  setProfile: (p) => set({ profile: p, guestEnabled: p?.mode === 'guest' }),

  continueAsGuest: () =>
    set({
      profile: { mode: 'guest', guestId: newGuestId(), displayName: 'Guest' },
      guestEnabled: true,
    }),

  newPuzzle: (difficulty = get().difficulty) => {
    const gen = generate(difficulty);
    const next = createFreePlayState({ difficulty, generated: gen, startedAtMs: Date.now() });
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [], redoStack: [] });
  },

  selectCell: (i) => {
    const s = get();
    const next = coreSelectCell(
      {
        difficulty: s.difficulty,
        puzzle: s.puzzle,
        solution: s.solution,
        givensMask: s.givensMask,
        notes: s.notes,
        notesMode: s.notesMode,
        selectedIndex: s.selectedIndex,
        mistakes: s.mistakes,
        startedAtMs: s.startedAtMs,
        undoStack: s.undoStack,
        redoStack: s.redoStack,
      },
      i,
    );
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  inputDigit: (d) => {
    if (d === 0) return;
    const s = get();
    const digit = d as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const next = coreInputDigit(
      {
        difficulty: s.difficulty,
        puzzle: s.puzzle,
        solution: s.solution,
        givensMask: s.givensMask,
        notes: s.notes,
        notesMode: s.notesMode,
        selectedIndex: s.selectedIndex,
        mistakes: s.mistakes,
        startedAtMs: s.startedAtMs,
        undoStack: s.undoStack,
        redoStack: s.redoStack,
      },
      digit,
    );
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  clearCell: () => {
    const s = get();
    const next = coreClearCell({
      difficulty: s.difficulty,
      puzzle: s.puzzle,
      solution: s.solution,
      givensMask: s.givensMask,
      notes: s.notes,
      notesMode: s.notesMode,
      selectedIndex: s.selectedIndex,
      mistakes: s.mistakes,
      startedAtMs: s.startedAtMs,
      undoStack: s.undoStack,
      redoStack: s.redoStack,
    });
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  toggleNotesMode: () => {
    const s = get();
    const next = coreToggleNotesMode({
      difficulty: s.difficulty,
      puzzle: s.puzzle,
      solution: s.solution,
      givensMask: s.givensMask,
      notes: s.notes,
      notesMode: s.notesMode,
      selectedIndex: s.selectedIndex,
      mistakes: s.mistakes,
      startedAtMs: s.startedAtMs,
      undoStack: s.undoStack,
      redoStack: s.redoStack,
    });
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  undo: () => {
    const s = get();
    const next = coreUndo({
      difficulty: s.difficulty,
      puzzle: s.puzzle,
      solution: s.solution,
      givensMask: s.givensMask,
      notes: s.notes,
      notesMode: s.notesMode,
      selectedIndex: s.selectedIndex,
      mistakes: s.mistakes,
      startedAtMs: s.startedAtMs,
      undoStack: s.undoStack,
      redoStack: s.redoStack,
    });
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  redo: () => {
    const s = get();
    const next = coreRedo({
      difficulty: s.difficulty,
      puzzle: s.puzzle,
      solution: s.solution,
      givensMask: s.givensMask,
      notes: s.notes,
      notesMode: s.notesMode,
      selectedIndex: s.selectedIndex,
      mistakes: s.mistakes,
      startedAtMs: s.startedAtMs,
      undoStack: s.undoStack,
      redoStack: s.redoStack,
    });
    set({ ...next, givensMask: [...next.givensMask], notes: [...next.notes], undoStack: [...next.undoStack], redoStack: [...next.redoStack] });
  },

  hydrateFromSave: (data) => {
    const difficulty: Difficulty = data.difficulty && (DIFFICULTIES as readonly string[]).includes(data.difficulty) ? data.difficulty : 'easy';
    const notesRaw = Array.isArray(data.notes) && data.notes.length === 81 ? data.notes : Array.from({ length: 81 }, () => 0);
    set({
      difficulty,
      puzzle: parseGrid(data.serializedPuzzle),
      solution: parseGrid(data.serializedSolution),
      givensMask: [...data.givensMask],
      notes: notesRaw.map((n) => (typeof n === 'number' ? n : 0)) as NotesMask[],
      notesMode: !!data.notesMode,
      mistakes: data.mistakes ?? 0,
      startedAtMs: data.startedAtMs ?? Date.now(),
      selectedIndex: null,
      undoStack: Array.isArray(data.undoStack) ? data.undoStack : [],
      redoStack: Array.isArray(data.redoStack) ? data.redoStack : [],
    });
  },

  getSavePayload: () => {
    const { puzzle, solution, givensMask, notes, notesMode, undoStack, redoStack, mistakes, startedAtMs, difficulty } = get();
    return {
      schemaVersion: 2 as const,
      serializedPuzzle: serializeGrid(puzzle),
      serializedSolution: serializeGrid(solution),
      givensMask: [...givensMask],
      notes: [...notes],
      notesMode,
      undoStack: [...undoStack],
      redoStack: [...redoStack],
      mistakes,
      startedAtMs,
      difficulty,
    };
  },
}));

export { GAME_KEY };


