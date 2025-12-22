import { create } from 'zustand';

import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import {
  createRunTimer,
  generate,
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
} from '@cynnix-studios/sudoku-core';

import { loadDailyByDateKey, type DailyLoadUnavailable } from '../services/daily';

type SudokuState = {
  profile: PlayerProfile | null;
  guestEnabled: boolean;

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

  setProfile: (p: PlayerProfile | null) => void;
  continueAsGuest: () => void;
  newPuzzle: (difficulty?: Difficulty) => void;
  loadTodayDaily: () => Promise<void>;
  loadDaily: (dateKey: string) => Promise<void>;
  exitDailyToFreePlay: () => void;

  selectCell: (i: number) => void;
  inputDigit: (d: CellValue) => void;
  clearCell: () => void;
  hintRevealCellValue: () => void;
  pauseRun: (nowMs?: number) => void;
  resumeRun: (nowMs?: number) => void;
  markCompleted: (args: { clientSubmissionId: string; completedAtMs?: number; nowMs?: number }) => void;

  hydrateFromSave: (
    serializedPuzzle: string,
    serializedSolution: string,
    givensMask: boolean[],
    meta?: {
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
  }) => void;

  getSavePayload: () =>
    | {
        v: 1;
        mode: 'free';
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

function newGuestId() {
  return `guest_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const initial = generate('easy', { seed: 1337 });

export const usePlayerStore = create<SudokuState>((set, get) => ({
  profile: null,
  guestEnabled: false,

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

  setProfile: (p) => set({ profile: p, guestEnabled: p?.mode === 'guest' }),

  continueAsGuest: () =>
    set({
      profile: { mode: 'guest', guestId: newGuestId(), displayName: 'Guest' },
      guestEnabled: true,
    }),

  newPuzzle: (difficulty = get().difficulty) => {
    const gen = generate(difficulty);
    const nowMs = Date.now();
    set({
      mode: 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      difficulty,
      puzzle: gen.puzzle,
      solution: gen.solution,
      givensMask: [...gen.givensMask],
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
  },

  exitDailyToFreePlay: () => set({ mode: 'free', dailyDateKey: null, dailyLoad: { status: 'idle' }, dailySource: null }),

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

  hintRevealCellValue: () => {
    const { selectedIndex, puzzle, givensMask, solution, hintBreakdown, hintsUsedCount } = get();
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

    set({
      puzzle: next as unknown as Grid,
      hintsUsedCount: hintsUsedCount + 1,
      hintBreakdown: nextBreakdown,
    });
  },

  pauseRun: (nowMs) => {
    const { runTimer, runStatus } = get();
    if (runStatus === 'completed') return;
    set({
      runTimer: pauseRunTimer(runTimer, nowMs ?? Date.now()),
      runStatus: 'paused',
    });
  },

  resumeRun: (nowMs) => {
    const { runTimer, runStatus } = get();
    if (runStatus === 'completed') return;
    set({
      runTimer: resumeRunTimer(runTimer, nowMs ?? Date.now()),
      runStatus: 'running',
    });
  },

  markCompleted: ({ clientSubmissionId, completedAtMs, nowMs }) => {
    const { runTimer, runStatus } = get();
    if (runStatus === 'completed') return;
    const ts = completedAtMs ?? nowMs ?? Date.now();
    set({
      runTimer: pauseRunTimer(runTimer, nowMs ?? ts),
      runStatus: 'completed',
      completedAtMs: ts,
      completionClientSubmissionId: clientSubmissionId,
    });
  },

  hydrateFromSave: (serializedPuzzle, serializedSolution, givensMask, meta) => {
    const nowMs = Date.now();
    set({
      mode: 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      puzzle: parseGrid(serializedPuzzle),
      solution: parseGrid(serializedSolution),
      givensMask: [...givensMask],
      mistakes: meta?.mistakes ?? 0,
      hintsUsedCount: meta?.hintsUsedCount ?? 0,
      hintBreakdown: meta?.hintBreakdown ?? {},
      runTimer: meta?.runTimer ?? createRunTimer(meta?.startedAtMs ?? nowMs),
      runStatus: meta?.runStatus ?? 'running',
      completedAtMs: null,
      completionClientSubmissionId: null,
      selectedIndex: null,
    });
  },

  restoreDailyProgressFromSave: ({ dailyDateKey, serializedPuzzle, givensMask, mistakes, hintsUsedCount, hintBreakdown, runTimer, runStatus }) => {
    // Important: Daily resume should require online payload fetch. So we only
    // restore player progress after the Daily payload (including solution) is loaded.
    const { mode, dailyLoad: dl, dailyDateKey: currentKey } = get();
    if (mode !== 'daily') return;
    if (dl.status !== 'ready') return;
    if (!currentKey || currentKey !== dailyDateKey) return;

    set({
      puzzle: parseGrid(serializedPuzzle),
      givensMask: [...givensMask],
      mistakes,
      hintsUsedCount,
      hintBreakdown,
      runTimer,
      runStatus,
      completedAtMs: null,
      completionClientSubmissionId: null,
      selectedIndex: null,
    });
  },

  getSavePayload: () => {
    const { mode, dailyDateKey, puzzle, solution, givensMask, mistakes, hintsUsedCount, hintBreakdown, runTimer, runStatus, difficulty } = get();

    if (mode === 'daily') {
      if (!dailyDateKey) return null;
      return {
        v: 1,
        mode: 'daily',
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


