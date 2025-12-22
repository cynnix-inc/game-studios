import { useSettingsStore } from '../../state/useSettingsStore';

jest.useFakeTimers();

const writeMock = jest.fn();
const readMock = jest.fn();

jest.mock('@cynnix-studios/game-foundation', () => ({
  createSaveService: () => ({
    local: {
      read: readMock,
      write: writeMock,
      clear: jest.fn(),
    },
    cloud: {
      pull: jest.fn(),
      push: jest.fn(),
    },
  }),
}));

const pullSaveMock = jest.fn();
const pushSaveMock = jest.fn();

jest.mock('../sync', () => ({
  pullSave: (...args: unknown[]) => pullSaveMock(...args),
  pushSave: (...args: unknown[]) => pushSaveMock(...args),
}));

import { updateLocalSettings } from '../settings';
import type { SudokuSettingsV1 } from '../settingsModel';

describe('Epic 9 settings: updateLocalSettings debounces local persistence + sync', () => {
  beforeEach(() => {
    writeMock.mockClear();
    readMock.mockClear();
    pullSaveMock.mockClear();
    pushSaveMock.mockClear();
    useSettingsStore.setState({ settings: null, syncStatus: 'idle', lastSyncAtMs: null, lastError: null });
  });

  test('coalesces rapid updates: last update wins; one local write + one sync attempt', async () => {
    const s1: SudokuSettingsV1 = {
      schemaVersion: 1,
      kind: 'sudoku_settings',
      updatedAtMs: 1,
      updatedByDeviceId: 'device-a',
      ui: { gridSize: 36, numberFontScale: 1, noteFontScale: 1 },
      extra: {},
    };
    const s2: SudokuSettingsV1 = {
      ...s1,
      updatedAtMs: 2,
      ui: { gridSize: 40, numberFontScale: 1.2, noteFontScale: 0.9 },
    };

    // Make syncSettingsOnce exit early with not_authenticated (so no network-y behavior beyond pullSave).
    pullSaveMock.mockResolvedValue({ ok: false, error: { code: 'not_authenticated', message: 'not authed' } });

    updateLocalSettings(s1);
    updateLocalSettings(s2);

    // Store updates immediately.
    expect(useSettingsStore.getState().settings).toEqual(s2);

    // Before debounce, no writes/sync.
    expect(writeMock).not.toHaveBeenCalled();
    expect(pullSaveMock).not.toHaveBeenCalled();

    // Flush local write debounce (250ms).
    await jest.advanceTimersByTimeAsync(260);
    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeMock.mock.calls[0]?.[0]).toMatchObject({ gameKey: 'sudoku', slot: 'settings', data: s2 });

    // Flush sync debounce (800ms).
    await jest.advanceTimersByTimeAsync(600);
    expect(pullSaveMock).toHaveBeenCalledTimes(1);
  });
});


