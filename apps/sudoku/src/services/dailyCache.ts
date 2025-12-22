import type { SaveService } from '@cynnix-studios/game-foundation';
import { computeDailyCacheKeysToEvict, type DailyManifestV1, type DailyPayloadV1 } from '@cynnix-studios/sudoku-core';

const GAME_KEY = 'sudoku';
const DAILY_SLOT_PREFIX = 'daily:';
const DAILY_INDEX_SLOT = 'daily:index';

function dailySlot(dateKey: string) {
  return `${DAILY_SLOT_PREFIX}${dateKey}`;
}

export type DailyCacheIndexV1 = {
  v: 1;
  cachedDateKeys: string[];
};

function normalizeUniqueDateKeys(keys: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export async function readDailyCacheIndex(saveService: SaveService): Promise<DailyCacheIndexV1> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, DAILY_INDEX_SLOT);
  if (!saved) return { v: 1, cachedDateKeys: [] };
  const raw = saved.data as Record<string, unknown>;
  if (raw.v !== 1 || !Array.isArray(raw.cachedDateKeys)) return { v: 1, cachedDateKeys: [] };
  const keys = raw.cachedDateKeys.filter((x): x is string => typeof x === 'string');
  return { v: 1, cachedDateKeys: normalizeUniqueDateKeys(keys) };
}

export async function writeDailyCacheIndex(saveService: SaveService, index: DailyCacheIndexV1): Promise<void> {
  await saveService.local.write({
    gameKey: GAME_KEY,
    slot: DAILY_INDEX_SLOT,
    data: { v: 1, cachedDateKeys: normalizeUniqueDateKeys(index.cachedDateKeys) },
  });
}

export async function upsertDailyIndexForDateKey(saveService: SaveService, dateKey: string): Promise<void> {
  const idx = await readDailyCacheIndex(saveService);
  if (idx.cachedDateKeys.includes(dateKey)) return;
  await writeDailyCacheIndex(saveService, { v: 1, cachedDateKeys: [...idx.cachedDateKeys, dateKey] });
}

export async function evictDailiesNotInKeepSet(saveService: SaveService, keepDateKeys: string[]): Promise<string[]> {
  const idx = await readDailyCacheIndex(saveService);
  const evict = computeDailyCacheKeysToEvict({ cachedKeys: idx.cachedDateKeys, keepKeys: keepDateKeys });
  if (evict.length === 0) return [];

  for (const dateKey of evict) {
    await saveService.local.clear(GAME_KEY, dailySlot(dateKey));
  }

  await writeDailyCacheIndex(saveService, {
    v: 1,
    cachedDateKeys: idx.cachedDateKeys.filter((k) => !evict.includes(k)),
  });

  return evict;
}

/**
 * Opportunistically ensure the keep set is cached locally and evict older cached dailies beyond the keep set.
 * Pure IO orchestration: callers should run it in the background (non-blocking).
 */
export async function warmDailyCacheAndEvict(args: {
  saveService: SaveService;
  manifest: DailyManifestV1;
  keepDateKeys: string[];
  fetchPayload: (url: string) => Promise<DailyPayloadV1>;
  resolveUrl: (entryUrl: string) => string;
}): Promise<{ downloaded: string[]; evicted: string[] }> {
  const downloaded: string[] = [];

  // Load index once, then keep it consistent through the loop.
  let idx = await readDailyCacheIndex(args.saveService);

  for (const dateKey of args.keepDateKeys) {
    const slot = dailySlot(dateKey);
    const existing = await args.saveService.local.read<Record<string, unknown>>(GAME_KEY, slot);
    if (existing) {
      if (!idx.cachedDateKeys.includes(dateKey)) {
        idx = { v: 1, cachedDateKeys: [...idx.cachedDateKeys, dateKey] };
        await writeDailyCacheIndex(args.saveService, idx);
      }
      continue;
    }

    const entry = args.manifest.entries.find((e) => e.date_key === dateKey);
    if (!entry) continue;

    const payload = await args.fetchPayload(args.resolveUrl(entry.url));
    await args.saveService.local.write({
      gameKey: GAME_KEY,
      slot,
      data: payload,
    });
    downloaded.push(dateKey);

    if (!idx.cachedDateKeys.includes(dateKey)) {
      idx = { v: 1, cachedDateKeys: [...idx.cachedDateKeys, dateKey] };
      await writeDailyCacheIndex(args.saveService, idx);
    }
  }

  const evicted = await evictDailiesNotInKeepSet(args.saveService, args.keepDateKeys);
  return { downloaded, evicted };
}


