import { create } from 'zustand';

import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import {
  createRunTimer,
  computeScoreMs,
  foldMovesToState,
  generate,
  getRunTimerElapsedMs,
  nowUtcDateKey,
  parseGrid,
  pauseRunTimer,
  resumeRunTimer,
  serializeGrid,
  type CellValue,
  type Difficulty,
  type Grid,
  type HintType,
  type RunTimer,
  type SudokuMove,
} from '@cynnix-studios/sudoku-core';

import { loadDailyByDateKey, type DailyLoadUnavailable } from '../services/daily';
import { freePlayPacksService } from '../services/freeplayPacks';
import { trackEvent } from '../services/telemetry';

type SudokuState = {
  profile: PlayerProfile | null;
  guestEnabled: boolean;

  deviceId: string | null;
  revision: number;
  moves: SudokuMove[];

  // Input + derived state (Epic 1: notes mode + undo/redo)
  notesMode: boolean;
  notes: Array<Set<number>>;
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  puzzleSyncStatus: 'idle' | 'syncing' | 'ok' | 'error';
  puzzleLastSyncAtMs: number | null;
  puzzleLastSyncError: string | null;

  mode: 'free' | 'daily';
  dailyDateKey: string | null;
  dailyLoad: { status: 'idle' | 'loading' | 'ready' | 'unavailable'; reason?: DailyLoadUnavailable['reason'] };
  dailySource: 'remote' | 'cache' | null;

  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  givensMask: boolean[];
  selectedIndex: number | null;
  mistakes: number;
  hintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
  runTimer: RunTimer;
  runStatus: 'running' | 'paused' | 'completed';
  completedAtMs: number | null;
  completionClientSubmissionId: string | null;

  setDeviceId: (deviceId: string) => void;
  setProfile: (p: PlayerProfile | null) => void;
  continueAsGuest: () => void;
  newPuzzle: (difficulty?: Difficulty) => void;
  loadTodayDaily: () => Promise<void>;
  loadDaily: (dateKey: string) => Promise<void>;
  exitDailyToFreePlay: () => void;

  selectCell: (i: number) => void;
  inputDigit: (d: CellValue) => void;
  clearCell: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  redo: () => void;
  hintRevealCellValue: () => void;
  pauseRun: (nowMs?: number) => void;
  resumeRun: (nowMs?: number) => void;
  markCompleted: (args: { clientSubmissionId: string; completedAtMs?: number; nowMs?: number }) => void;

  hydrateFromSave: (
    serializedPuzzle: string,
    serializedSolution: string,
    givensMask: boolean[],
    meta?: {
      deviceId?: string;
      revision?: number;
      moves?: SudokuMove[];
      undoStack?: UndoAction[];
      redoStack?: UndoAction[];
      mistakes?: number;
      runTimer?: RunTimer;
      startedAtMs?: number;
      hintsUsedCount?: number;
      hintBreakdown?: Partial<Record<HintType, number>>;
      runStatus?: 'running' | 'paused' | 'completed';
    },
  ) => void;

  restoreDailyProgressFromSave: (args: {
    dailyDateKey: string;
    serializedPuzzle: string;
    givensMask: boolean[];
    mistakes: number;
    hintsUsedCount: number;
    hintBreakdown: Partial<Record<HintType, number>>;
    runTimer: RunTimer;
    runStatus: 'running' | 'paused' | 'completed';
    revision?: number;
    moves?: SudokuMove[];
    undoStack?: UndoAction[];
    redoStack?: UndoAction[];
  }) => void;

  getSavePayload: () =>
    | {
        v: 1;
        mode: 'free';
        deviceId: string | null;
        revision: number;
        moves: SudokuMove[];
        undoStack: UndoAction[];
        redoStack: UndoAction[];
        serializedPuzzle: string;
        serializedSolution: string;
        givensMask: boolean[];
        mistakes: number;
        hintsUsedCount: number;
        hintBreakdown: Partial<Record<HintType, number>>;
        runTimer: RunTimer;
        runStatus: 'running' | 'paused' | 'completed';
        difficulty: Difficulty;
      }
    | {
        v: 1;
        mode: 'daily';
        deviceId: string | null;
        revision: number;
        moves: SudokuMove[];
        undoStack: UndoAction[];
        redoStack: UndoAction[];
        dailyDateKey: string;
        serializedPuzzle: string;
        givensMask: boolean[];
        mistakes: number;
        hintsUsedCount: number;
        hintBreakdown: Partial<Record<HintType, number>>;
        runTimer: RunTimer;
        runStatus: 'running' | 'paused' | 'completed';
      }
    | null;
};

const GAME_KEY = 'sudoku';

export type UndoAction =
  | { kind: 'cell'; cell: number; prev: number; next: number }
  | { kind: 'note'; cell: number; digit: number; prevHad: boolean; nextHad: boolean };

function emptyNotes(): Array<Set<number>> {
  return Array.from({ length: 81 }, () => new Set<number>());
}

function clampCellIndex(i: number): number {
  return Math.max(0, Math.min(80, i));
}

function clampDigit(v: number): number {
  return Math.max(1, Math.min(9, Math.floor(v)));
}

function newGuestId() {
  return `guest_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const initial = generate('easy', { seed: 1337 });

export const usePlayerStore = create<SudokuState>((set, get) => ({
  profile: null,
  guestEnabled: false,

  deviceId: null,
  revision: 0,
  moves: [],

  notesMode: false,
  notes: emptyNotes(),
  undoStack: [],
  redoStack: [],

  puzzleSyncStatus: 'idle',
  puzzleLastSyncAtMs: null,
  puzzleLastSyncError: null,

  mode: 'free',
  dailyDateKey: null,
  dailyLoad: { status: 'idle' },
  dailySource: null,

  difficulty: 'easy',
  puzzle: initial.puzzle,
  solution: initial.solution,
  givensMask: [...initial.givensMask],
  selectedIndex: null,
  mistakes: 0,
  hintsUsedCount: 0,
  hintBreakdown: {},
  runTimer: createRunTimer(Date.now()),
  runStatus: 'running',
  completedAtMs: null,
  completionClientSubmissionId: null,

  setDeviceId: (deviceId) => set({ deviceId }),
  setProfile: (p) => set({ profile: p, guestEnabled: p?.mode === 'guest' }),

  continueAsGuest: () =>
    set({
      profile: { mode: 'guest', guestId: newGuestId(), displayName: 'Guest' },
      guestEnabled: true,
    }),

  newPuzzle: (difficulty = get().difficulty) => {
    const pick = freePlayPacksService.getPuzzleSync(difficulty);
    const givensMask = pick.puzzle.map((v) => v !== 0);
    const nowMs = Date.now();
    set({
      mode: 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      revision: 0,
      moves: [],
      notesMode: false,
      notes: emptyNotes(),
      undoStack: [],
      redoStack: [],
      difficulty,
      puzzle: pick.puzzle as unknown as Grid,
      solution: pick.solution as unknown as Grid,
      givensMask,
      selectedIndex: null,
      mistakes: 0,
      hintsUsedCount: 0,
      hintBreakdown: {},
      runTimer: createRunTimer(nowMs),
      runStatus: 'running',
      completedAtMs: null,
      completionClientSubmissionId: null,
    });
  },

  loadTodayDaily: async () => {
    const key = nowUtcDateKey(Date.now());
    await get().loadDaily(key);
  },

  loadDaily: async (dateKey) => {
    set({ dailyLoad: { status: 'loading' }, dailySource: null });
    const res = await loadDailyByDateKey(dateKey);
    if (!res.ok) {
      set({ mode: 'daily', dailyDateKey: dateKey, dailyLoad: { status: 'unavailable', reason: res.reason }, dailySource: null });
      return;
    }

    const givensMask = res.payload.puzzle.map((v) => v !== 0);
    const nowMs = Date.now();
    set({
      mode: 'daily',
      dailyDateKey: res.payload.date_key,
      dailyLoad: { status: 'ready' },
      dailySource: res.source,
      revision: 0,
      moves: [],
      notesMode: false,
      notes: emptyNotes(),
      undoStack: [],
      redoStack: [],
      difficulty: res.payload.difficulty,
      puzzle: res.payload.puzzle as unknown as Grid,
      solution: res.payload.solution as unknown as Grid,
      givensMask,
      selectedIndex: null,
      mistakes: 0,
      hintsUsedCount: 0,
      hintBreakdown: {},
      runTimer: createRunTimer(nowMs),
      runStatus: 'running',
      completedAtMs: null,
      completionClientSubmissionId: null,
    });

    void trackEvent({ name: 'start_daily', props: { utc_date: res.payload.date_key } });
  },

  exitDailyToFreePlay: () => set({ mode: 'free', dailyDateKey: null, dailyLoad: { status: 'idle' }, dailySource: null }),

  selectCell: (i) => set({ selectedIndex: i }),

  inputDigit: (d) => {
    const { selectedIndex, puzzle, givensMask, solution, mistakes, deviceId, revision, moves, notesMode, notes, undoStack, runStatus } = get();
    if (runStatus === 'completed') return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;

    const cell = clampCellIndex(selectedIndex);
    const digit = clampDigit(d);
    const ts = Date.now();

    // Notes mode: toggle note for this cell without changing puzzle value.
    if (notesMode) {
      const setForCell = notes[cell] ?? new Set<number>();
      const prevHad = setForCell.has(digit);
      const nextHad = !prevHad;
      const nextNotes = notes.slice();
      const nextSet = new Set<number>(setForCell);
      if (nextHad) nextSet.add(digit);
      else nextSet.delete(digit);
      nextNotes[cell] = nextSet;

      const nextMoves: SudokuMove[] = deviceId
        ? [
            ...moves,
            {
              schemaVersion: 1,
              device_id: deviceId,
              rev: revision + 1,
              ts,
              kind: nextHad ? 'note_add' : 'note_remove',
              cell,
              value: digit,
            },
          ]
        : moves;

      set({
        notes: nextNotes,
        moves: nextMoves,
        revision: deviceId ? revision + 1 : revision,
        undoStack: [...undoStack, { kind: 'note', cell, digit, prevHad, nextHad }],
        redoStack: [],
      });
      return;
    }

    // Value mode: set cell value and (if incorrect) increment mistakes.
    const prev = puzzle[cell] ?? 0;
    if (prev === digit) return;
    const nextPuzzle = puzzle.slice() as number[];
    nextPuzzle[cell] = digit;
    const correct = solution[cell] === digit;

    const nextMoves: SudokuMove[] = deviceId
      ? [
          ...moves,
          { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'set', cell, value: digit },
          ...(correct ? [] : [{ schemaVersion: 1, device_id: deviceId, rev: revision + 2, ts, kind: 'mistake' } as const]),
        ]
      : moves;

    set({
      puzzle: nextPuzzle as unknown as Grid,
      mistakes: correct ? mistakes : mistakes + 1,
      revision: deviceId ? revision + (correct ? 1 : 2) : revision,
      moves: nextMoves,
      undoStack: [...undoStack, { kind: 'cell', cell, prev, next: digit }],
      redoStack: [],
    });
  },

  clearCell: () => {
    const { selectedIndex, puzzle, givensMask, deviceId, revision, moves, undoStack, runStatus } = get();
    if (runStatus === 'completed') return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;
    const cell = clampCellIndex(selectedIndex);
    const prev = puzzle[cell] ?? 0;
    if (prev === 0) return;
    const next = puzzle.slice() as number[];
    next[cell] = 0;
    const ts = Date.now();
    const nextMoves: SudokuMove[] = deviceId
      ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'clear', cell }]
      : moves;
    set({
      puzzle: next as unknown as Grid,
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
      undoStack: [...undoStack, { kind: 'cell', cell, prev, next: 0 }],
      redoStack: [],
    });
  },

  toggleNotesMode: () => {
    const { runStatus } = get();
    if (runStatus === 'completed') return;
    set((s) => ({ notesMode: !s.notesMode }));
  },

  undo: () => {
    const { undoStack, redoStack, deviceId, revision, moves, puzzle, notes, runStatus } = get();
    if (runStatus === 'completed') return;
    const last = undoStack[undoStack.length - 1];
    if (!last) return;

    const remainingUndo = undoStack.slice(0, -1);
    const ts = Date.now();

    if (last.kind === 'cell') {
      const cell = clampCellIndex(last.cell);
      const prevValue = last.prev;
      const nextPuzzle = puzzle.slice() as number[];
      nextPuzzle[cell] = prevValue;

      const nextMoves: SudokuMove[] = deviceId
        ? [
            ...moves,
            prevValue === 0
              ? { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'clear', cell }
              : { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'set', cell, value: prevValue },
          ]
        : moves;

      set({
        puzzle: nextPuzzle as unknown as Grid,
        moves: nextMoves,
        revision: deviceId ? revision + 1 : revision,
        undoStack: remainingUndo,
        redoStack: [...redoStack, last],
      });
      return;
    }

    const cell = clampCellIndex(last.cell);
    const digit = clampDigit(last.digit);
    const setForCell = notes[cell] ?? new Set<number>();
    const nextNotes = notes.slice();
    const nextSet = new Set<number>(setForCell);
    if (last.prevHad) nextSet.add(digit);
    else nextSet.delete(digit);
    nextNotes[cell] = nextSet;

    const nextMoves: SudokuMove[] = deviceId
      ? [
          ...moves,
          {
            schemaVersion: 1,
            device_id: deviceId,
            rev: revision + 1,
            ts,
            kind: last.prevHad ? 'note_add' : 'note_remove',
            cell,
            value: digit,
          },
        ]
      : moves;

    set({
      notes: nextNotes,
      moves: nextMoves,
      revision: deviceId ? revision + 1 : revision,
      undoStack: remainingUndo,
      redoStack: [...redoStack, last],
    });
  },

  redo: () => {
    const { undoStack, redoStack, deviceId, revision, moves, puzzle, notes, runStatus } = get();
    if (runStatus === 'completed') return;
    const last = redoStack[redoStack.length - 1];
    if (!last) return;

    const remainingRedo = redoStack.slice(0, -1);
    const ts = Date.now();

    if (last.kind === 'cell') {
      const cell = clampCellIndex(last.cell);
      const nextValue = last.next;
      const nextPuzzle = puzzle.slice() as number[];
      nextPuzzle[cell] = nextValue;

      const nextMoves: SudokuMove[] = deviceId
        ? [
            ...moves,
            nextValue === 0
              ? { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'clear', cell }
              : { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'set', cell, value: nextValue },
          ]
        : moves;

      set({
        puzzle: nextPuzzle as unknown as Grid,
        moves: nextMoves,
        revision: deviceId ? revision + 1 : revision,
        undoStack: [...undoStack, last],
        redoStack: remainingRedo,
      });
      return;
    }

    const cell = clampCellIndex(last.cell);
    const digit = clampDigit(last.digit);
    const setForCell = notes[cell] ?? new Set<number>();
    const nextNotes = notes.slice();
    const nextSet = new Set<number>(setForCell);
    if (last.nextHad) nextSet.add(digit);
    else nextSet.delete(digit);
    nextNotes[cell] = nextSet;

    const nextMoves: SudokuMove[] = deviceId
      ? [
          ...moves,
          {
            schemaVersion: 1,
            device_id: deviceId,
            rev: revision + 1,
            ts,
            kind: last.nextHad ? 'note_add' : 'note_remove',
            cell,
            value: digit,
          },
        ]
      : moves;

    set({
      notes: nextNotes,
      moves: nextMoves,
      revision: deviceId ? revision + 1 : revision,
      undoStack: [...undoStack, last],
      redoStack: remainingRedo,
    });
  },

  hintRevealCellValue: () => {
    const { selectedIndex, puzzle, givensMask, solution, hintBreakdown, hintsUsedCount, deviceId, revision, moves, runStatus } = get();
    if (runStatus === 'completed') return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;

    const correctValue = solution[selectedIndex];
    if (correctValue == null) return;
    if (correctValue === 0) return;

    // If already correct, don't count the hint again.
    const existingValue = puzzle[selectedIndex];
    if (existingValue != null && existingValue === correctValue) return;

    const next = puzzle.slice() as number[];
    next[selectedIndex] = correctValue;

    const nextBreakdown: Partial<Record<HintType, number>> = { ...hintBreakdown };
    nextBreakdown.reveal_cell_value = (nextBreakdown.reveal_cell_value ?? 0) + 1;

    const ts = Date.now();
    const nextMoves: SudokuMove[] = deviceId
      ? [
          ...moves,
          { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'set', cell: selectedIndex, value: correctValue },
          { schemaVersion: 1, device_id: deviceId, rev: revision + 2, ts, kind: 'hint', hintType: 'reveal_cell_value' },
        ]
      : moves;

    set({
      puzzle: next as unknown as Grid,
      hintsUsedCount: hintsUsedCount + 1,
      hintBreakdown: nextBreakdown,
      revision: deviceId ? revision + 2 : revision,
      moves: nextMoves,
    });

    void trackEvent({ name: 'hint_used', props: { type: 'reveal_cell_value' } });
  },

  pauseRun: (nowMs) => {
    const { runTimer, runStatus, deviceId, revision, moves } = get();
    if (runStatus === 'completed') return;
    const ts = nowMs ?? Date.now();
    const nextMoves: SudokuMove[] = deviceId ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'pause' }] : moves;
    set({
      runTimer: pauseRunTimer(runTimer, ts),
      runStatus: 'paused',
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
    });
  },

  resumeRun: (nowMs) => {
    const { runTimer, runStatus, deviceId, revision, moves } = get();
    if (runStatus === 'completed') return;
    const ts = nowMs ?? Date.now();
    const nextMoves: SudokuMove[] = deviceId ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'resume' }] : moves;
    set({
      runTimer: resumeRunTimer(runTimer, ts),
      runStatus: 'running',
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
    });
  },

  markCompleted: ({ clientSubmissionId, completedAtMs, nowMs }) => {
    const { runTimer, runStatus, deviceId, revision, moves, mode, difficulty, mistakes, hintsUsedCount, hintBreakdown, dailyDateKey } = get();
    if (runStatus === 'completed') return;
    const ts = completedAtMs ?? nowMs ?? Date.now();
    const nextMoves: SudokuMove[] = deviceId
      ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'complete', clientSubmissionId }]
      : moves;
    set({
      runTimer: pauseRunTimer(runTimer, nowMs ?? ts),
      runStatus: 'completed',
      completedAtMs: ts,
      completionClientSubmissionId: clientSubmissionId,
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
    });

    // Telemetry: emit completion with ranked=null for Daily (resolved later after submit-score),
    // and ranked=false for Free Play.
    const rawTimeMs = getRunTimerElapsedMs(runTimer, nowMs ?? ts);
    const scoreMs = computeScoreMs({ raw_time_ms: rawTimeMs, mistakes_count: mistakes, hint_breakdown: hintBreakdown });
    void trackEvent({
      name: 'complete_puzzle',
      props: {
        mode,
        difficulty,
        raw_time_ms: rawTimeMs,
        mistakes_count: mistakes,
        hints_used_count: hintsUsedCount,
        score_ms: scoreMs,
        ranked: mode === 'daily' ? null : false,
        correlation_id: clientSubmissionId,
        ...(mode === 'daily' && dailyDateKey ? { utc_date: dailyDateKey } : {}),
      },
    });
  },

  hydrateFromSave: (serializedPuzzle, serializedSolution, givensMask, meta) => {
    const nowMs = Date.now();
    const baseMoves = meta?.moves ?? [];
    const folded =
      baseMoves.length > 0
        ? foldMovesToState({ startedAtMs: meta?.startedAtMs ?? nowMs, puzzle: parseGrid(serializedPuzzle) }, baseMoves)
        : null;
    set({
      mode: 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      deviceId: meta?.deviceId ?? null,
      revision: meta?.revision ?? 0,
      moves: baseMoves,
      puzzle: (folded?.puzzle ?? parseGrid(serializedPuzzle)) as unknown as Grid,
      notes: folded?.notes ?? emptyNotes(),
      notesMode: false,
      undoStack: meta?.undoStack ?? [],
      redoStack: meta?.redoStack ?? [],
      solution: parseGrid(serializedSolution),
      givensMask: [...givensMask],
      mistakes: folded?.mistakesCount ?? meta?.mistakes ?? 0,
      hintsUsedCount: folded?.hintsUsedCount ?? meta?.hintsUsedCount ?? 0,
      hintBreakdown: folded?.hintBreakdown ?? meta?.hintBreakdown ?? {},
      runTimer: folded?.runTimer ?? meta?.runTimer ?? createRunTimer(meta?.startedAtMs ?? nowMs),
      runStatus: folded?.runStatus ?? meta?.runStatus ?? 'running',
      completedAtMs: null,
      completionClientSubmissionId: null,
      selectedIndex: null,
    });
  },

  restoreDailyProgressFromSave: ({
    dailyDateKey,
    serializedPuzzle,
    givensMask,
    mistakes,
    hintsUsedCount,
    hintBreakdown,
    runTimer,
    runStatus,
    revision,
    moves,
    undoStack,
    redoStack,
  }) => {
    // Important: Daily resume should require online payload fetch. So we only
    // restore player progress after the Daily payload (including solution) is loaded.
    const { mode, dailyLoad: dl, dailyDateKey: currentKey } = get();
    if (mode !== 'daily') return;
    if (dl.status !== 'ready') return;
    if (!currentKey || currentKey !== dailyDateKey) return;

    const parsedPuzzle = parseGrid(serializedPuzzle) as unknown as number[];
    const base = parsedPuzzle.slice();
    for (let i = 0; i < 81; i++) {
      if (!givensMask[i]) base[i] = 0;
    }
    const folded = moves && moves.length > 0 ? foldMovesToState({ startedAtMs: runTimer.startedAtMs, puzzle: base }, moves) : null;

    set({
      puzzle: (folded?.puzzle ?? parsedPuzzle) as unknown as Grid,
      givensMask: [...givensMask],
      mistakes,
      hintsUsedCount,
      hintBreakdown,
      runTimer,
      runStatus,
      revision: revision ?? get().revision,
      moves: moves ?? get().moves,
      notes: folded?.notes ?? get().notes,
      notesMode: false,
      undoStack: undoStack ?? [],
      redoStack: redoStack ?? [],
      completedAtMs: null,
      completionClientSubmissionId: null,
      selectedIndex: null,
    });
  },

  getSavePayload: () => {
    const { mode, dailyDateKey, puzzle, solution, givensMask, mistakes, hintsUsedCount, hintBreakdown, runTimer, runStatus, difficulty, deviceId, revision, moves, undoStack, redoStack } =
      get();

    if (mode === 'daily') {
      if (!dailyDateKey) return null;
      return {
        v: 1,
        mode: 'daily',
        deviceId,
        revision,
        moves,
        undoStack,
        redoStack,
        dailyDateKey,
        serializedPuzzle: serializeGrid(puzzle),
        givensMask: [...givensMask],
        mistakes,
        hintsUsedCount,
        hintBreakdown,
        runTimer,
        runStatus,
      };
    }

    return {
      v: 1,
      mode: 'free',
      deviceId,
      revision,
      moves,
      undoStack,
      redoStack,
      serializedPuzzle: serializeGrid(puzzle),
      serializedSolution: serializeGrid(solution),
      givensMask: [...givensMask],
      mistakes,
      hintsUsedCount,
      hintBreakdown,
      runTimer,
      runStatus,
      difficulty,
    };
  },
}));

export { GAME_KEY };


