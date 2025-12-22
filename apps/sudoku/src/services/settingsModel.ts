export type SudokuSettingsV1 = {
  schemaVersion: 1;
  kind: 'sudoku_settings';
  /**
   * Client-side monotonic-ish timestamp. Used for LWW merge.
   */
  updatedAtMs: number;
  /**
   * Stable per-install device id; used as a deterministic tiebreaker when timestamps match.
   */
  updatedByDeviceId: string;
  /**
   * Extensible payload. We keep known namespaces optional for MVP plumbing.
   */
  ui?: {
    gridSize?: unknown;
    numberFontScale?: unknown;
    noteFontScale?: unknown;
  };
  toggles?: {
    sound?: unknown;
    haptics?: unknown;
  };
  extra?: Record<string, unknown>;
};

export type UiSizingSettings = {
  gridSize: number;
  numberFontScale: number;
  noteFontScale: number;
};

export const UI_SIZING_LIMITS = {
  gridSize: { min: 28, max: 56, step: 1, default: 36 },
  numberFontScale: { min: 0.85, max: 1.35, step: 0.05, default: 1.0 },
  noteFontScale: { min: 0.7, max: 1.25, step: 0.05, default: 1.0 },
} as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function clampFiniteNumber(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

export function isSudokuSettingsV1(v: unknown): v is SudokuSettingsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_settings') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  return true;
}

export function getUiSizingSettings(settings: SudokuSettingsV1): UiSizingSettings {
  const ui = settings.ui;
  return {
    gridSize: clampFiniteNumber(
      ui?.gridSize,
      UI_SIZING_LIMITS.gridSize.min,
      UI_SIZING_LIMITS.gridSize.max,
      UI_SIZING_LIMITS.gridSize.default,
    ),
    numberFontScale: clampFiniteNumber(
      ui?.numberFontScale,
      UI_SIZING_LIMITS.numberFontScale.min,
      UI_SIZING_LIMITS.numberFontScale.max,
      UI_SIZING_LIMITS.numberFontScale.default,
    ),
    noteFontScale: clampFiniteNumber(
      ui?.noteFontScale,
      UI_SIZING_LIMITS.noteFontScale.min,
      UI_SIZING_LIMITS.noteFontScale.max,
      UI_SIZING_LIMITS.noteFontScale.default,
    ),
  };
}

export function setUiSizingSettings(
  settings: SudokuSettingsV1,
  patch: Partial<UiSizingSettings>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const current = getUiSizingSettings(settings);
  const next: UiSizingSettings = {
    gridSize: clampFiniteNumber(
      patch.gridSize ?? current.gridSize,
      UI_SIZING_LIMITS.gridSize.min,
      UI_SIZING_LIMITS.gridSize.max,
      UI_SIZING_LIMITS.gridSize.default,
    ),
    numberFontScale: clampFiniteNumber(
      patch.numberFontScale ?? current.numberFontScale,
      UI_SIZING_LIMITS.numberFontScale.min,
      UI_SIZING_LIMITS.numberFontScale.max,
      UI_SIZING_LIMITS.numberFontScale.default,
    ),
    noteFontScale: clampFiniteNumber(
      patch.noteFontScale ?? current.noteFontScale,
      UI_SIZING_LIMITS.noteFontScale.min,
      UI_SIZING_LIMITS.noteFontScale.max,
      UI_SIZING_LIMITS.noteFontScale.default,
    ),
  };

  return {
    ...settings,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    ui: {
      ...(isObject(settings.ui) ? settings.ui : undefined),
      gridSize: next.gridSize,
      numberFontScale: next.numberFontScale,
      noteFontScale: next.noteFontScale,
    },
  };
}

export function mergeSettingsLww(local: SudokuSettingsV1, remote: SudokuSettingsV1): SudokuSettingsV1 {
  if (remote.updatedAtMs > local.updatedAtMs) return remote;
  if (remote.updatedAtMs < local.updatedAtMs) return local;
  // Deterministic tie-breaker: higher device id wins.
  return remote.updatedByDeviceId > local.updatedByDeviceId ? remote : local;
}


