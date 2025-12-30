import { Platform } from 'react-native';

import { createSaveService } from '@cynnix-studios/game-foundation';

const GAME_KEY = 'sudoku';
const SLOT = 'lockModePreference';
const WEB_KEY = 'lockModePreference';

const saveService = createSaveService();

export async function readLockModePreference(): Promise<boolean | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(WEB_KEY);
    if (raw == null) return null;
    return raw === 'true';
  }

  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const data = saved?.data;
  if (data && typeof data === 'object' && 'enabled' in data && typeof (data as { enabled?: unknown }).enabled === 'boolean') {
    return (data as { enabled: boolean }).enabled;
  }
  return null;
}

export async function writeLockModePreference(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(WEB_KEY, enabled ? 'true' : 'false');
    return;
  }
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: { enabled } });
}

export async function clearLockModePreference(): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(WEB_KEY);
    return;
  }
  await saveService.local.clear(GAME_KEY, SLOT);
}


