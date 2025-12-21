import { createSaveService } from '@cynnix-studios/game-foundation';

import { GAME_KEY, usePlayerStore } from '../state/usePlayerStore';

export const saveService = createSaveService();

const SLOT = 'main';

export async function loadLocalSave() {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);

  if (!saved) return;
  const data = saved.data as {
    schemaVersion?: number;
    difficulty?: unknown;
    serializedPuzzle?: unknown;
    serializedSolution?: unknown;
    givensMask?: unknown;
    notes?: unknown;
    notesMode?: unknown;
    undoStack?: unknown;
    redoStack?: unknown;
    mistakes?: unknown;
    startedAtMs?: unknown;
  };

  if (typeof data.serializedPuzzle !== 'string') return;
  if (typeof data.serializedSolution !== 'string') return;
  if (!Array.isArray(data.givensMask)) return;

  usePlayerStore.getState().hydrateFromSave({
    difficulty: typeof data.difficulty === 'string' ? (data.difficulty as any) : undefined,
    serializedPuzzle: data.serializedPuzzle,
    serializedSolution: data.serializedSolution,
    givensMask: data.givensMask as boolean[],
    notes: Array.isArray(data.notes) ? (data.notes as number[]) : undefined,
    notesMode: typeof data.notesMode === 'boolean' ? data.notesMode : undefined,
    undoStack: Array.isArray(data.undoStack) ? (data.undoStack as any) : undefined,
    redoStack: Array.isArray(data.redoStack) ? (data.redoStack as any) : undefined,
    mistakes: typeof data.mistakes === 'number' ? data.mistakes : undefined,
    startedAtMs: typeof data.startedAtMs === 'number' ? data.startedAtMs : undefined,
  });
}

export async function writeLocalSave() {
  const payload = usePlayerStore.getState().getSavePayload();
  await saveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: payload,
  });
}


