import { createSaveService } from '@cynnix-studios/game-foundation';
import { assertPuzzleSolutionContract, parseGrid, type Difficulty, type HintType, type RunTimer, type SudokuMove } from '@cynnix-studios/sudoku-core';

import { GAME_KEY, usePlayerStore } from '../state/usePlayerStore';
import type { UndoAction } from '../state/usePlayerStore';

export const saveService = createSaveService();

const SLOT = 'main';

type InProgressSaveV1Free = {
  v: 1;
  mode: 'free';
  runId?: string;
  variantId?: string;
  subVariantId?: string | null;
  statsStartedCounted?: boolean;
  zenModeAtStart?: boolean | null;
  deviceId?: string | null;
  revision?: number;
  moves?: SudokuMove[];
  undoStack?: UndoAction[];
  redoStack?: UndoAction[];
  serializedPuzzle: string;
  serializedSolution: string;
  givensMask: boolean[];
  mistakes: number;
  hintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
  runTimer: RunTimer;
  runStatus: 'running' | 'paused' | 'completed' | 'failed';
  difficulty: Difficulty;
};

type InProgressSaveV1Daily = {
  v: 1;
  mode: 'daily';
  runId?: string;
  variantId?: string;
  subVariantId?: string | null;
  statsStartedCounted?: boolean;
  zenModeAtStart?: boolean | null;
  deviceId?: string | null;
  revision?: number;
  moves?: SudokuMove[];
  undoStack?: UndoAction[];
  redoStack?: UndoAction[];
  dailyDateKey: string;
  serializedPuzzle: string;
  givensMask: boolean[];
  mistakes: number;
  hintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
  runTimer: RunTimer;
  runStatus: 'running' | 'paused' | 'completed' | 'failed';
  difficulty?: Difficulty;
};

export type InProgressSaveV1 = InProgressSaveV1Free | InProgressSaveV1Daily;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isRunTimer(v: unknown): v is RunTimer {
  if (!isObject(v)) return false;
  return typeof v.startedAtMs === 'number' && typeof v.totalPausedMs === 'number' && (v.pausedAtMs === null || typeof v.pausedAtMs === 'number');
}

function isSudokuMove(v: unknown): v is SudokuMove {
  if (!isObject(v)) return false;
  return (
    v.schemaVersion === 1 &&
    typeof v.device_id === 'string' &&
    typeof v.rev === 'number' &&
    typeof v.ts === 'number' &&
    typeof v.kind === 'string'
  );
}

function parseMoveLog(raw: unknown): SudokuMove[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: SudokuMove[] = [];
  for (const m of raw) {
    if (!isSudokuMove(m)) return undefined;
    out.push(m);
  }
  return out;
}

function isUndoAction(v: unknown): v is UndoAction {
  if (!isObject(v)) return false;
  if (v.kind === 'cell') {
    return (
      typeof v.cell === 'number' &&
      Number.isInteger(v.cell) &&
      typeof v.prev === 'number' &&
      Number.isFinite(v.prev) &&
      typeof v.next === 'number' &&
      Number.isFinite(v.next)
    );
  }
  if (v.kind === 'note') {
    return (
      typeof v.cell === 'number' &&
      Number.isInteger(v.cell) &&
      typeof v.digit === 'number' &&
      Number.isInteger(v.digit) &&
      typeof v.prevHad === 'boolean' &&
      typeof v.nextHad === 'boolean'
    );
  }
  return false;
}

function parseUndoStack(raw: unknown): UndoAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: UndoAction[] = [];
  for (const a of raw) {
    if (!isUndoAction(a)) return undefined;
    out.push(a);
  }
  return out;
}

function forcePaused(timer: RunTimer, nowMs: number): RunTimer {
  if (timer.pausedAtMs != null) return timer;
  return { ...timer, pausedAtMs: nowMs };
}

function parseInProgressSaveV1(raw: unknown): InProgressSaveV1 | null {
  if (!isObject(raw)) return null;
  if (raw.v !== 1) return null;
  if (raw.mode === 'free') {
    if (raw.runId != null && typeof raw.runId !== 'string') return null;
    if (raw.variantId != null && typeof raw.variantId !== 'string') return null;
    if (raw.subVariantId != null && typeof raw.subVariantId !== 'string') return null;
    if (raw.statsStartedCounted != null && typeof raw.statsStartedCounted !== 'boolean') return null;
    if (raw.zenModeAtStart != null && typeof raw.zenModeAtStart !== 'boolean') return null;
    if (raw.deviceId != null && typeof raw.deviceId !== 'string') return null;
    if (raw.revision != null && typeof raw.revision !== 'number') return null;
    const moves = raw.moves == null ? undefined : parseMoveLog(raw.moves);
    if (raw.moves != null && !moves) return null;
    const undoStack = raw.undoStack == null ? undefined : parseUndoStack(raw.undoStack);
    if (raw.undoStack != null && !undoStack) return null;
    const redoStack = raw.redoStack == null ? undefined : parseUndoStack(raw.redoStack);
    if (raw.redoStack != null && !redoStack) return null;
    if (typeof raw.serializedPuzzle !== 'string') return null;
    if (typeof raw.serializedSolution !== 'string') return null;
    if (!Array.isArray(raw.givensMask)) return null;
    if (typeof raw.mistakes !== 'number') return null;
    if (typeof raw.hintsUsedCount !== 'number') return null;
    if (!isObject(raw.hintBreakdown)) return null;
    if (!isRunTimer(raw.runTimer)) return null;
    if (raw.runStatus !== 'running' && raw.runStatus !== 'paused' && raw.runStatus !== 'completed' && raw.runStatus !== 'failed') return null;
    if (
      raw.difficulty !== 'novice' &&
      raw.difficulty !== 'skilled' &&
      raw.difficulty !== 'advanced' &&
      raw.difficulty !== 'expert' &&
      raw.difficulty !== 'fiendish' &&
      raw.difficulty !== 'ultimate'
    )
      return null;
    return { ...(raw as InProgressSaveV1Free), moves, undoStack, redoStack };
  }
  if (raw.mode === 'daily') {
    if (raw.runId != null && typeof raw.runId !== 'string') return null;
    if (raw.variantId != null && typeof raw.variantId !== 'string') return null;
    if (raw.subVariantId != null && typeof raw.subVariantId !== 'string') return null;
    if (raw.statsStartedCounted != null && typeof raw.statsStartedCounted !== 'boolean') return null;
    if (raw.zenModeAtStart != null && typeof raw.zenModeAtStart !== 'boolean') return null;
    if (raw.deviceId != null && typeof raw.deviceId !== 'string') return null;
    if (raw.revision != null && typeof raw.revision !== 'number') return null;
    const moves = raw.moves == null ? undefined : parseMoveLog(raw.moves);
    if (raw.moves != null && !moves) return null;
    const undoStack = raw.undoStack == null ? undefined : parseUndoStack(raw.undoStack);
    if (raw.undoStack != null && !undoStack) return null;
    const redoStack = raw.redoStack == null ? undefined : parseUndoStack(raw.redoStack);
    if (raw.redoStack != null && !redoStack) return null;
    if (typeof raw.dailyDateKey !== 'string') return null;
    if (typeof raw.serializedPuzzle !== 'string') return null;
    if (!Array.isArray(raw.givensMask)) return null;
    if (typeof raw.mistakes !== 'number') return null;
    if (typeof raw.hintsUsedCount !== 'number') return null;
    if (!isObject(raw.hintBreakdown)) return null;
    if (!isRunTimer(raw.runTimer)) return null;
    if (raw.runStatus !== 'running' && raw.runStatus !== 'paused' && raw.runStatus !== 'completed' && raw.runStatus !== 'failed') return null;
    if (
      raw.difficulty != null &&
      raw.difficulty !== 'novice' &&
      raw.difficulty !== 'skilled' &&
      raw.difficulty !== 'advanced' &&
      raw.difficulty !== 'expert' &&
      raw.difficulty !== 'fiendish' &&
      raw.difficulty !== 'ultimate'
    )
      return null;
    return { ...(raw as InProgressSaveV1Daily), moves, undoStack, redoStack };
  }
  return null;
}

export async function readLocalInProgressSave(): Promise<InProgressSaveV1 | null> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  if (!saved) return null;

  const parsed = parseInProgressSaveV1(saved.data);
  if (parsed) return parsed;

  // Back-compat: older saves were unversioned free-play payloads.
  const legacy = saved.data;
  if (!isObject(legacy)) return null;
  if (typeof legacy.serializedPuzzle !== 'string') return null;
  if (typeof legacy.serializedSolution !== 'string') return null;
  if (!Array.isArray(legacy.givensMask)) return null;
  if (typeof legacy.mistakes !== 'number') return null;

  const runTimer = isRunTimer(legacy.runTimer) ? legacy.runTimer : undefined;
  const startedAtMs = typeof legacy.startedAtMs === 'number' ? legacy.startedAtMs : undefined;
  const hintBreakdown = (isObject(legacy.hintBreakdown) ? (legacy.hintBreakdown as Partial<Record<HintType, number>>) : {}) ?? {};
  const hintsUsedCount = typeof legacy.hintsUsedCount === 'number' ? legacy.hintsUsedCount : 0;

  // Convert to a v1 free payload for callers who want to inspect meta.
  const nowMs = Date.now();
  return {
    v: 1,
    mode: 'free',
    serializedPuzzle: legacy.serializedPuzzle,
    serializedSolution: legacy.serializedSolution,
    givensMask: legacy.givensMask as boolean[],
    mistakes: legacy.mistakes,
    hintsUsedCount,
    hintBreakdown,
    runTimer: forcePaused(runTimer ?? { startedAtMs: startedAtMs ?? nowMs, totalPausedMs: 0, pausedAtMs: null }, nowMs),
    runStatus: 'paused',
    difficulty:
      legacy.difficulty === 'novice' ||
      legacy.difficulty === 'skilled' ||
      legacy.difficulty === 'advanced' ||
      legacy.difficulty === 'expert' ||
      legacy.difficulty === 'fiendish' ||
      legacy.difficulty === 'ultimate'
        ? legacy.difficulty
        : 'skilled',
  };
}

export async function readLocalResumeTarget(): Promise<{ mode: 'free' | 'daily'; dailyDateKey?: string } | null> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  if (!saved) return null;
  const parsed = parseInProgressSaveV1(saved.data);
  if (!parsed) return null;
  if (parsed.mode === 'daily') return { mode: 'daily', dailyDateKey: parsed.dailyDateKey };
  return { mode: 'free' };
}

export async function loadLocalSave() {
  const saved = await readLocalInProgressSave();
  if (!saved) return;
  if (saved.mode !== 'free') return;

  // Safety net: validate the *givens-only* puzzle against the saved solution.
  // We must not validate the full `serializedPuzzle` because it can include player moves (including incorrect guesses).
  try {
    const puzzle = parseGrid(saved.serializedPuzzle);
    const solution = parseGrid(saved.serializedSolution);
    const givensOnly = puzzle.slice() as number[];
    for (let i = 0; i < 81; i++) {
      if (!saved.givensMask[i]) givensOnly[i] = 0;
    }
    assertPuzzleSolutionContract(givensOnly, solution);
  } catch {
    // If the saved content is invalid (including non-unique), self-heal by clearing it and starting a new run.
    await clearLocalInProgressSave();
    usePlayerStore.getState().newPuzzle(saved.difficulty, {
      mode: 'free',
      variantId: saved.variantId ?? 'classic',
      subVariantId: saved.subVariantId ?? 'classic:9x9',
    });
    return;
  }

  const nowMs = Date.now();
  const status: 'paused' | 'completed' | 'failed' = saved.runStatus === 'completed' || saved.runStatus === 'failed' ? saved.runStatus : 'paused';
  usePlayerStore.getState().hydrateFromSave(saved.serializedPuzzle, saved.serializedSolution, saved.givensMask, {
    deviceId: saved.deviceId ?? undefined,
    runId: saved.runId,
    variantId: saved.variantId,
    subVariantId: saved.subVariantId ?? null,
    statsStartedCounted: saved.statsStartedCounted,
    zenModeAtStart: saved.zenModeAtStart ?? null,
    revision: saved.revision ?? undefined,
    moves: saved.moves ?? undefined,
    undoStack: saved.undoStack ?? undefined,
    redoStack: saved.redoStack ?? undefined,
    mistakes: saved.mistakes,
    hintBreakdown: saved.hintBreakdown ?? {},
    hintsUsedCount: saved.hintsUsedCount,
    runTimer: forcePaused(saved.runTimer, nowMs),
    runStatus: status,
    difficulty: saved.difficulty,
  });
}

export async function writeLocalSave() {
  const payload = usePlayerStore.getState().getSavePayload();
  if (!payload) return;
  const clientUpdatedAtMs = Date.now();
  await saveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: { ...payload, clientUpdatedAtMs },
  });
}

export async function clearLocalInProgressSave(): Promise<void> {
  await saveService.local.clear(GAME_KEY, SLOT);
}


