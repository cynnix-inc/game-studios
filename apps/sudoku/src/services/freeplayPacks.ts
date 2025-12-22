import { createSaveService, fetchWithTimeout } from '@cynnix-studios/game-foundation';
import { fetchJsonWithEtagCache, type EtagJsonCache } from '@cynnix-studios/game-foundation/http';
import {
  assertFreePlayManifest,
  assertFreePlayPack,
  generate,
  type Difficulty,
  type FreePlayManifestV1,
  type FreePlayPackV1,
} from '@cynnix-studios/sudoku-core';

const GAME_KEY = 'sudoku';
const MANIFEST_SLOT = 'freeplay:manifest';
const PACK_SLOT_PREFIX = 'freeplay:pack:';

function packSlot(difficulty: Difficulty) {
  return `${PACK_SLOT_PREFIX}${difficulty}`;
}

function freePlayBaseUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_SUDOKU_FREEPLAY_BASE_URL;
  if (!base) return null;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function resolveUrl(base: string, url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}/${url.replace(/^\//, '')}`;
}

export type FreePlayPuzzleSelection =
  | { ok: true; source: 'cached_pack'; difficulty: Difficulty; puzzle_id: string; puzzle: number[]; solution: number[] }
  | { ok: true; source: 'starter_pack'; difficulty: Difficulty; puzzle_id: string; puzzle: number[]; solution: number[] }
  | { ok: true; source: 'generator_fallback'; difficulty: Difficulty; puzzle_id: string; puzzle: number[]; solution: number[] };

export type FreePlayPacksRefreshResult =
  | { ok: true; updated: Difficulty[]; manifestSource: 'remote' | 'cache' }
  | { ok: false; reason: 'missing_base_url' | 'offline' | 'invalid_remote_payload' };

export type FreePlayPacksService = {
  initFromStorage(): Promise<void>;
  refresh(): Promise<FreePlayPacksRefreshResult>;
  refreshInBackground(): void;
  getPuzzleSync(difficulty: Difficulty): FreePlayPuzzleSelection;
};

type ManifestCacheValue = { etag: string | null; json: unknown };

function makeManifestCache(saveService: ReturnType<typeof createSaveService>): EtagJsonCache {
  return {
    get: async (key) => {
      const saved = await saveService.local.read<ManifestCacheValue>(GAME_KEY, key);
      if (!saved) return null;
      const raw = saved.data;
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const etag = obj.etag;
      const json = obj.json;
      if (etag != null && typeof etag !== 'string') return null;
      return { etag: (etag as string | null) ?? null, json };
    },
    set: async (key, value) => {
      await saveService.local.write({
        gameKey: GAME_KEY,
        slot: key,
        data: value,
      });
    },
  };
}

const STARTER_SEEDS: Record<Difficulty, number[]> = {
  easy: [101, 102, 103, 104, 105],
  medium: [201, 202, 203, 204, 205],
  hard: [301, 302, 303, 304, 305],
  expert: [401, 402, 403, 404, 405],
  extreme: [501, 502, 503, 504, 505],
};

function starterPuzzleId(difficulty: Difficulty, seed: number) {
  return `starter:${difficulty}:${seed}`;
}

export function createFreePlayPacksService(deps: { saveService?: ReturnType<typeof createSaveService> } = {}): FreePlayPacksService {
  const saveService = deps.saveService ?? createSaveService();
  const cache = makeManifestCache(saveService);

  const packs: Partial<Record<Difficulty, FreePlayPackV1>> = {};
  const nextIndex: Partial<Record<Difficulty, number>> = {};

  const pickIndex = (difficulty: Difficulty, len: number): number => {
    const current = nextIndex[difficulty] ?? 0;
    const idx = len <= 0 ? 0 : current % len;
    nextIndex[difficulty] = idx + 1;
    return idx;
  };

  const readCachedPack = async (difficulty: Difficulty): Promise<FreePlayPackV1 | null> => {
    const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, packSlot(difficulty));
    if (!saved) return null;
    try {
      const pack = assertFreePlayPack(saved.data);
      if (pack.difficulty !== difficulty) return null;
      return pack;
    } catch {
      return null;
    }
  };

  const writeCachedPack = async (pack: FreePlayPackV1): Promise<void> => {
    await saveService.local.write({
      gameKey: GAME_KEY,
      slot: packSlot(pack.difficulty),
      data: pack,
    });
  };

  return {
    async initFromStorage() {
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'extreme'];
      for (const d of difficulties) {
        const pack = await readCachedPack(d);
        if (pack) packs[d] = pack;
      }
    },

    refreshInBackground() {
      void this.refresh();
    },

    async refresh(): Promise<FreePlayPacksRefreshResult> {
      const base = freePlayBaseUrl();
      if (!base) return { ok: false, reason: 'missing_base_url' };

      const manifestRes = await fetchJsonWithEtagCache<FreePlayManifestV1>({
        cache,
        cacheKey: MANIFEST_SLOT,
        input: `${base}/manifest.json`,
        init: undefined,
        policy: { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
        parse: assertFreePlayManifest,
      });

      if (!manifestRes.ok) {
        // Keep error surface stable for callers (no low-level codes).
        return { ok: false, reason: 'offline' };
      }

      const manifest = manifestRes.json;
      const updated: Difficulty[] = [];

      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'extreme'];
      for (const d of difficulties) {
        const entry = manifest.packs[d];
        if (!entry) continue;
        const existingVersion = packs[d]?.version ?? null;
        if (existingVersion === entry.version) continue;

        const url = resolveUrl(base, entry.url);
        try {
          const res = await fetchWithTimeout(url, undefined, { timeoutMs: 10_000, maxAttempts: 3, idempotent: true });
          if (!res.ok) return { ok: false, reason: 'invalid_remote_payload' };
          const json = (await res.json()) as unknown;
          const pack = assertFreePlayPack(json);
          if (pack.difficulty !== d) return { ok: false, reason: 'invalid_remote_payload' };
          if (pack.version !== entry.version) return { ok: false, reason: 'invalid_remote_payload' };

          await writeCachedPack(pack);
          packs[d] = pack;
          updated.push(d);
        } catch {
          return { ok: false, reason: 'offline' };
        }
      }

      return { ok: true, updated, manifestSource: manifestRes.source };
    },

    getPuzzleSync(difficulty: Difficulty): FreePlayPuzzleSelection {
      const pack = packs[difficulty];
      if (pack?.puzzles?.length) {
        const idx = pickIndex(difficulty, pack.puzzles.length);
        const p = pack.puzzles[idx]!;
        return { ok: true, source: 'cached_pack', difficulty, puzzle_id: p.puzzle_id, puzzle: p.puzzle, solution: p.solution };
      }

      // Built-in starter pack: deterministic seeds, but still uses generator under the hood.
      const seeds = STARTER_SEEDS[difficulty];
      const idx = pickIndex(difficulty, seeds.length);
      const seed = seeds[idx]!;
      try {
        const gen = generate(difficulty, { seed });
        return {
          ok: true,
          source: 'starter_pack',
          difficulty,
          puzzle_id: starterPuzzleId(difficulty, seed),
          puzzle: gen.puzzle as unknown as number[],
          solution: gen.solution as unknown as number[],
        };
      } catch {
        const gen = generate(difficulty);
        return {
          ok: true,
          source: 'generator_fallback',
          difficulty,
          puzzle_id: `gen:${difficulty}:${Date.now()}`,
          puzzle: gen.puzzle as unknown as number[],
          solution: gen.solution as unknown as number[],
        };
      }
    },
  };
}

export const freePlayPacksService = createFreePlayPacksService();

export async function initFreePlayPacks(): Promise<void> {
  await freePlayPacksService.initFromStorage();
  freePlayPacksService.refreshInBackground();
}


