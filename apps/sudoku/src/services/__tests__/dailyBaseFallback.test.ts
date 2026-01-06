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
        puzzle: VALID_PUZZLE,
        solution: VALID_SOLUTION,
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


