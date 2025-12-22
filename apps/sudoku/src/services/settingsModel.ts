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

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isSudokuSettingsV1(v: unknown): v is SudokuSettingsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_settings') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  return true;
}

export function mergeSettingsLww(local: SudokuSettingsV1, remote: SudokuSettingsV1): SudokuSettingsV1 {
  if (remote.updatedAtMs > local.updatedAtMs) return remote;
  if (remote.updatedAtMs < local.updatedAtMs) return local;
  // Deterministic tie-breaker: higher device id wins.
  return remote.updatedByDeviceId > local.updatedByDeviceId ? remote : local;
}


