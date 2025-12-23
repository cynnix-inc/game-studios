import { getSettingsToggles, setSettingsToggles, type SudokuSettingsV1 } from '../settingsModel';

describe('settingsModel: toggles', () => {
  function baseSettings(overrides?: Partial<SudokuSettingsV1>): SudokuSettingsV1 {
    return {
      schemaVersion: 1,
      kind: 'sudoku_settings',
      updatedAtMs: 0,
      updatedByDeviceId: 'device-a',
      extra: {},
      ...overrides,
    };
  }

  test('getSettingsToggles defaults to enabled when toggles namespace missing/invalid', () => {
    expect(getSettingsToggles(baseSettings({ toggles: undefined }))).toEqual({ soundEnabled: true, hapticsEnabled: true });
    expect(getSettingsToggles(baseSettings({ toggles: { sound: 'nope', haptics: 123 } }))).toEqual({
      soundEnabled: true,
      hapticsEnabled: true,
    });
  });

  test('setSettingsToggles updates values and stamps updatedAtMs/updatedByDeviceId', () => {
    const s0 = baseSettings();
    const s1 = setSettingsToggles(s0, { soundEnabled: false }, { updatedAtMs: 1234, updatedByDeviceId: 'device-b' });

    expect(s1).not.toBe(s0);
    expect(s1.updatedAtMs).toBe(1234);
    expect(s1.updatedByDeviceId).toBe('device-b');
    expect(getSettingsToggles(s1)).toEqual({ soundEnabled: false, hapticsEnabled: true });
  });
});


