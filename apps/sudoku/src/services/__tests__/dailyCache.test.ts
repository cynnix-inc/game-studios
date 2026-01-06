import { createSaveService, type SaveStorage } from '@cynnix-studios/game-foundation';
import type { DailyManifestV1, DailyPayloadV1 } from '@cynnix-studios/sudoku-core';

import { readDailyCacheIndex, warmDailyCacheAndEvict } from '../dailyCache';

const VALID_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const VALID_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

function makeMemoryStorage(): SaveStorage {
  const map = new Map<string, string>();
  return {
    async getItem(key: string) {
      return map.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      map.set(key, value);
    },
    async removeItem(key: string) {
      map.delete(key);
    },
  };
}

function makeDateKey(n: number): string {
  return `2025-12-${String(n).padStart(2, '0')}`;
}

function payloadFor(dateKey: string): DailyPayloadV1 {
  return {
    schema_version: 1,
    date_key: dateKey,
    difficulty: 'novice',
    puzzle: VALID_PUZZLE,
    solution: VALID_SOLUTION,
  };
}

describe('daily cache warm + eviction', () => {
  test('evicts cached dailies beyond keep set and downloads missing keep payloads', async () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });

    const cached = Array.from({ length: 40 }, (_, i) => makeDateKey(i + 1));
    const keep = cached.slice(10); // keep 11..40 (30 keys)

    // Seed payloads + index for 40 days.
    for (const k of cached) {
      await saveService.local.write({ gameKey: 'sudoku', slot: `daily:${k}`, data: payloadFor(k) });
    }
    await saveService.local.write({ gameKey: 'sudoku', slot: 'daily:index', data: { v: 1, cachedDateKeys: cached } });

    // Remove one keep payload to force a download.
    const missing = makeDateKey(35);
    await saveService.local.clear('sudoku', `daily:${missing}`);

    const manifest: DailyManifestV1 = {
      schema_version: 1,
      entries: keep.map((k) => ({ date_key: k, url: `/daily/${k}.json` })),
    };

    const fetchPayload = jest.fn(async (url: string): Promise<DailyPayloadV1> => {
      const m = /\/daily\/(\d{4}-\d{2}-\d{2})\.json$/.exec(url);
      const dateKey = m?.[1] ?? '2025-12-00';
      return payloadFor(dateKey);
    });

    const res = await warmDailyCacheAndEvict({
      saveService,
      manifest,
      keepDateKeys: keep,
      fetchPayload,
      resolveUrl: (u) => `https://example.test${u}`,
    });

    expect(fetchPayload).toHaveBeenCalledTimes(1);
    expect(res.downloaded).toEqual([missing]);
    expect(res.evicted).toEqual(cached.slice(0, 10));

    const idx = await readDailyCacheIndex(saveService);
    expect(idx.cachedDateKeys).toHaveLength(30);
    expect(idx.cachedDateKeys).toEqual(keep);

    // Evicted payloads are cleared.
    for (const k of cached.slice(0, 10)) {
      const v = await saveService.local.read<Record<string, unknown>>('sudoku', `daily:${k}`);
      expect(v).toBeNull();
    }

    // Kept payloads exist (including the downloaded one).
    for (const k of keep) {
      const v = await saveService.local.read<Record<string, unknown>>('sudoku', `daily:${k}`);
      expect(v).not.toBeNull();
    }
  });
});


