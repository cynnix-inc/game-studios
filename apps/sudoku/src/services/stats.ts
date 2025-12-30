import { createSaveService } from '@cynnix-studios/game-foundation';

import { usePlayerStore } from '../state/usePlayerStore';
import {
  isSudokuStatsV1,
  isSudokuStatsV2,
  isSudokuStatsV3,
  mergeStatsV3,
  type BucketAggV3,
  type RunAggV3,
  type RunModeKey,
  type SudokuStatsDeviceV3,
  type SudokuStatsV1,
  type SudokuStatsV2,
  type SudokuStatsV3,
} from './statsModel';
import { pullSave, pushSave } from './sync';

const GAME_KEY = 'sudoku';
const SLOT = 'stats';

const saveService = createSaveService();

function emptyBucketAgg(): BucketAggV3 {
  const emptyRun: RunAggV3 = {
    totalTimeMs: 0,
    totalSetCount: 0,
    totalClearCount: 0,
    totalNoteAddCount: 0,
    totalNoteRemoveCount: 0,
    totalMistakesCount: 0,
    totalHintsUsedCount: 0,
    hintBreakdown: {},
  };
  return { startedCount: 0, completedCount: 0, abandonedCount: 0, completed: { ...emptyRun }, abandoned: { ...emptyRun } };
}

function defaultStatsV3(deviceId: string): SudokuStatsV3 {
  return {
    schemaVersion: 3,
    kind: 'sudoku_stats',
    updatedAtMs: 0,
    updatedByDeviceId: deviceId,
    devices: {
      [deviceId]: {
        updatedAtMs: 0,
        buckets: {},
        daily: { rankedCount: 0, replayCount: 0 },
      },
    },
  };
}

function ensureDevice(stats: SudokuStatsV3, deviceId: string): SudokuStatsDeviceV3 {
  const existing = stats.devices[deviceId];
  if (existing) return existing;
  const created: SudokuStatsDeviceV3 = { updatedAtMs: 0, buckets: {}, daily: { rankedCount: 0, replayCount: 0 } };
  stats.devices[deviceId] = created;
  return created;
}

function encodeKeyPart(v: string): string {
  return encodeURIComponent(v);
}

export function makeRunBucketKey(args: {
  mode: RunModeKey;
  variantId: string;
  subVariantId?: string | null;
  difficulty?: string | null;
  zen: boolean;
}): string {
  const mode = encodeKeyPart(args.mode);
  const variantId = encodeKeyPart(args.variantId);
  const sub = encodeKeyPart(args.subVariantId ?? 'none');
  const difficulty = encodeKeyPart(args.difficulty ?? 'unknown');
  const zen = args.zen ? '1' : '0';
  return `${mode}::${variantId}::${sub}::${difficulty}::${zen}`;
}

function migrateV1ToV3(v1: SudokuStatsV1, deviceId: string): SudokuStatsV3 {
  // We can't backfill per-difficulty/variant from V1, so we preserve counts into a single legacy bucket.
  const legacyBucket = makeRunBucketKey({ mode: 'free', variantId: 'legacy', subVariantId: null, difficulty: 'unknown', zen: false });
  const dev: SudokuStatsDeviceV3 = {
    updatedAtMs: v1.updatedAtMs,
    buckets: {
      [legacyBucket]: {
        ...emptyBucketAgg(),
        completedCount: v1.free.completedCount,
      },
    },
    daily: {
      rankedCount: v1.daily.rankedCount,
      replayCount: v1.daily.replayCount,
    },
  };
  return {
    schemaVersion: 3,
    kind: 'sudoku_stats',
    updatedAtMs: v1.updatedAtMs,
    updatedByDeviceId: v1.updatedByDeviceId || deviceId,
    devices: { [deviceId]: dev },
  };
}

function migrateV2ToV3(v2: SudokuStatsV2): SudokuStatsV3 {
  const devices: Record<string, SudokuStatsDeviceV3> = {};
  for (const [deviceId, dev] of Object.entries(v2.devices)) {
    const buckets: Record<string, BucketAggV3> = {};
    const rawBuckets = dev.buckets as Record<string, unknown>;
    for (const [bucketKey, raw] of Object.entries(rawBuckets)) {
      const b = (typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
      const n = (k: string): number => (typeof b[k] === 'number' && Number.isFinite(b[k]) ? (b[k] as number) : 0);
      // Best-effort migration: treat the old totals as "completed" aggregates.
      const completed: RunAggV3 = {
        totalTimeMs: n('totalPlayTimeMs'),
        totalSetCount: n('totalSetCount'),
        totalClearCount: n('totalClearCount'),
        totalNoteAddCount: n('totalNoteAddCount'),
        totalNoteRemoveCount: n('totalNoteRemoveCount'),
        totalMistakesCount: n('totalMistakesCount'),
        totalHintsUsedCount: n('totalHintsUsedCount'),
        hintBreakdown: (typeof b.hintBreakdown === 'object' && b.hintBreakdown !== null ? b.hintBreakdown : {}) as RunAggV3['hintBreakdown'],
      };
      const empty: RunAggV3 = { totalTimeMs: 0, totalSetCount: 0, totalClearCount: 0, totalNoteAddCount: 0, totalNoteRemoveCount: 0, totalMistakesCount: 0, totalHintsUsedCount: 0, hintBreakdown: {} };
      buckets[bucketKey] = {
        startedCount: n('startedCount'),
        completedCount: n('completedCount'),
        abandonedCount: n('abandonedCount'),
        completed,
        abandoned: empty,
      };
    }
    devices[deviceId] = { updatedAtMs: dev.updatedAtMs, buckets, daily: dev.daily };
  }
  return {
    schemaVersion: 3,
    kind: 'sudoku_stats',
    updatedAtMs: v2.updatedAtMs,
    updatedByDeviceId: v2.updatedByDeviceId,
    devices,
  };
}

export async function loadLocalStats(): Promise<SudokuStatsV3> {
  const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const parsed = saved?.data;
  if (isSudokuStatsV3(parsed)) return parsed;
  if (isSudokuStatsV2(parsed)) {
    const migrated = migrateV2ToV3(parsed);
    await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: migrated });
    return migrated;
  }
  if (isSudokuStatsV1(parsed)) {
    const migrated = migrateV1ToV3(parsed, deviceId);
    await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: migrated });
    return migrated;
  }

  const created = defaultStatsV3(deviceId);
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: created });
  return created;
}

async function writeLocalStats(next: SudokuStatsV3): Promise<void> {
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: next });
}

async function updateStats(mutator: (prev: SudokuStatsV3) => SudokuStatsV3): Promise<SudokuStatsV3> {
  const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
  const prev = await loadLocalStats();
  const next = mutator(prev);
  const stamped: SudokuStatsV3 = {
    ...next,
    updatedAtMs: Date.now(),
    updatedByDeviceId: deviceId,
  };
  await writeLocalStats(stamped);
  return stamped;
}

// Backward-compatible helpers (used by older call sites).
export async function recordFreePlayCompleted(): Promise<void> {
  await recordRunCompleted({
    mode: 'free',
    variantId: 'legacy',
    subVariantId: null,
    difficulty: 'unknown',
    zen: false,
    playTimeMs: 0,
    setCount: 0,
    clearCount: 0,
    noteAddCount: 0,
    noteRemoveCount: 0,
    mistakesCount: 0,
    hintsUsedCount: 0,
    hintBreakdown: {},
  });
}

export async function recordDailyCompleted(): Promise<void> {
  await recordRunCompleted({
    mode: 'daily',
    variantId: 'legacy',
    subVariantId: null,
    difficulty: 'unknown',
    zen: false,
    playTimeMs: 0,
    setCount: 0,
    clearCount: 0,
    noteAddCount: 0,
    noteRemoveCount: 0,
    mistakesCount: 0,
    hintsUsedCount: 0,
    hintBreakdown: {},
  });
}

export async function recordRunStarted(args: {
  mode: RunModeKey;
  variantId: string;
  subVariantId?: string | null;
  difficulty?: string | null;
  zen: boolean;
}): Promise<void> {
  await updateStats((s) => {
    const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
    const next: SudokuStatsV3 = { ...s, devices: { ...s.devices } };
    const dev = ensureDevice(next, deviceId);
    const bucketKey = makeRunBucketKey(args);
    const bucket = dev.buckets[bucketKey] ?? emptyBucketAgg();
    dev.buckets = { ...dev.buckets, [bucketKey]: { ...bucket, startedCount: bucket.startedCount + 1 } };
    dev.updatedAtMs = Date.now();
    next.devices[deviceId] = dev;
    return next;
  });
}

export async function recordRunCompleted(args: {
  mode: RunModeKey;
  variantId: string;
  subVariantId?: string | null;
  difficulty?: string | null;
  zen: boolean;
  playTimeMs: number;
  setCount: number;
  clearCount: number;
  noteAddCount: number;
  noteRemoveCount: number;
  mistakesCount: number;
  hintsUsedCount: number;
  hintBreakdown: RunAggV3['hintBreakdown'];
}): Promise<void> {
  await updateStats((s) => {
    const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
    const next: SudokuStatsV3 = { ...s, devices: { ...s.devices } };
    const dev = ensureDevice(next, deviceId);
    const bucketKey = makeRunBucketKey(args);
    const prevBucket = dev.buckets[bucketKey] ?? emptyBucketAgg();
    const merged: BucketAggV3 = {
      startedCount: prevBucket.startedCount,
      completedCount: prevBucket.completedCount + 1,
      abandonedCount: prevBucket.abandonedCount,
      completed: {
        totalTimeMs: prevBucket.completed.totalTimeMs + Math.max(0, args.playTimeMs),
        totalSetCount: prevBucket.completed.totalSetCount + Math.max(0, args.setCount),
        totalClearCount: prevBucket.completed.totalClearCount + Math.max(0, args.clearCount),
        totalNoteAddCount: prevBucket.completed.totalNoteAddCount + Math.max(0, args.noteAddCount),
        totalNoteRemoveCount: prevBucket.completed.totalNoteRemoveCount + Math.max(0, args.noteRemoveCount),
        totalMistakesCount: prevBucket.completed.totalMistakesCount + Math.max(0, args.mistakesCount),
        totalHintsUsedCount: prevBucket.completed.totalHintsUsedCount + Math.max(0, args.hintsUsedCount),
        hintBreakdown: { ...prevBucket.completed.hintBreakdown },
      },
      abandoned: prevBucket.abandoned,
    };
    for (const [k, v] of Object.entries(args.hintBreakdown) as Array<[keyof RunAggV3['hintBreakdown'], number]>) {
      merged.completed.hintBreakdown[k] = (merged.completed.hintBreakdown[k] ?? 0) + Math.max(0, v);
    }
    dev.buckets = { ...dev.buckets, [bucketKey]: merged };
    dev.updatedAtMs = Date.now();
    next.devices[deviceId] = dev;
    return next;
  });
}

export async function recordRunAbandoned(args: {
  mode: RunModeKey;
  variantId: string;
  subVariantId?: string | null;
  difficulty?: string | null;
  zen: boolean;
  playTimeMs: number;
  setCount: number;
  clearCount: number;
  noteAddCount: number;
  noteRemoveCount: number;
  mistakesCount: number;
  hintsUsedCount: number;
  hintBreakdown: RunAggV3['hintBreakdown'];
}): Promise<void> {
  await updateStats((s) => {
    const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
    const next: SudokuStatsV3 = { ...s, devices: { ...s.devices } };
    const dev = ensureDevice(next, deviceId);
    const bucketKey = makeRunBucketKey(args);
    const prevBucket = dev.buckets[bucketKey] ?? emptyBucketAgg();
    const merged: BucketAggV3 = {
      startedCount: prevBucket.startedCount,
      completedCount: prevBucket.completedCount,
      abandonedCount: prevBucket.abandonedCount + 1,
      completed: prevBucket.completed,
      abandoned: {
        totalTimeMs: prevBucket.abandoned.totalTimeMs + Math.max(0, args.playTimeMs),
        totalSetCount: prevBucket.abandoned.totalSetCount + Math.max(0, args.setCount),
        totalClearCount: prevBucket.abandoned.totalClearCount + Math.max(0, args.clearCount),
        totalNoteAddCount: prevBucket.abandoned.totalNoteAddCount + Math.max(0, args.noteAddCount),
        totalNoteRemoveCount: prevBucket.abandoned.totalNoteRemoveCount + Math.max(0, args.noteRemoveCount),
        totalMistakesCount: prevBucket.abandoned.totalMistakesCount + Math.max(0, args.mistakesCount),
        totalHintsUsedCount: prevBucket.abandoned.totalHintsUsedCount + Math.max(0, args.hintsUsedCount),
        hintBreakdown: { ...prevBucket.abandoned.hintBreakdown },
      },
    };
    for (const [k, v] of Object.entries(args.hintBreakdown) as Array<[keyof RunAggV3['hintBreakdown'], number]>) {
      merged.abandoned.hintBreakdown[k] = (merged.abandoned.hintBreakdown[k] ?? 0) + Math.max(0, v);
    }
    dev.buckets = { ...dev.buckets, [bucketKey]: merged };
    dev.updatedAtMs = Date.now();
    next.devices[deviceId] = dev;
    return next;
  });
}

export async function recordDailySubmissionResult(args: { rankedSubmission: boolean }): Promise<void> {
  await updateStats((s) => {
    const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
    const next: SudokuStatsV3 = { ...s, devices: { ...s.devices } };
    const dev = ensureDevice(next, deviceId);
    dev.daily = {
      rankedCount: dev.daily.rankedCount + (args.rankedSubmission ? 1 : 0),
      replayCount: dev.daily.replayCount + (args.rankedSubmission ? 0 : 1),
    };
    dev.updatedAtMs = Date.now();
    next.devices[deviceId] = dev;
    return next;
  });
}

export async function syncStatsOnce(): Promise<void> {
  const local = await loadLocalStats();
  const pulled = await pullSave(SLOT);
  if (!pulled.ok) {
    // Expected when signed out; keep stats local-only until authenticated.
    return;
  }

  const remoteRaw = pulled.data;
  const remote =
    remoteRaw == null
      ? null
      : isSudokuStatsV3(remoteRaw)
        ? remoteRaw
        : isSudokuStatsV2(remoteRaw)
          ? migrateV2ToV3(remoteRaw)
          : isSudokuStatsV1(remoteRaw)
            ? migrateV1ToV3(remoteRaw, usePlayerStore.getState().deviceId ?? 'unknown')
            : null;
  if (remoteRaw != null && !remote) {
    // Invalid remote stats; ignore rather than clobber local.
    return;
  }

  const winner = remote ? mergeStatsV3(local, remote) : local;
  if (winner !== local) await writeLocalStats(winner);

  // If local is newer (or remote missing), push local.
  if (!remote || winner === local) {
    await pushSave(SLOT, winner);
  }
}


