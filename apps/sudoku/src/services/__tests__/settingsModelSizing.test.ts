import { getGridHighlightSettings, getUiSizingSettings, setGridCustomizationSettings, setUiSizingSettings, HIGHLIGHT_LIMITS, UI_SIZING_LIMITS, type SudokuSettingsV1 } from '../settingsModel';

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
      gridSizePct: UI_SIZING_LIMITS.gridSizePct.default,
      digitSizePct: UI_SIZING_LIMITS.digitSizePct.default,
      noteSizePct: UI_SIZING_LIMITS.noteSizePct.default,
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
      gridSizePct: UI_SIZING_LIMITS.gridSizePct.default,
      digitSizePct: UI_SIZING_LIMITS.digitSizePct.allowed[UI_SIZING_LIMITS.digitSizePct.allowed.length - 1],
      noteSizePct: UI_SIZING_LIMITS.noteSizePct.allowed[0],
    });
  });

  test('getUiSizingSettings migrates legacy (px/multiplier) values into Make percent units', () => {
    const s = baseSettings({
      ui: {
        gridSize: 36, // legacy px-ish (maps to M)
        numberFontScale: 1.1, // legacy multiplier (-> 110)
        noteFontScale: 1.0, // legacy multiplier (-> 200)
      },
    });
    expect(getUiSizingSettings(s)).toEqual({
      gridSizePct: 100,
      digitSizePct: 100,
      noteSizePct: 200,
    });
  });

  test('setUiSizingSettings updates sizing + stamps updatedAtMs and updatedByDeviceId', () => {
    const s0 = baseSettings({
      ui: { gridSize: 100, numberFontScale: 100, noteFontScale: 200 },
    });

    const s1 = setUiSizingSettings(
      s0,
      { gridSizePct: 115, digitSizePct: 110 },
      { updatedAtMs: 1234, updatedByDeviceId: 'device-b' },
    );

    expect(s1).not.toBe(s0);
    expect(s1.updatedAtMs).toBe(1234);
    expect(s1.updatedByDeviceId).toBe('device-b');
    expect(getUiSizingSettings(s1)).toEqual({
      gridSizePct: 120,
      digitSizePct: 100,
      noteSizePct: 200,
    });
  });

  test('getGridHighlightSettings returns defaults when missing', () => {
    const s = baseSettings({ ui: undefined });
    expect(getGridHighlightSettings(s)).toEqual({
      highlightContrast: HIGHLIGHT_LIMITS.contrast.default,
      highlightAssistance: true,
    });
  });

  test('setGridCustomizationSettings updates sizing + highlight settings in one stamp', () => {
    const s0 = baseSettings({
      ui: { gridSize: 100, numberFontScale: 100, noteFontScale: 200, highlightContrast: 0, highlightAssistance: false },
    });

    const s1 = setGridCustomizationSettings(
      s0,
      { gridSizePct: 115, digitSizePct: 110, highlightContrast: 150 },
      { updatedAtMs: 1234, updatedByDeviceId: 'device-b' },
    );

    expect(s1).not.toBe(s0);
    expect(s1.updatedAtMs).toBe(1234);
    expect(s1.updatedByDeviceId).toBe('device-b');
    expect(getUiSizingSettings(s1)).toEqual({
      gridSizePct: 120,
      digitSizePct: 100,
      noteSizePct: 200,
    });
    expect(getGridHighlightSettings(s1)).toEqual({
      highlightContrast: 150,
      highlightAssistance: true,
    });
  });
});


