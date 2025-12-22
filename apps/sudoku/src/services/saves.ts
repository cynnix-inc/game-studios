import { createSaveService } from '@cynnix-studios/game-foundation';
import type { Difficulty, HintType, RunTimer } from '@cynnix-studios/sudoku-core';

import { GAME_KEY, usePlayerStore } from '../state/usePlayerStore';

export const saveService = createSaveService();

const SLOT = 'main';

type InProgressSaveV1Free = {
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
};

type InProgressSaveV1Daily = {
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
};

export type InProgressSaveV1 = InProgressSaveV1Free | InProgressSaveV1Daily;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isRunTimer(v: unknown): v is RunTimer {
  if (!isObject(v)) return false;
  return typeof v.startedAtMs === 'number' && typeof v.totalPausedMs === 'number' && (v.pausedAtMs === null || typeof v.pausedAtMs === 'number');
}

function forcePaused(timer: RunTimer, nowMs: number): RunTimer {
  if (timer.pausedAtMs != null) return timer;
  return { ...timer, pausedAtMs: nowMs };
}

function parseInProgressSaveV1(raw: unknown): InProgressSaveV1 | null {
  if (!isObject(raw)) return null;
  if (raw.v !== 1) return null;
  if (raw.mode === 'free') {
    if (typeof raw.serializedPuzzle !== 'string') return null;
    if (typeof raw.serializedSolution !== 'string') return null;
    if (!Array.isArray(raw.givensMask)) return null;
    if (typeof raw.mistakes !== 'number') return null;
    if (typeof raw.hintsUsedCount !== 'number') return null;
    if (!isObject(raw.hintBreakdown)) return null;
    if (!isRunTimer(raw.runTimer)) return null;
    if (raw.runStatus !== 'running' && raw.runStatus !== 'paused' && raw.runStatus !== 'completed') return null;
    if (
      raw.difficulty !== 'easy' &&
      raw.difficulty !== 'medium' &&
      raw.difficulty !== 'hard' &&
      raw.difficulty !== 'expert' &&
      raw.difficulty !== 'extreme'
    )
      return null;
    return raw as InProgressSaveV1Free;
  }
  if (raw.mode === 'daily') {
    if (typeof raw.dailyDateKey !== 'string') return null;
    if (typeof raw.serializedPuzzle !== 'string') return null;
    if (!Array.isArray(raw.givensMask)) return null;
    if (typeof raw.mistakes !== 'number') return null;
    if (typeof raw.hintsUsedCount !== 'number') return null;
    if (!isObject(raw.hintBreakdown)) return null;
    if (!isRunTimer(raw.runTimer)) return null;
    if (raw.runStatus !== 'running' && raw.runStatus !== 'paused' && raw.runStatus !== 'completed') return null;
    return raw as InProgressSaveV1Daily;
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
      legacy.difficulty === 'easy' ||
      legacy.difficulty === 'medium' ||
      legacy.difficulty === 'hard' ||
      legacy.difficulty === 'expert' ||
      legacy.difficulty === 'extreme'
        ? legacy.difficulty
        : 'easy',
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

  const nowMs = Date.now();
  usePlayerStore.getState().hydrateFromSave(saved.serializedPuzzle, saved.serializedSolution, saved.givensMask, {
    mistakes: saved.mistakes,
    hintBreakdown: saved.hintBreakdown ?? {},
    hintsUsedCount: saved.hintsUsedCount,
    runTimer: forcePaused(saved.runTimer, nowMs),
    runStatus: 'paused',
  });
}

export async function writeLocalSave() {
  const payload = usePlayerStore.getState().getSavePayload();
  if (!payload) return;
  await saveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: payload,
  });
}


