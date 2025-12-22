export type SudokuStatsV1 = {
  schemaVersion: 1;
  kind: 'sudoku_stats';
  /**
   * Client-side monotonic-ish timestamp. Used for LWW merge.
   */
  updatedAtMs: number;
  /**
   * Stable per-install device id; used as deterministic tiebreaker when timestamps match.
   */
  updatedByDeviceId: string;
  daily: {
    completedCount: number;
    rankedCount: number;
    replayCount: number;
  };
  free: {
    completedCount: number;
  };
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isFiniteNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;
}

export function isSudokuStatsV1(v: unknown): v is SudokuStatsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_stats') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;

  if (!isObject(v.daily) || !isObject(v.free)) return false;
  const daily = v.daily as Record<string, unknown>;
  const free = v.free as Record<string, unknown>;
  if (!isFiniteNonNegativeInt(daily.completedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.rankedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.replayCount)) return false;
  if (!isFiniteNonNegativeInt(free.completedCount)) return false;
  return true;
}

export function mergeStatsLww(local: SudokuStatsV1, remote: SudokuStatsV1): SudokuStatsV1 {
  if (remote.updatedAtMs > local.updatedAtMs) return remote;
  if (remote.updatedAtMs < local.updatedAtMs) return local;
  return remote.updatedByDeviceId > local.updatedByDeviceId ? remote : local;
}


