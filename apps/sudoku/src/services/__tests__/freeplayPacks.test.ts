import { createSaveService, type SaveStorage } from '@cynnix-studios/game-foundation';

import type { FreePlayPackV1 } from '@cynnix-studios/sudoku-core';

import { createFreePlayPacksService } from '../freeplayPacks';

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

function makePack(args: { difficulty: FreePlayPackV1['difficulty']; puzzleIds: string[] }): FreePlayPackV1 {
  return {
    schema_version: 1,
    difficulty: args.difficulty,
    version: 'test-v1',
    puzzles: args.puzzleIds.map((puzzle_id) => ({
      puzzle_id,
      puzzle: VALID_PUZZLE,
      solution: VALID_SOLUTION,
    })),
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

  test('getPuzzleSync never blocks and returns a bundled pack puzzle when no cached pack exists', () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });
    const svc = createFreePlayPacksService({
      saveService,
      bundledPacks: { novice: makePack({ difficulty: 'novice', puzzleIds: ['b1'] }) },
    });

    const res = svc.getPuzzleSync('novice');
    expect(res.ok).toBe(true);
    expect(res.source).toBe('bundled_pack');
    expect(res.puzzle).toHaveLength(81);
    expect(res.solution).toHaveLength(81);
  });

  test('getPuzzleSync marks started puzzles and skips repeats until packs are exhausted', async () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });

    const svc = createFreePlayPacksService({
      saveService,
      bundledPacks: { novice: makePack({ difficulty: 'novice', puzzleIds: ['b1', 'b2'] }) },
    });

    const a = svc.getPuzzleSync('novice');
    const b = svc.getPuzzleSync('novice');
    expect(a.source).toBe('bundled_pack');
    expect(b.source).toBe('bundled_pack');
    expect(a.puzzle_id).not.toBe(b.puzzle_id);

    // After both puzzles are started, a new instance should fall back to generator.
    const svc2 = createFreePlayPacksService({
      saveService: createSaveService({ storage }),
      bundledPacks: { novice: makePack({ difficulty: 'novice', puzzleIds: ['b1', 'b2'] }) },
    });
    await svc2.initFromStorage();
    const c = svc2.getPuzzleSync('novice');
    expect(c.source).toBe('generator_fallback');
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
            novice: { version: 'v1', url: '/novice/v1.json' },
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
          difficulty: 'novice',
          version: 'v1',
          puzzles: [
            {
              puzzle_id: 'p1',
              puzzle: VALID_PUZZLE,
              solution: VALID_SOLUTION,
            },
            {
              puzzle_id: 'p2',
              puzzle: VALID_PUZZLE,
              solution: VALID_SOLUTION,
            },
          ],
        }),
        { status: 200, headers: {} },
      ),
    );

    const r = await svc.refresh();
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.updated).toEqual(['novice']);

    const pick = svc.getPuzzleSync('novice');
    expect(pick.source).toBe('cached_pack');
    expect(pick.puzzle_id).toBe('p1');

    // New instance should read the cached pack from storage.
    const svc2 = createFreePlayPacksService({ saveService: createSaveService({ storage }) });
    await svc2.initFromStorage();
    const pick2 = svc2.getPuzzleSync('novice');
    expect(pick2.source).toBe('cached_pack');
    expect(pick2.puzzle_id).toBe('p2');
  });

  test('refreshInBackground does not block getPuzzleSync', async () => {
    const storage = makeMemoryStorage();
    const saveService = createSaveService({ storage });
    const svc = createFreePlayPacksService({
      saveService,
      bundledPacks: { skilled: makePack({ difficulty: 'skilled', puzzleIds: ['b_skilled_1'] }) },
    });

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
            difficulty: 'skilled',
            version: 'v1',
            puzzles: [
              {
                puzzle_id: 'm1',
                puzzle: VALID_PUZZLE,
                solution: VALID_SOLUTION,
              },
            ],
          }),
          { status: 200, headers: {} },
        ),
      );

    // Starts a refresh, but we do not resolve the manifest yet.
    svc.refreshInBackground();

    const pick = svc.getPuzzleSync('skilled');
    expect(pick.source).toBe('bundled_pack');

    // Clean up: resolve pending fetch to avoid open handles.
    resolveManifest(
      new Response(
        JSON.stringify({
          schema_version: 1,
          packs: { skilled: { version: 'v1', url: '/skilled/v1.json' } },
        }),
        { status: 200, headers: { ETag: '"m1"' } },
      ),
    );

    // Allow the background refresh chain to flush.
    await new Promise<void>((resolve) => setImmediate(() => resolve()));
  });
});


