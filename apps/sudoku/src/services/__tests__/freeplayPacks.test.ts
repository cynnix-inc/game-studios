import { createSaveService, type SaveStorage } from '@cynnix-studios/game-foundation';

import { createFreePlayPacksService } from '../freeplayPacks';

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

describe('free play packs', () => {
  const origEnv = process.env;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...origEnv, EXPO_PUBLIC_SUDOKU_FREEPLAY_BASE_URL: 'https://example.test/freeplay' };
  });

  afterEach(() => {
    process.env = origEnv;
    globalThis.fetch = origFetch;
    jest.restoreAllMocks();
  });

  test('getPuzzleSync never blocks and returns a starter pack puzzle when no cached pack exists', () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });
    const svc = createFreePlayPacksService({ saveService });

    const res = svc.getPuzzleSync('easy');
    expect(res.ok).toBe(true);
    expect(res.source).toBe('starter_pack');
    expect(res.puzzle).toHaveLength(81);
    expect(res.solution).toHaveLength(81);
  });

  test('refresh downloads pack updates and getPuzzleSync prefers cached pack puzzles afterwards', async () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });
    const svc = createFreePlayPacksService({ saveService });

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    // 1) manifest.json
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema_version: 1,
          packs: {
            easy: { version: 'v1', url: '/easy/v1.json' },
          },
        }),
        { status: 200, headers: { ETag: '"m1"' } },
      ),
    );

    // 2) pack payload
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema_version: 1,
          difficulty: 'easy',
          version: 'v1',
          puzzles: [
            {
              puzzle_id: 'p1',
              puzzle: Array.from({ length: 81 }, () => 0),
              solution: Array.from({ length: 81 }, () => 1),
            },
          ],
        }),
        { status: 200, headers: {} },
      ),
    );

    const r = await svc.refresh();
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.updated).toEqual(['easy']);

    const pick = svc.getPuzzleSync('easy');
    expect(pick.source).toBe('cached_pack');
    expect(pick.puzzle_id).toBe('p1');

    // New instance should read the cached pack from storage.
    const svc2 = createFreePlayPacksService({ saveService: createSaveService({ storage }) });
    await svc2.initFromStorage();
    const pick2 = svc2.getPuzzleSync('easy');
    expect(pick2.source).toBe('cached_pack');
    expect(pick2.puzzle_id).toBe('p1');
  });

  test('refreshInBackground does not block getPuzzleSync', async () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });
    const svc = createFreePlayPacksService({ saveService });

    let resolveManifest!: (r: Response) => void;
    const manifestPromise = new Promise<Response>((resolve) => {
      resolveManifest = resolve;
    });

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    fetchMock
      .mockReturnValueOnce(manifestPromise)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            schema_version: 1,
            difficulty: 'medium',
            version: 'v1',
            puzzles: [
              {
                puzzle_id: 'm1',
                puzzle: Array.from({ length: 81 }, () => 0),
                solution: Array.from({ length: 81 }, () => 1),
              },
            ],
          }),
          { status: 200, headers: {} },
        ),
      );

    // Starts a refresh, but we do not resolve the manifest yet.
    svc.refreshInBackground();

    const pick = svc.getPuzzleSync('medium');
    expect(pick.source).toBe('starter_pack');

    // Clean up: resolve pending fetch to avoid open handles.
    resolveManifest(
      new Response(
        JSON.stringify({
          schema_version: 1,
          packs: { medium: { version: 'v1', url: '/medium/v1.json' } },
        }),
        { status: 200, headers: { ETag: '"m1"' } },
      ),
    );

    // Allow the background refresh chain to flush.
    await new Promise<void>((resolve) => setImmediate(() => resolve()));
  });
});


