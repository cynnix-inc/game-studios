import type { HintType } from '@cynnix-studios/sudoku-core';

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

export type RunModeKey = 'daily' | 'free' | 'journey';

export type RunBucketKey = string;

export type RunAggV3 = {
  totalTimeMs: number;
  totalSetCount: number;
  totalClearCount: number;
  totalNoteAddCount: number;
  totalNoteRemoveCount: number;
  totalMistakesCount: number;
  totalHintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
};

export type BucketAggV3 = {
  startedCount: number;
  completedCount: number;
  abandonedCount: number;
  completed: RunAggV3;
  abandoned: RunAggV3;
};

export type SudokuStatsDeviceV3 = {
  /**
   * Per-device LWW stamp (for merge). This device's counters are monotonic.
   */
  updatedAtMs: number;
  buckets: Record<RunBucketKey, BucketAggV3>;
  daily: {
    rankedCount: number;
    replayCount: number;
  };
};

// --- Legacy V2 shapes (deprecated; used only for migration) ---
export type SudokuStatsDeviceV2 = {
  updatedAtMs: number;
  buckets: Record<string, unknown>;
  daily: { rankedCount: number; replayCount: number };
};

export type SudokuStatsV2 = {
  schemaVersion: 2;
  kind: 'sudoku_stats';
  updatedAtMs: number;
  updatedByDeviceId: string;
  /**
   * Merge-safe map: each device maintains its own monotonic counters. Merge picks the newest per device.
   */
  devices: Record<string, SudokuStatsDeviceV2>;
};

export type SudokuStatsV3 = {
  schemaVersion: 3;
  kind: 'sudoku_stats';
  updatedAtMs: number;
  updatedByDeviceId: string;
  devices: Record<string, SudokuStatsDeviceV3>;
};

export type SudokuStats = SudokuStatsV1 | SudokuStatsV2 | SudokuStatsV3;

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

function isBucketAggV2(v: unknown): boolean {
  // Legacy validator kept only for migrating old V2 data forward.
  // We intentionally keep it loose here since V2 is deprecated.
  return isObject(v);
}

function isFiniteNonNegativeNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isHintTypeKey(k: string): k is HintType {
  return (
    k === 'explain_technique' ||
    k === 'show_candidates' ||
    k === 'check_selected_cell' ||
    k === 'check_whole_board' ||
    k === 'reveal_cell_value'
  );
}

function isHintBreakdown(v: unknown): v is Partial<Record<HintType, number>> {
  if (!isObject(v)) return false;
  for (const [k, val] of Object.entries(v)) {
    if (!isHintTypeKey(k)) return false;
    if (!isFiniteNonNegativeInt(val)) return false;
  }
  return true;
}

function isRunAggV3(v: unknown): v is RunAggV3 {
  if (!isObject(v)) return false;
  return (
    isFiniteNonNegativeInt(v.totalSetCount) &&
    isFiniteNonNegativeInt(v.totalClearCount) &&
    isFiniteNonNegativeInt(v.totalNoteAddCount) &&
    isFiniteNonNegativeInt(v.totalNoteRemoveCount) &&
    isFiniteNonNegativeInt(v.totalMistakesCount) &&
    isFiniteNonNegativeInt(v.totalHintsUsedCount) &&
    isFiniteNonNegativeNumber(v.totalTimeMs) &&
    isHintBreakdown(v.hintBreakdown)
  );
}

function isBucketAggV3(v: unknown): v is BucketAggV3 {
  if (!isObject(v)) return false;
  return (
    isFiniteNonNegativeInt(v.startedCount) &&
    isFiniteNonNegativeInt(v.completedCount) &&
    isFiniteNonNegativeInt(v.abandonedCount) &&
    isObject(v.completed) &&
    isObject(v.abandoned) &&
    isRunAggV3(v.completed) &&
    isRunAggV3(v.abandoned)
  );
}

function isSudokuStatsDeviceV2(v: unknown): v is SudokuStatsDeviceV2 {
  if (!isObject(v)) return false;
  if (!isFiniteNonNegativeNumber(v.updatedAtMs)) return false;
  if (!isObject(v.buckets)) return false;
  if (!isObject(v.daily)) return false;
  const daily = v.daily as Record<string, unknown>;
  if (!isFiniteNonNegativeInt(daily.rankedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.replayCount)) return false;
  for (const bucket of Object.values(v.buckets)) {
    if (!isBucketAggV2(bucket)) return false;
  }
  return true;
}

export function isSudokuStatsV2(v: unknown): v is SudokuStatsV2 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 2) return false;
  if (v.kind !== 'sudoku_stats') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  if (!isObject(v.devices)) return false;
  for (const dev of Object.values(v.devices)) {
    if (!isSudokuStatsDeviceV2(dev)) return false;
  }
  return true;
}

function isSudokuStatsDeviceV3(v: unknown): v is SudokuStatsDeviceV3 {
  if (!isObject(v)) return false;
  if (!isFiniteNonNegativeNumber(v.updatedAtMs)) return false;
  if (!isObject(v.buckets)) return false;
  if (!isObject(v.daily)) return false;
  const daily = v.daily as Record<string, unknown>;
  if (!isFiniteNonNegativeInt(daily.rankedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.replayCount)) return false;
  for (const bucket of Object.values(v.buckets)) {
    if (!isBucketAggV3(bucket)) return false;
  }
  return true;
}

export function isSudokuStatsV3(v: unknown): v is SudokuStatsV3 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 3) return false;
  if (v.kind !== 'sudoku_stats') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  if (!isObject(v.devices)) return false;
  for (const dev of Object.values(v.devices)) {
    if (!isSudokuStatsDeviceV3(dev)) return false;
  }
  return true;
}

export function mergeStatsV3(local: SudokuStatsV3, remote: SudokuStatsV3): SudokuStatsV3 {
  const devices: Record<string, SudokuStatsDeviceV3> = { ...local.devices };
  for (const [deviceId, remoteDev] of Object.entries(remote.devices)) {
    const localDev = devices[deviceId];
    if (!localDev) {
      devices[deviceId] = remoteDev;
      continue;
    }
    if (remoteDev.updatedAtMs > localDev.updatedAtMs) {
      devices[deviceId] = remoteDev;
      continue;
    }
  }

  const updatedAtMs = Math.max(local.updatedAtMs, remote.updatedAtMs);
  const updatedByDeviceId = remote.updatedAtMs > local.updatedAtMs ? remote.updatedByDeviceId : local.updatedByDeviceId;

  return {
    schemaVersion: 3,
    kind: 'sudoku_stats',
    updatedAtMs,
    updatedByDeviceId,
    devices,
  };
}


