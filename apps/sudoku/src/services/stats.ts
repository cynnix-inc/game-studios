import { createSaveService } from '@cynnix-studios/game-foundation';

import { usePlayerStore } from '../state/usePlayerStore';
import { mergeStatsLww, isSudokuStatsV1, type SudokuStatsV1 } from './statsModel';
import { pullSave, pushSave } from './sync';

const GAME_KEY = 'sudoku';
const SLOT = 'stats';

const saveService = createSaveService();

function defaultStats(deviceId: string): SudokuStatsV1 {
  return {
    schemaVersion: 1,
    kind: 'sudoku_stats',
    updatedAtMs: 0,
    updatedByDeviceId: deviceId,
    daily: { completedCount: 0, rankedCount: 0, replayCount: 0 },
    free: { completedCount: 0 },
  };
}

export async function loadLocalStats(): Promise<SudokuStatsV1> {
  const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const parsed = saved?.data;
  if (isSudokuStatsV1(parsed)) return parsed;

  const created = defaultStats(deviceId);
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: created });
  return created;
}

async function writeLocalStats(next: SudokuStatsV1): Promise<void> {
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: next });
}

async function updateStats(mutator: (prev: SudokuStatsV1) => SudokuStatsV1): Promise<SudokuStatsV1> {
  const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
  const prev = await loadLocalStats();
  const next = mutator(prev);
  const stamped: SudokuStatsV1 = {
    ...next,
    updatedAtMs: Date.now(),
    updatedByDeviceId: deviceId,
  };
  await writeLocalStats(stamped);
  return stamped;
}

export async function recordFreePlayCompleted(): Promise<void> {
  await updateStats((s) => ({ ...s, free: { completedCount: s.free.completedCount + 1 } }));
}

export async function recordDailyCompleted(): Promise<void> {
  await updateStats((s) => ({ ...s, daily: { ...s.daily, completedCount: s.daily.completedCount + 1 } }));
}

export async function recordDailySubmissionResult(args: { rankedSubmission: boolean }): Promise<void> {
  await updateStats((s) => ({
    ...s,
    daily: {
      ...s.daily,
      rankedCount: s.daily.rankedCount + (args.rankedSubmission ? 1 : 0),
      replayCount: s.daily.replayCount + (args.rankedSubmission ? 0 : 1),
    },
  }));
}

export async function syncStatsOnce(): Promise<void> {
  const local = await loadLocalStats();
  const pulled = await pullSave(SLOT);
  if (!pulled.ok) {
    // Expected when signed out; keep stats local-only until authenticated.
    return;
  }

  const remoteRaw = pulled.data;
  const remote = remoteRaw == null ? null : isSudokuStatsV1(remoteRaw) ? remoteRaw : null;
  if (remoteRaw != null && !remote) {
    // Invalid remote stats; ignore rather than clobber local.
    return;
  }

  const winner = remote ? mergeStatsLww(local, remote) : local;
  if (winner !== local) await writeLocalStats(winner);

  // If local is newer (or remote missing), push local.
  if (!remote || winner === local) {
    await pushSave(SLOT, winner);
  }
}


