import type { createSaveService } from '@cynnix-studios/game-foundation';
import type { Difficulty } from '@cynnix-studios/sudoku-core';

const GAME_KEY = 'sudoku';
const SLOT = 'freeplay:started:v1';

const MAX_STARTED_PER_DIFFICULTY = 500;

type FreePlayStartedV1 = {
  schemaVersion: 1;
  kind: 'sudoku_freeplay_started';
  byDifficulty: Partial<Record<Difficulty, string[]>>;
};

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}

function isFreePlayStartedV1(x: unknown): x is FreePlayStartedV1 {
  if (typeof x !== 'object' || x == null) return false;
  const r = x as Record<string, unknown>;
  if (r.schemaVersion !== 1) return false;
  if (r.kind !== 'sudoku_freeplay_started') return false;
  if (typeof r.byDifficulty !== 'object' || r.byDifficulty == null || Array.isArray(r.byDifficulty)) return false;
  for (const v of Object.values(r.byDifficulty as Record<string, unknown>)) {
    if (v == null) continue;
    if (!isStringArray(v)) return false;
  }
  return true;
}

function addStartedId(list: string[] | undefined, puzzleId: string): string[] {
  const prev = list ?? [];
  if (prev.includes(puzzleId)) return prev;
  const next = [...prev, puzzleId];
  if (next.length <= MAX_STARTED_PER_DIFFICULTY) return next;
  return next.slice(next.length - MAX_STARTED_PER_DIFFICULTY);
}

export async function loadFreePlayStarted(saveService: ReturnType<typeof createSaveService>): Promise<Partial<Record<Difficulty, string[]>>> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const raw = saved?.data;
  if (isFreePlayStartedV1(raw)) return raw.byDifficulty ?? {};
  return {};
}

export function markFreePlayStartedInMemory(
  byDifficulty: Partial<Record<Difficulty, string[]>>,
  args: { difficulty: Difficulty; puzzleId: string },
): Partial<Record<Difficulty, string[]>> {
  return {
    ...byDifficulty,
    [args.difficulty]: addStartedId(byDifficulty[args.difficulty], args.puzzleId),
  };
}

export async function persistFreePlayStarted(
  saveService: ReturnType<typeof createSaveService>,
  byDifficulty: Partial<Record<Difficulty, string[]>>,
): Promise<void> {
  const payload: FreePlayStartedV1 = {
    schemaVersion: 1,
    kind: 'sudoku_freeplay_started',
    byDifficulty,
  };
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: payload });
}


