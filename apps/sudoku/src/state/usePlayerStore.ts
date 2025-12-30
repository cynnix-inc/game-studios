import { create } from 'zustand';

import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import {
  candidatesForCell,
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
import { createClientSubmissionId } from '../services/leaderboard';
import { recordRunAbandoned, recordRunCompleted, recordRunStarted } from '../services/stats';
import { useSettingsStore } from './useSettingsStore';
import { getGameplaySettings, getSettingsToggles } from '../services/settingsModel';
import { trackEvent } from '../services/telemetry';
import { isDevToolsAllowed } from '../services/runtimeEnv';

export type AutoAdvanceDirection = 'forward' | 'backward';

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

  mode: 'free' | 'daily' | 'journey';
  dailyDateKey: string | null;
  dailyLoad: { status: 'idle' | 'loading' | 'ready' | 'unavailable'; reason?: DailyLoadUnavailable['reason'] };
  dailySource: 'remote' | 'cache' | null;

  // For future variants/subtypes (classic sizes, killer, etc) and stats bucketing.
  variantId: string;
  subVariantId: string | null;
  runId: string;
  statsStartedCounted: boolean;
  zenModeAtStart: boolean | null;

  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  givensMask: boolean[];
  selectedIndex: number | null;
  mistakes: number;
  hintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
  runTimer: RunTimer;
  runStatus: 'running' | 'paused' | 'completed' | 'failed';
  completedAtMs: number | null;
  completionClientSubmissionId: string | null;

  setDeviceId: (deviceId: string) => void;
  setProfile: (p: PlayerProfile | null) => void;
  continueAsGuest: () => void;
  newPuzzle: (difficulty?: Difficulty, meta?: { variantId?: string; subVariantId?: string | null; mode?: 'free' | 'journey' }) => void;
  loadTodayDaily: () => Promise<void>;
  loadDaily: (dateKey: string) => Promise<void>;
  exitDailyToFreePlay: () => void;

  selectCell: (i: number) => void;
  inputDigit: (d: CellValue, opts?: { autoAdvanceDirection?: AutoAdvanceDirection }) => void;
  clearCell: () => void;
  toggleNotesMode: () => void;
  undo: () => void;
  redo: () => void;
  hintRevealCellValue: () => void;
  /**
   * Hint type: show_candidates (Make: Assist)
   * Records a hint in the move log + scoring breakdown, but does not mutate the grid.
   * Returns the candidate set for the currently selected cell (if empty/editable).
   */
  hintShowCandidates: () => ReadonlySet<number> | null;
  /**
   * Hint type: explain_technique (Make: Logic)
   * Records a hint in the move log + scoring breakdown, selects a suggested cell,
   * and returns a short explanation + candidate context for UI to display.
   */
  hintExplainTechnique: () => { cell: number; candidates: ReadonlySet<number>; explanation: string } | null;
  pauseRun: (nowMs?: number) => void;
  resumeRun: (nowMs?: number) => void;
  markCompleted: (args: { clientSubmissionId: string; completedAtMs?: number; nowMs?: number }) => void;
  /**
   * Dev-only helpers for Make parity: allow forcing terminal states for UI testing.
   * These are gated to local+staging and intentionally do not record stats/telemetry.
   */
  devForceComplete: (nowMs?: number) => void;
  devForceFail: (nowMs?: number) => void;

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
      runStatus?: 'running' | 'paused' | 'completed' | 'failed';
      difficulty?: Difficulty;
      variantId?: string;
      subVariantId?: string | null;
      runId?: string;
      statsStartedCounted?: boolean;
      zenModeAtStart?: boolean | null;
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
    runStatus: 'running' | 'paused' | 'completed' | 'failed';
    difficulty?: Difficulty;
    variantId?: string;
    subVariantId?: string | null;
    runId?: string;
    statsStartedCounted?: boolean;
    zenModeAtStart?: boolean | null;
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
        runStatus: 'running' | 'paused' | 'completed' | 'failed';
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
        runStatus: 'running' | 'paused' | 'completed' | 'failed';
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

function findNextEditableEmptyCell(args: { start: number; puzzle: Grid; givensMask: boolean[] }): number | null {
  for (let step = 1; step <= 81; step++) {
    const i = (args.start + step) % 81;
    if (args.givensMask[i]) continue;
    if (args.puzzle[i] !== 0) continue;
    return i;
  }
  return null;
}

function findPrevEditableEmptyCell(args: { start: number; puzzle: Grid; givensMask: boolean[] }): number | null {
  for (let step = 1; step <= 81; step++) {
    const i = (args.start - step + 81 * 10) % 81;
    if (args.givensMask[i]) continue;
    if (args.puzzle[i] !== 0) continue;
    return i;
  }
  return null;
}

function newGuestId() {
  return `guest_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function newRunId() {
  return `run_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function countMoves(moves: SudokuMove[]) {
  let setCount = 0;
  let clearCount = 0;
  let noteAddCount = 0;
  let noteRemoveCount = 0;
  for (const m of moves) {
    if (m.kind === 'set') setCount += 1;
    if (m.kind === 'clear') clearCount += 1;
    if (m.kind === 'note_add') noteAddCount += 1;
    if (m.kind === 'note_remove') noteRemoveCount += 1;
  }
  return { setCount, clearCount, noteAddCount, noteRemoveCount };
}

const initial = generate('skilled', { seed: 1337 });

export const usePlayerStore = create<SudokuState>((set, get) => {
  function getZenModeEnabled(): boolean {
    const settings = useSettingsStore.getState().settings;
    const toggles = settings ? getSettingsToggles(settings) : null;
    return !!toggles?.zenMode;
  }

  function getLivesLimit(): number {
    const settings = useSettingsStore.getState().settings;
    const toggles = settings ? getSettingsToggles(settings) : null;
    if (toggles?.zenMode) return 11;
    const gameplay = settings ? getGameplaySettings(settings) : null;
    return gameplay?.livesLimit ?? 11;
  }

  function isTerminalStatus(status: SudokuState['runStatus']): boolean {
    return status === 'completed' || status === 'failed';
  }

  function getRunBucketMeta() {
    const s = get();
    return {
      mode: s.mode,
      variantId: s.variantId,
      subVariantId: s.subVariantId,
      difficulty: s.difficulty,
      zen: s.zenModeAtStart ?? getZenModeEnabled(),
    } as const;
  }

  function ensureStatsStartedCounted(): void {
    const s = get();
    if (s.statsStartedCounted) return;
    set({ statsStartedCounted: true, zenModeAtStart: getZenModeEnabled() });
    const meta = getRunBucketMeta();
    void recordRunStarted({
      mode: meta.mode,
      variantId: meta.variantId,
      subVariantId: meta.subVariantId,
      difficulty: meta.difficulty,
      zen: meta.zen,
    });
  }

  function recordAbandonedIfStarted(): void {
    const s = get();
    if (!s.statsStartedCounted) return;
    if (isTerminalStatus(s.runStatus)) return;
    const meta = getRunBucketMeta();
    const elapsedMs = getRunTimerElapsedMs(s.runTimer, Date.now());
    const { setCount, clearCount, noteAddCount, noteRemoveCount } = countMoves(s.moves);
    void recordRunAbandoned({
      mode: meta.mode,
      variantId: meta.variantId,
      subVariantId: meta.subVariantId,
      difficulty: meta.difficulty,
      zen: meta.zen,
      playTimeMs: elapsedMs,
      setCount,
      clearCount,
      noteAddCount,
      noteRemoveCount,
      mistakesCount: s.mistakes,
      hintsUsedCount: s.hintsUsedCount,
      hintBreakdown: s.hintBreakdown,
    });
  }

  return {
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

  variantId: 'classic',
  subVariantId: 'classic:9x9',
  runId: newRunId(),
  statsStartedCounted: false,
  zenModeAtStart: null,

  difficulty: 'skilled',
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

  newPuzzle: (difficulty = get().difficulty, meta) => {
    // Starting a new run implicitly abandons the current one if the player has taken at least one action.
    recordAbandonedIfStarted();
    const pick = freePlayPacksService.getPuzzleSync(difficulty);
    const givensMask = pick.puzzle.map((v) => v !== 0);
    const nowMs = Date.now();
    set({
      mode: meta?.mode ?? 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      variantId: meta?.variantId ?? 'classic',
      subVariantId: meta?.subVariantId ?? 'classic:9x9',
      runId: newRunId(),
      statsStartedCounted: false,
      zenModeAtStart: null,
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
    // Starting a daily run implicitly abandons the current one if the player has taken at least one action.
    recordAbandonedIfStarted();
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
      variantId: 'classic',
      subVariantId: 'classic:9x9',
      runId: newRunId(),
      statsStartedCounted: false,
      zenModeAtStart: null,
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

  inputDigit: (d, opts) => {
    const { selectedIndex, puzzle, givensMask, solution, mistakes, deviceId, revision, moves, notesMode, notes, undoStack, runStatus } = get();
    if (isTerminalStatus(runStatus)) return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;

    const cell = clampCellIndex(selectedIndex);
    const digit = clampDigit(d);
    const ts = Date.now();

    // Notes mode: toggle note for this cell without changing puzzle value.
    if (notesMode) {
      ensureStatsStartedCounted();
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
    ensureStatsStartedCounted();
    const prev = puzzle[cell] ?? 0;
    // Make parity: tapping the same digit again clears the cell (no separate Clear button in the design).
    if (prev === digit) {
      get().clearCell();
      return;
    }
    const nextPuzzle = puzzle.slice() as number[];
    nextPuzzle[cell] = digit;
    const correct = solution[cell] === digit;
    const settings = useSettingsStore.getState().settings;
    const toggles = settings ? getSettingsToggles(settings) : null;
    const autoAdvanceEnabled = !!toggles?.autoAdvance;
    const zenModeEnabled = !!toggles?.zenMode;
    const countsMistake = !correct && !zenModeEnabled;
    const livesLimit = getLivesLimit();
    const livesInfinite = livesLimit === 11;
    const nextMistakes = countsMistake ? mistakes + 1 : mistakes;
    const direction: AutoAdvanceDirection = opts?.autoAdvanceDirection ?? 'forward';
    const nextSelected =
      autoAdvanceEnabled && !notesMode
        ? direction === 'backward'
          ? findPrevEditableEmptyCell({ start: cell, puzzle: nextPuzzle as unknown as Grid, givensMask })
          : findNextEditableEmptyCell({ start: cell, puzzle: nextPuzzle as unknown as Grid, givensMask })
        : null;

    const nextMoves: SudokuMove[] = deviceId
      ? [
          ...moves,
          { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'set', cell, value: digit },
          ...(countsMistake ? [{ schemaVersion: 1, device_id: deviceId, rev: revision + 2, ts, kind: 'mistake' } as const] : []),
        ]
      : moves;

    set({
      puzzle: nextPuzzle as unknown as Grid,
      mistakes: nextMistakes,
      revision: deviceId ? revision + (countsMistake ? 2 : 1) : revision,
      moves: nextMoves,
      undoStack: [...undoStack, { kind: 'cell', cell, prev, next: digit }],
      redoStack: [],
      ...(nextSelected != null ? { selectedIndex: nextSelected } : {}),
    });

    // Lives: if enabled and we just spent the last life, end the run.
    // Make: "Lives limit how many wrong entries you can make. Set to 11 for Unlimited."
    if (!livesInfinite && countsMistake && nextMistakes >= livesLimit) {
      const s = get();
      const tsFail = Date.now();
      // Record failure as an "abandoned" run in stats (started but not finished).
      const meta = getRunBucketMeta();
      const elapsedMs = getRunTimerElapsedMs(s.runTimer, tsFail);
      const { setCount, clearCount, noteAddCount, noteRemoveCount } = countMoves(s.moves);
      void recordRunAbandoned({
        mode: meta.mode,
        variantId: meta.variantId,
        subVariantId: meta.subVariantId,
        difficulty: meta.difficulty,
        zen: meta.zen,
        playTimeMs: elapsedMs,
        setCount,
        clearCount,
        noteAddCount,
        noteRemoveCount,
        mistakesCount: s.mistakes,
        hintsUsedCount: s.hintsUsedCount,
        hintBreakdown: s.hintBreakdown,
      });
      set({
        runTimer: pauseRunTimer(s.runTimer, tsFail),
        runStatus: 'failed',
        selectedIndex: s.selectedIndex,
      });
      return;
    }

    // Make parity: mark completion as soon as the board matches the solution.
    // (Unlocks victory UI + daily submission flows.)
    const solved = nextPuzzle.every((v, i) => v !== 0 && v === solution[i]);
    if (solved) {
      get().markCompleted({ clientSubmissionId: createClientSubmissionId(), completedAtMs: ts, nowMs: ts });
    }
  },

  clearCell: () => {
    const { selectedIndex, puzzle, givensMask, deviceId, revision, moves, undoStack, runStatus } = get();
    if (isTerminalStatus(runStatus)) return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;
    const cell = clampCellIndex(selectedIndex);
    const prev = puzzle[cell] ?? 0;
    if (prev === 0) return;
    ensureStatsStartedCounted();
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
    if (isTerminalStatus(runStatus)) return;
    set((s) => ({ notesMode: !s.notesMode }));
  },

  undo: () => {
    const { undoStack, redoStack, deviceId, revision, moves, puzzle, notes, runStatus } = get();
    if (isTerminalStatus(runStatus)) return;
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
    if (isTerminalStatus(runStatus)) return;
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
    if (isTerminalStatus(runStatus)) return;
    if (selectedIndex == null) return;
    if (givensMask[selectedIndex]) return;
    ensureStatsStartedCounted();

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

    const solved = next.every((v, i) => v !== 0 && v === solution[i]);
    if (solved) {
      get().markCompleted({ clientSubmissionId: createClientSubmissionId(), completedAtMs: ts, nowMs: ts });
    }

    void trackEvent({ name: 'hint_used', props: { type: 'reveal_cell_value' } });
  },

  hintShowCandidates: () => {
    const { selectedIndex, puzzle, givensMask, hintBreakdown, hintsUsedCount, deviceId, revision, moves, runStatus } = get();
    if (isTerminalStatus(runStatus)) return null;
    if (selectedIndex == null) return null;
    if (givensMask[selectedIndex]) return null;
    if ((puzzle[selectedIndex] ?? 0) !== 0) return null;
    ensureStatsStartedCounted();

    const candidates = new Set<number>(candidatesForCell(puzzle as unknown as number[], selectedIndex));
    if (candidates.size === 0) return null;

    const nextBreakdown: Partial<Record<HintType, number>> = { ...hintBreakdown };
    nextBreakdown.show_candidates = (nextBreakdown.show_candidates ?? 0) + 1;

    const ts = Date.now();
    const nextMoves: SudokuMove[] = deviceId
      ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'hint', hintType: 'show_candidates' }]
      : moves;

    set({
      hintsUsedCount: hintsUsedCount + 1,
      hintBreakdown: nextBreakdown,
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
    });

    void trackEvent({ name: 'hint_used', props: { type: 'show_candidates' } });
    return candidates;
  },

  hintExplainTechnique: () => {
    const { selectedIndex, puzzle, givensMask, hintBreakdown, hintsUsedCount, deviceId, revision, moves, runStatus } = get();
    if (isTerminalStatus(runStatus)) return null;
    ensureStatsStartedCounted();

    function candidatesForEmptyCell(i: number): Set<number> | null {
      if (givensMask[i]) return null;
      if ((puzzle[i] ?? 0) !== 0) return null;
      const set = new Set<number>(candidatesForCell(puzzle as unknown as number[], i));
      if (set.size === 0) return null;
      return set;
    }

    // Make "Logic" hint: highlight a solvable cell.
    // MVP technique: naked single (one candidate).
    let chosenCell: number | null = null;
    let chosenCandidates: Set<number> | null = null;

    if (selectedIndex != null) {
      const c = candidatesForEmptyCell(selectedIndex);
      if (c && c.size === 1) {
        chosenCell = selectedIndex;
        chosenCandidates = c;
      }
    }

    if (chosenCell == null) {
      for (let i = 0; i < 81; i++) {
        const c = candidatesForEmptyCell(i);
        if (!c) continue;
        if (c.size !== 1) continue;
        chosenCell = i;
        chosenCandidates = c;
        break;
      }
    }

    // Fallback: if no naked singles exist, explain the currently selected empty cell (or first empty cell).
    if (chosenCell == null) {
      const fallbackCell =
        selectedIndex != null && !givensMask[selectedIndex] && (puzzle[selectedIndex] ?? 0) === 0
          ? selectedIndex
          : (() => {
              for (let i = 0; i < 81; i++) {
                if (givensMask[i]) continue;
                if ((puzzle[i] ?? 0) !== 0) continue;
                return i;
              }
              return null;
            })();
      if (fallbackCell == null) return null;
      const c = candidatesForEmptyCell(fallbackCell);
      if (!c) return null;
      chosenCell = fallbackCell;
      chosenCandidates = c;
    }

    if (chosenCell == null || !chosenCandidates) return null;

    const nextBreakdown: Partial<Record<HintType, number>> = { ...hintBreakdown };
    nextBreakdown.explain_technique = (nextBreakdown.explain_technique ?? 0) + 1;

    const ts = Date.now();
    const nextMoves: SudokuMove[] = deviceId
      ? [...moves, { schemaVersion: 1, device_id: deviceId, rev: revision + 1, ts, kind: 'hint', hintType: 'explain_technique' }]
      : moves;

    const explanation =
      chosenCandidates.size === 1
        ? `This cell has only one possible value: ${Array.from(chosenCandidates)[0]}.`
        : `Try this cell next. Candidates: ${Array.from(chosenCandidates).join(', ')}.`;

    set({
      selectedIndex: chosenCell,
      hintsUsedCount: hintsUsedCount + 1,
      hintBreakdown: nextBreakdown,
      revision: deviceId ? revision + 1 : revision,
      moves: nextMoves,
    });

    void trackEvent({ name: 'hint_used', props: { type: 'explain_technique' } });
    return { cell: chosenCell, candidates: chosenCandidates, explanation };
  },

  pauseRun: (nowMs) => {
    const { runTimer, runStatus, deviceId, revision, moves } = get();
    if (isTerminalStatus(runStatus)) return;
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
    if (isTerminalStatus(runStatus)) return;
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
    if (isTerminalStatus(runStatus)) return;
    ensureStatsStartedCounted();
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

    // Persisted stats (local + sync). Bucketed by mode+variant+subVariant+difficulty+zen.
    const meta = getRunBucketMeta();
    const { setCount, clearCount, noteAddCount, noteRemoveCount } = countMoves(moves);
    void recordRunCompleted({
      mode: meta.mode,
      variantId: meta.variantId,
      subVariantId: meta.subVariantId,
      difficulty: meta.difficulty,
      zen: meta.zen,
      playTimeMs: rawTimeMs,
      setCount,
      clearCount,
      noteAddCount,
      noteRemoveCount,
      mistakesCount: mistakes,
      hintsUsedCount,
      hintBreakdown,
    });
  },

  devForceComplete: (nowMs) => {
    if (!isDevToolsAllowed()) return;
    const { runTimer, runStatus } = get();
    if (isTerminalStatus(runStatus)) return;
    const ts = nowMs ?? Date.now();
    set({
      runTimer: pauseRunTimer(runTimer, ts),
      runStatus: 'completed',
      completedAtMs: ts,
      completionClientSubmissionId: null,
    });
  },

  devForceFail: (nowMs) => {
    if (!isDevToolsAllowed()) return;
    const { runTimer, runStatus } = get();
    if (isTerminalStatus(runStatus)) return;
    const ts = nowMs ?? Date.now();
    set({
      runTimer: pauseRunTimer(runTimer, ts),
      runStatus: 'failed',
      completedAtMs: null,
      completionClientSubmissionId: null,
    });
  },

  hydrateFromSave: (serializedPuzzle, serializedSolution, givensMask, meta) => {
    const nowMs = Date.now();
    const baseMoves = meta?.moves ?? [];
    const startedAtMs =
      meta?.runTimer?.startedAtMs ??
      meta?.startedAtMs ??
      nowMs;
    const folded =
      baseMoves.length > 0
        ? foldMovesToState({ startedAtMs, puzzle: parseGrid(serializedPuzzle) }, baseMoves)
        : null;
    set({
      mode: 'free',
      dailyDateKey: null,
      dailyLoad: { status: 'idle' },
      dailySource: null,
      variantId: meta?.variantId ?? 'classic',
      subVariantId: meta?.subVariantId ?? 'classic:9x9',
      runId: meta?.runId ?? newRunId(),
      statsStartedCounted: meta?.statsStartedCounted ?? false,
      zenModeAtStart: meta?.zenModeAtStart ?? null,
      deviceId: meta?.deviceId ?? null,
      revision: meta?.revision ?? 0,
      moves: baseMoves,
      puzzle: (folded?.puzzle ?? parseGrid(serializedPuzzle)) as unknown as Grid,
      notes: folded?.notes ?? emptyNotes(),
      notesMode: false,
      undoStack: meta?.undoStack ?? [],
      redoStack: meta?.redoStack ?? [],
      difficulty: meta?.difficulty ?? get().difficulty,
      solution: parseGrid(serializedSolution),
      givensMask: [...givensMask],
      mistakes: folded?.mistakesCount ?? meta?.mistakes ?? 0,
      hintsUsedCount: folded?.hintsUsedCount ?? meta?.hintsUsedCount ?? 0,
      hintBreakdown: folded?.hintBreakdown ?? meta?.hintBreakdown ?? {},
      // Timer + status: prefer persisted values when provided, because local saves may "force pause"
      // without a corresponding move log entry.
      runTimer: meta?.runTimer ?? folded?.runTimer ?? createRunTimer(startedAtMs),
      runStatus: meta?.runStatus ?? folded?.runStatus ?? 'running',
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
    difficulty,
    variantId,
    subVariantId,
    runId,
    statsStartedCounted,
    zenModeAtStart,
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
      variantId: variantId ?? get().variantId,
      subVariantId: subVariantId ?? get().subVariantId,
      runId: runId ?? get().runId,
      statsStartedCounted: statsStartedCounted ?? get().statsStartedCounted,
      zenModeAtStart: zenModeAtStart ?? get().zenModeAtStart,
      difficulty: difficulty ?? get().difficulty,
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
    const {
      mode,
      dailyDateKey,
      puzzle,
      solution,
      givensMask,
      mistakes,
      hintsUsedCount,
      hintBreakdown,
      runTimer,
      runStatus,
      difficulty,
      deviceId,
      revision,
      moves,
      undoStack,
      redoStack,
      variantId,
      subVariantId,
      runId,
      statsStartedCounted,
      zenModeAtStart,
    } = get();

    if (mode === 'daily') {
      if (!dailyDateKey) return null;
      return {
        v: 1,
        mode: 'daily',
        runId,
        variantId,
        subVariantId,
        statsStartedCounted,
        zenModeAtStart,
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
        difficulty,
      };
    }

    return {
      v: 1,
      mode: 'free',
      runId,
      variantId,
      subVariantId,
      statsStartedCounted,
      zenModeAtStart,
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
};
});

export { GAME_KEY };





