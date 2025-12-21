import type { CellValue, Grid } from './grid';
import type { Difficulty } from './difficulty';
import type { GeneratedPuzzle } from './generator';
import { assertGrid } from './grid';

export type NotesMask = number; // bitmask for digits 1..9, range 0..511

export type HistoryEntry =
  | {
      kind: 'cell';
      i: number;
      prevValue: CellValue;
      nextValue: CellValue;
      prevNotes: NotesMask;
      nextNotes: NotesMask;
      prevMistakes: number;
      nextMistakes: number;
    };

export type PlayState = {
  difficulty: Difficulty;
  puzzle: Grid; // current values (0 = empty)
  solution: Grid;
  givensMask: ReadonlyArray<boolean>;

  notes: ReadonlyArray<NotesMask>; // length 81; 0 means none
  notesMode: boolean;

  selectedIndex: number | null;
  mistakes: number;
  startedAtMs: number;

  undoStack: ReadonlyArray<HistoryEntry>;
  redoStack: ReadonlyArray<HistoryEntry>;
};

const MAX_HISTORY = 500;
const ALL_NOTES_MASK = 0x1ff; // 9 bits

function bitForDigit(d: CellValue): number {
  return 1 << (d - 1);
}

export function notesHas(mask: NotesMask, d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): boolean {
  return (mask & bitForDigit(d)) !== 0;
}

export function notesToggle(mask: NotesMask, d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): NotesMask {
  return (mask ^ bitForDigit(d)) & ALL_NOTES_MASK;
}

export function notesToDigits(mask: NotesMask): Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> {
  const out: Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> = [];
  for (let d = 1; d <= 9; d++) {
    const dd = d as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    if (notesHas(mask, dd)) out.push(dd);
  }
  return out;
}

export function createFreePlayState(input: {
  difficulty: Difficulty;
  generated: GeneratedPuzzle;
  startedAtMs?: number;
}): PlayState {
  const { generated } = input;
  assertGrid(generated.puzzle);
  assertGrid(generated.solution);
  if (generated.givensMask.length !== 81) throw new Error('givensMask must be length 81');

  return {
    difficulty: input.difficulty,
    puzzle: generated.puzzle,
    solution: generated.solution,
    givensMask: [...generated.givensMask],
    notes: Array.from({ length: 81 }, () => 0),
    notesMode: false,
    selectedIndex: null,
    mistakes: 0,
    startedAtMs: input.startedAtMs ?? Date.now(),
    undoStack: [],
    redoStack: [],
  };
}

export function selectCell(state: PlayState, i: number): PlayState {
  if (i < 0 || i >= 81) return state;
  if (state.selectedIndex === i) return state;
  return { ...state, selectedIndex: i };
}

export function toggleNotesMode(state: PlayState): PlayState {
  return { ...state, notesMode: !state.notesMode };
}

function pushUndo(state: PlayState, entry: HistoryEntry): PlayState {
  const undo = [...state.undoStack, entry];
  const trimmed = undo.length > MAX_HISTORY ? undo.slice(undo.length - MAX_HISTORY) : undo;
  return { ...state, undoStack: trimmed, redoStack: [] };
}

export function canUndo(state: PlayState): boolean {
  return state.undoStack.length > 0;
}

export function canRedo(state: PlayState): boolean {
  return state.redoStack.length > 0;
}

export function inputDigit(state: PlayState, d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): PlayState {
  const i = state.selectedIndex;
  if (i == null) return state;
  if (state.givensMask[i]) return state;

  const prevValue = state.puzzle[i]!;
  const prevNotes = state.notes[i] ?? 0;

  if (state.notesMode) {
    const nextNotes = notesToggle(prevNotes, d);
    if (nextNotes === prevNotes) return state;
    const nextNotesArr = state.notes.slice() as NotesMask[];
    nextNotesArr[i] = nextNotes;
    const nextState = { ...state, notes: nextNotesArr };
    return pushUndo(nextState, {
      kind: 'cell',
      i,
      prevValue,
      nextValue: prevValue,
      prevNotes,
      nextNotes,
      prevMistakes: state.mistakes,
      nextMistakes: state.mistakes,
    });
  }

  const nextValue = d as CellValue;
  const solutionValue = state.solution[i]!;
  const nextMistakes = nextValue === solutionValue ? state.mistakes : state.mistakes + 1;

  if (prevValue === nextValue && prevNotes === 0) return state;

  const nextPuzzle = state.puzzle.slice() as CellValue[];
  nextPuzzle[i] = nextValue;

  const nextNotesArr = state.notes.slice() as NotesMask[];
  nextNotesArr[i] = 0;

  const nextState = {
    ...state,
    puzzle: nextPuzzle as unknown as Grid,
    notes: nextNotesArr,
    mistakes: nextMistakes,
  };

  return pushUndo(nextState, {
    kind: 'cell',
    i,
    prevValue,
    nextValue,
    prevNotes,
    nextNotes: 0,
    prevMistakes: state.mistakes,
    nextMistakes,
  });
}

export function clearCell(state: PlayState): PlayState {
  const i = state.selectedIndex;
  if (i == null) return state;
  if (state.givensMask[i]) return state;

  const prevValue = state.puzzle[i]!;
  const prevNotes = state.notes[i] ?? 0;
  if (prevValue === 0 && prevNotes === 0) return state;

  const nextPuzzle = state.puzzle.slice() as CellValue[];
  nextPuzzle[i] = 0;

  const nextNotesArr = state.notes.slice() as NotesMask[];
  nextNotesArr[i] = 0;

  const nextState = { ...state, puzzle: nextPuzzle as unknown as Grid, notes: nextNotesArr };

  return pushUndo(nextState, {
    kind: 'cell',
    i,
    prevValue,
    nextValue: 0,
    prevNotes,
    nextNotes: 0,
    prevMistakes: state.mistakes,
    nextMistakes: state.mistakes,
  });
}

export function undo(state: PlayState): PlayState {
  const last = state.undoStack[state.undoStack.length - 1];
  if (!last) return state;

  const undoStack = state.undoStack.slice(0, -1);
  const redoStack = [...state.redoStack, last];

  if (last.kind === 'cell') {
    const nextPuzzle = state.puzzle.slice() as CellValue[];
    nextPuzzle[last.i] = last.prevValue;

    const nextNotes = state.notes.slice() as NotesMask[];
    nextNotes[last.i] = last.prevNotes;

    return {
      ...state,
      puzzle: nextPuzzle as unknown as Grid,
      notes: nextNotes,
      mistakes: last.prevMistakes,
      undoStack,
      redoStack,
    };
  }

  return { ...state, undoStack, redoStack };
}

export function redo(state: PlayState): PlayState {
  const last = state.redoStack[state.redoStack.length - 1];
  if (!last) return state;

  const redoStack = state.redoStack.slice(0, -1);
  const undoStack = [...state.undoStack, last];

  if (last.kind === 'cell') {
    const nextPuzzle = state.puzzle.slice() as CellValue[];
    nextPuzzle[last.i] = last.nextValue;

    const nextNotes = state.notes.slice() as NotesMask[];
    nextNotes[last.i] = last.nextNotes;

    return {
      ...state,
      puzzle: nextPuzzle as unknown as Grid,
      notes: nextNotes,
      mistakes: last.nextMistakes,
      undoStack,
      redoStack,
    };
  }

  return { ...state, undoStack, redoStack };
}


