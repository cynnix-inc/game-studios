import { create } from 'zustand';

import type { SudokuSettingsV1 } from '../services/settingsModel';

export type SettingsSyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

type SettingsState = {
  settings: SudokuSettingsV1 | null;
  syncStatus: SettingsSyncStatus;
  lastSyncAtMs: number | null;
  lastError: string | null;

  setSettings: (s: SudokuSettingsV1) => void;
  setSync: (args: Partial<Pick<SettingsState, 'syncStatus' | 'lastSyncAtMs' | 'lastError'>>) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  syncStatus: 'idle',
  lastSyncAtMs: null,
  lastError: null,

  setSettings: (s) => set({ settings: s }),
  setSync: (args) => set(args),
}));


