import { loadDailyByDateKey } from '../daily';

jest.mock('@cynnix-studios/game-foundation/http', () => ({
  fetchJsonWithEtagCache: jest.fn(),
}));

jest.mock('@cynnix-studios/game-foundation', () => ({
  createSaveService: () => ({
    local: {
      read: jest.fn(async () => null),
      write: jest.fn(async () => undefined),
      clear: jest.fn(async () => undefined),
    },
  }),
  fetchWithTimeout: jest.fn(),
}));

import { fetchJsonWithEtagCache } from '@cynnix-studios/game-foundation/http';
import { fetchWithTimeout } from '@cynnix-studios/game-foundation';

function setGlobal(key: string, value: unknown): () => void {
  const prev = (globalThis as unknown as Record<string, unknown>)[key];
  (globalThis as unknown as Record<string, unknown>)[key] = value;
  return () => {
    (globalThis as unknown as Record<string, unknown>)[key] = prev;
  };
}

describe('daily: web base fallback', () => {
  test('when configured base fails, web falls back to /puzzles/daily and loads', async () => {
    process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL = 'https://stage.sudoku.cynnix.com/sudoku/daily';
    const restoreWindow = setGlobal('window', { location: { origin: 'https://stage.sudoku.cynnix.com' } });
    const restoreDocument = setGlobal('document', {});

    const mockedManifest = fetchJsonWithEtagCache as unknown as jest.Mock;
    // First base fails (HTML / parse error simulated as ok:false)
    mockedManifest.mockResolvedValueOnce({ ok: false });
    // Fallback base succeeds
    mockedManifest.mockResolvedValueOnce({
      ok: true,
      json: { schema_version: 1, entries: [{ date_key: '2025-12-23', url: 'daily/2025-12-23.json' }] },
    });

    const mockedFetch = fetchWithTimeout as unknown as jest.Mock;
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        schema_version: 1,
        date_key: '2025-12-23',
        difficulty: 'novice',
        puzzle: Array.from({ length: 81 }, () => 0),
        solution: Array.from({ length: 81 }, () => 1),
      }),
    });

    try {
      const res = await loadDailyByDateKey('2025-12-23');
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.payload.date_key).toBe('2025-12-23');
      // We attempted both bases
      expect(mockedManifest).toHaveBeenCalledTimes(2);
    } finally {
      restoreWindow();
      restoreDocument();
      delete process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL;
    }
  });
});


