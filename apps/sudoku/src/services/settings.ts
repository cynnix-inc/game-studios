import { createSaveService } from '@cynnix-studios/game-foundation';

import { usePlayerStore } from '../state/usePlayerStore';
import { useSettingsStore } from '../state/useSettingsStore';
import { mergeSettingsLww, isSudokuSettingsV1, type SudokuSettingsV1 } from './settingsModel';
import { pullSave, pushSave } from './sync';

const GAME_KEY = 'sudoku';
const SLOT = 'settings';

const saveService = createSaveService();

const SETTINGS_WRITE_DEBOUNCE_MS = 250;
const SETTINGS_SYNC_DEBOUNCE_MS = 800;

let pendingSettingsWrite: SudokuSettingsV1 | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function defaultSettings(deviceId: string): SudokuSettingsV1 {
  return {
    schemaVersion: 1,
    kind: 'sudoku_settings',
    updatedAtMs: 0,
    updatedByDeviceId: deviceId,
    extra: {},
  };
}

/**
 * Update settings immediately in the in-memory store, then persist + (best-effort) sync
 * in a debounced manner to avoid spamming storage/network while users drag controls.
 */
export function updateLocalSettings(next: SudokuSettingsV1): void {
  const store = useSettingsStore.getState();
  store.setSettings(next);

  pendingSettingsWrite = next;

  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const toWrite = pendingSettingsWrite;
    pendingSettingsWrite = null;
    writeTimer = null;
    if (!toWrite) return;
    void saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: toWrite });
  }, SETTINGS_WRITE_DEBOUNCE_MS);

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncSettingsOnce();
  }, SETTINGS_SYNC_DEBOUNCE_MS);
}

export async function loadLocalSettings(): Promise<SudokuSettingsV1> {
  const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';

  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const parsed = saved?.data;
  if (isSudokuSettingsV1(parsed)) {
    useSettingsStore.getState().setSettings(parsed);
    return parsed;
  }

  const created = defaultSettings(deviceId);
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: created });
  useSettingsStore.getState().setSettings(created);
  return created;
}

export async function syncSettingsOnce(): Promise<void> {
  const store = useSettingsStore.getState();
  store.setSync({ syncStatus: 'syncing', lastError: null });

  const local = store.settings ?? (await loadLocalSettings());

  const pulled = await pullSave(SLOT);
  if (!pulled.ok) {
    // Expected when signed out; keep settings local-only until authenticated.
    if (pulled.error.code === 'not_authenticated') {
      store.setSync({ syncStatus: 'idle', lastError: null });
      return;
    }
    store.setSync({ syncStatus: 'error', lastError: pulled.error.message });
    return;
  }

  const remoteRaw = pulled.data;
  const remote = remoteRaw == null ? null : isSudokuSettingsV1(remoteRaw) ? remoteRaw : null;
  if (remoteRaw != null && !remote) {
    store.setSync({ syncStatus: 'error', lastError: 'Remote settings invalid' });
    return;
  }

  const winner = remote ? mergeSettingsLww(local, remote) : local;
  if (winner !== local) {
    await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: winner });
    store.setSettings(winner);
  }

  // If local is newer (or remote missing), push local.
  if (!remote || winner === local) {
    const pushed = await pushSave(SLOT, winner);
    if (!pushed.ok) {
      store.setSync({ syncStatus: 'error', lastError: pushed.error.message });
      return;
    }
    // If not applied (expected when not configured / signed out), report idle rather than ok.
    if (!pushed.applied) {
      store.setSync({ syncStatus: 'idle', lastError: null });
      return;
    }
  }

  store.setSync({ syncStatus: 'ok', lastSyncAtMs: Date.now(), lastError: null });
}


