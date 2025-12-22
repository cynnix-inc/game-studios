import { createSaveService, type SaveStorage } from '@cynnix-studios/game-foundation';
import type { DailyManifestV1, DailyPayloadV1 } from '@cynnix-studios/sudoku-core';

import { readDailyCacheIndex, warmDailyCacheAndEvict } from '../dailyCache';

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
    difficulty: 'easy',
    puzzle: Array.from({ length: 81 }, () => 0),
    solution: Array.from({ length: 81 }, () => 1),
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


