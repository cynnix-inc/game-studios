import { createSaveService } from '@cynnix-studios/game-foundation';

import { GAME_KEY, usePlayerStore } from '../state/usePlayerStore';

export const saveService = createSaveService();

const SLOT = 'main';

export async function loadLocalSave() {
  const saved = await saveService.local.read<{
    serializedPuzzle: string;
    serializedSolution: string;
    givensMask: boolean[];
    mistakes: number;
    startedAtMs: number;
  }>(GAME_KEY, SLOT);

  if (!saved) return;
  const { serializedPuzzle, serializedSolution, givensMask, mistakes, startedAtMs } = saved.data;
  usePlayerStore.getState().hydrateFromSave(serializedPuzzle, serializedSolution, givensMask, {
    mistakes,
    startedAtMs,
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


