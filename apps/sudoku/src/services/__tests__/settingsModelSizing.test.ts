import { getUiSizingSettings, setUiSizingSettings, UI_SIZING_LIMITS, type SudokuSettingsV1 } from '../settingsModel';

describe('Epic 9 settings: UI sizing (grid + font scales)', () => {
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

  test('getUiSizingSettings returns defaults when ui namespace missing', () => {
    const s = baseSettings({ ui: undefined });
    expect(getUiSizingSettings(s)).toEqual({
      gridSize: UI_SIZING_LIMITS.gridSize.default,
      numberFontScale: UI_SIZING_LIMITS.numberFontScale.default,
      noteFontScale: UI_SIZING_LIMITS.noteFontScale.default,
    });
  });

  test('getUiSizingSettings clamps invalid values to defaults/ranges', () => {
    const s = baseSettings({
      ui: {
        gridSize: Number.NaN,
        numberFontScale: 999,
        noteFontScale: -123,
      },
    });
    expect(getUiSizingSettings(s)).toEqual({
      gridSize: UI_SIZING_LIMITS.gridSize.default,
      numberFontScale: UI_SIZING_LIMITS.numberFontScale.max,
      noteFontScale: UI_SIZING_LIMITS.noteFontScale.min,
    });
  });

  test('setUiSizingSettings updates sizing + stamps updatedAtMs and updatedByDeviceId', () => {
    const s0 = baseSettings({
      ui: { gridSize: 36, numberFontScale: 1, noteFontScale: 1 },
    });

    const s1 = setUiSizingSettings(
      s0,
      { gridSize: 40, numberFontScale: 1.2 },
      { updatedAtMs: 1234, updatedByDeviceId: 'device-b' },
    );

    expect(s1).not.toBe(s0);
    expect(s1.updatedAtMs).toBe(1234);
    expect(s1.updatedByDeviceId).toBe('device-b');
    expect(getUiSizingSettings(s1)).toEqual({
      gridSize: 40,
      numberFontScale: 1.2,
      noteFontScale: 1,
    });
  });
});


