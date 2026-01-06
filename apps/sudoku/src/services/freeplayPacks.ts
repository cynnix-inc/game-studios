import { createSaveService, fetchWithTimeout } from '@cynnix-studios/game-foundation';
import { fetchJsonWithEtagCache, type EtagJsonCache } from '@cynnix-studios/game-foundation/http';
import {
  assertFreePlayManifest,
  assertFreePlayPack,
  assertPuzzleSolutionContract,
  generateContractGated,
  generateUnique,
  type Difficulty,
  type FreePlayManifestV1,
  type FreePlayPackV1,
} from '@cynnix-studios/sudoku-core';

import { loadFreePlayStarted, markFreePlayStartedInMemory, persistFreePlayStarted } from './freeplayPlayed';

import bundledNovice from '../freeplayPacks/bundled/novice.json';
import bundledSkilled from '../freeplayPacks/bundled/skilled.json';
import bundledAdvanced from '../freeplayPacks/bundled/advanced.json';
import bundledExpert from '../freeplayPacks/bundled/expert.json';
import bundledFiendish from '../freeplayPacks/bundled/fiendish.json';
import bundledUltimate from '../freeplayPacks/bundled/ultimate.json';

const GAME_KEY = 'sudoku';
const MANIFEST_SLOT = 'freeplay:manifest';
const PACK_SLOT_PREFIX = 'freeplay:pack:';

function packSlot(difficulty: Difficulty) {
  return `${PACK_SLOT_PREFIX}${difficulty}`;
}

function assertPackPuzzleContracts(pack: FreePlayPackV1): void {
  for (let i = 0; i < pack.puzzles.length; i++) {
    const p = pack.puzzles[i]!;
    try {
      assertPuzzleSolutionContract(p.puzzle, p.solution);
    } catch {
      throw new Error(`pack ${pack.difficulty} puzzle contract violation (puzzle_id=${p.puzzle_id})`);
    }
  }
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

function buildBundledPacks(): Partial<Record<Difficulty, FreePlayPackV1>> {
  // Validate once at module init so we never ship invalid bundled packs.
  const novice = assertFreePlayPack(bundledNovice as unknown);
  const skilled = assertFreePlayPack(bundledSkilled as unknown);
  const advanced = assertFreePlayPack(bundledAdvanced as unknown);
  const expert = assertFreePlayPack(bundledExpert as unknown);
  const fiendish = assertFreePlayPack(bundledFiendish as unknown);
  const ultimate = assertFreePlayPack(bundledUltimate as unknown);

  return {
    novice:
      novice.difficulty === 'novice'
        ? (assertPackPuzzleContracts(novice), novice)
        : undefined,
    skilled:
      skilled.difficulty === 'skilled'
        ? (assertPackPuzzleContracts(skilled), skilled)
        : undefined,
    advanced:
      advanced.difficulty === 'advanced'
        ? (assertPackPuzzleContracts(advanced), advanced)
        : undefined,
    expert:
      expert.difficulty === 'expert'
        ? (assertPackPuzzleContracts(expert), expert)
        : undefined,
    fiendish:
      fiendish.difficulty === 'fiendish'
        ? (assertPackPuzzleContracts(fiendish), fiendish)
        : undefined,
    ultimate:
      ultimate.difficulty === 'ultimate'
        ? (assertPackPuzzleContracts(ultimate), ultimate)
        : undefined,
  };
}

const DEFAULT_BUNDLED_PACKS: Partial<Record<Difficulty, FreePlayPackV1>> = buildBundledPacks();

export type FreePlayPuzzleSelection =
  | { ok: true; source: 'cached_pack'; difficulty: Difficulty; puzzle_id: string; puzzle: number[]; solution: number[] }
  | { ok: true; source: 'bundled_pack'; difficulty: Difficulty; puzzle_id: string; puzzle: number[]; solution: number[] }
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

export function createFreePlayPacksService(
  deps: { saveService?: ReturnType<typeof createSaveService>; bundledPacks?: Partial<Record<Difficulty, FreePlayPackV1>> } = {},
): FreePlayPacksService {
  const saveService = deps.saveService ?? createSaveService();
  const cache = makeManifestCache(saveService);

  const packs: Partial<Record<Difficulty, FreePlayPackV1>> = {};
  const bundled: Partial<Record<Difficulty, FreePlayPackV1>> = deps.bundledPacks ?? DEFAULT_BUNDLED_PACKS;
  const nextIndex: Partial<Record<Difficulty, number>> = {};
  let startedByDifficulty: Partial<Record<Difficulty, string[]>> = {};
  const startedSetByDifficulty: Partial<Record<Difficulty, Set<string>>> = {};

  const pickIndex = (difficulty: Difficulty, len: number): number => {
    const current = nextIndex[difficulty] ?? 0;
    const idx = len <= 0 ? 0 : current % len;
    nextIndex[difficulty] = idx + 1;
    return idx;
  };

  const isStarted = (difficulty: Difficulty, puzzleId: string): boolean => {
    const set = startedSetByDifficulty[difficulty];
    return set ? set.has(puzzleId) : false;
  };

  const markStarted = (difficulty: Difficulty, puzzleId: string): void => {
    // Update in-memory sets first (sync), then persist in the background.
    if (!startedSetByDifficulty[difficulty]) startedSetByDifficulty[difficulty] = new Set<string>();
    startedSetByDifficulty[difficulty]!.add(puzzleId);
    startedByDifficulty = markFreePlayStartedInMemory(startedByDifficulty, { difficulty, puzzleId });
    void persistFreePlayStarted(saveService, startedByDifficulty);
  };

  const pickFromPack = (
    args: { source: 'cached_pack' | 'bundled_pack'; difficulty: Difficulty; pack: FreePlayPackV1 },
  ): FreePlayPuzzleSelection | null => {
    const { difficulty, pack } = args;
    if (!pack.puzzles.length) return null;

    const startIdx = pickIndex(difficulty, pack.puzzles.length);
    for (let offset = 0; offset < pack.puzzles.length; offset++) {
      const idx = (startIdx + offset) % pack.puzzles.length;
      const p = pack.puzzles[idx]!;
      if (isStarted(difficulty, p.puzzle_id)) continue;
      try {
        assertPuzzleSolutionContract(p.puzzle, p.solution);
      } catch {
        // Avoid repeatedly selecting invalid content.
        markStarted(difficulty, p.puzzle_id);
        continue;
      }
      markStarted(difficulty, p.puzzle_id);
      return { ok: true, source: args.source, difficulty, puzzle_id: p.puzzle_id, puzzle: p.puzzle, solution: p.solution };
    }

    return null;
  };

  const pickRepeatFromPack = (
    args: { source: 'cached_pack' | 'bundled_pack'; difficulty: Difficulty; pack: FreePlayPackV1 },
  ): FreePlayPuzzleSelection | null => {
    const { difficulty, pack } = args;
    if (!pack.puzzles.length) return null;
    const startIdx = pickIndex(difficulty, pack.puzzles.length);
    for (let offset = 0; offset < pack.puzzles.length; offset++) {
      const idx = (startIdx + offset) % pack.puzzles.length;
      const p = pack.puzzles[idx]!;
      try {
        assertPuzzleSolutionContract(p.puzzle, p.solution);
      } catch {
        continue;
      }
      return { ok: true, source: args.source, difficulty, puzzle_id: p.puzzle_id, puzzle: p.puzzle, solution: p.solution };
    }
    return null;
  };

  const readCachedPack = async (difficulty: Difficulty): Promise<FreePlayPackV1 | null> => {
    const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, packSlot(difficulty));
    if (!saved) return null;
    try {
      const pack = assertFreePlayPack(saved.data);
      if (pack.difficulty !== difficulty) return null;
      assertPackPuzzleContracts(pack);
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
      const difficulties: Difficulty[] = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'];
      startedByDifficulty = await loadFreePlayStarted(saveService);
      for (const d of difficulties) {
        startedSetByDifficulty[d] = new Set(startedByDifficulty[d] ?? []);
      }
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

      const difficulties: Difficulty[] = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'];
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
          try {
            assertPackPuzzleContracts(pack);
          } catch {
            return { ok: false, reason: 'invalid_remote_payload' };
          }

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
      if (pack) {
        const picked = pickFromPack({ source: 'cached_pack', difficulty, pack });
        if (picked) return picked;
      }

      const bundledPack = bundled[difficulty];
      if (bundledPack) {
        const picked = pickFromPack({ source: 'bundled_pack', difficulty, pack: bundledPack });
        if (picked) return picked;
      }

      try {
        const gen = generateContractGated(difficulty, { maxAttempts: 10 });
        const puzzleId = `gen:${difficulty}:${Date.now()}`;
        markStarted(difficulty, puzzleId);
        return {
          ok: true,
          source: 'generator_fallback',
          difficulty,
          puzzle_id: puzzleId,
          puzzle: gen.puzzle as unknown as number[],
          solution: gen.solution as unknown as number[],
        };
      } catch {
        // Non-blocking last resort: if generation can't meet the gates quickly, allow a repeat from packs.
        if (pack) {
          const repeat = pickRepeatFromPack({ source: 'cached_pack', difficulty, pack });
          if (repeat) return repeat;
        }
        if (bundledPack) {
          const repeat = pickRepeatFromPack({ source: 'bundled_pack', difficulty, pack: bundledPack });
          if (repeat) return repeat;
        }

        // Absolute last resort: generate a unique puzzle (never return non-unique content).
        const gen = generateUnique(difficulty, { maxAttempts: 50 });
        const puzzleId = `gen:${difficulty}:${Date.now()}`;
        markStarted(difficulty, puzzleId);
        return {
          ok: true,
          source: 'generator_fallback',
          difficulty,
          puzzle_id: puzzleId,
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


