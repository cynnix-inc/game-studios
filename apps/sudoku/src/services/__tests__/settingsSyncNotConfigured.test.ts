import { useSettingsStore } from '../../state/useSettingsStore';

jest.mock('../sync', () => ({
  pullSave: jest.fn(async () => ({ ok: true, data: null })),
  pushSave: jest.fn(async () => ({ ok: true, applied: false, reason: 'not_configured' })),
}));

import { syncSettingsOnce } from '../settings';

describe('syncSettingsOnce', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        schemaVersion: 1,
        kind: 'sudoku_settings',
        updatedAtMs: 1,
        updatedByDeviceId: 'device-a',
        extra: {},
      },
      syncStatus: 'idle',
      lastSyncAtMs: null,
      lastError: null,
    });
  });

  test('when pushSave is not_configured, syncStatus returns to idle (not ok)', async () => {
    await syncSettingsOnce();
    const s = useSettingsStore.getState();
    expect(s.syncStatus).toBe('idle');
    expect(s.lastError).toBeNull();
  });
});


