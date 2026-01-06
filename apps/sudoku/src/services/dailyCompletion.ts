import { createSaveService } from '@cynnix-studios/game-foundation';

const GAME_KEY = 'sudoku';
const SLOT = 'daily:completion_index_v1';

const saveService = createSaveService();

export type DailyCompletionIndexV1 = {
  v: 1;
  byDateKey: Record<
    string,
    {
      completedAtMs: number;
      // Optional metadata (added for the redesigned Daily Challenges screen / Make parity).
      rawTimeMs?: number;
      scoreMs?: number;
      mistakesCount?: number;
      hintsUsedCount?: number;
    }
  >;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseIndex(raw: unknown): DailyCompletionIndexV1 | null {
  if (!isObject(raw)) return null;
  const by = raw.byDateKey;

  // Back-compat: older builds stored `{ byDateKey: ... }` without a version.
  // If we see a plausible shape, treat it as v1.
  if (raw.v == null) {
    if (!isObject(by)) return null;
    return { v: 1, byDateKey: by as DailyCompletionIndexV1['byDateKey'] };
  }

  if (raw.v !== 1) return null;
  if (!isObject(by)) return null;
  return raw as DailyCompletionIndexV1;
}

export async function readDailyCompletionIndex(): Promise<DailyCompletionIndexV1> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const parsed = parseIndex(saved?.data);
  return parsed ?? { v: 1, byDateKey: {} };
}

export async function markDailyCompleted(args: {
  dateKey: string;
  completedAtMs?: number;
  rawTimeMs?: number;
  scoreMs?: number;
  mistakesCount?: number;
  hintsUsedCount?: number;
}): Promise<void> {
  const existing = await readDailyCompletionIndex();
  const completedAtMs = args.completedAtMs ?? Date.now();
  const next: DailyCompletionIndexV1 = {
    v: 1,
    byDateKey: {
      ...existing.byDateKey,
      [args.dateKey]: {
        completedAtMs,
        ...(typeof args.rawTimeMs === 'number' ? { rawTimeMs: args.rawTimeMs } : null),
        ...(typeof args.scoreMs === 'number' ? { scoreMs: args.scoreMs } : null),
        ...(typeof args.mistakesCount === 'number' ? { mistakesCount: args.mistakesCount } : null),
        ...(typeof args.hintsUsedCount === 'number' ? { hintsUsedCount: args.hintsUsedCount } : null),
      },
    },
  };
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: next });
}


