import { createSaveService } from '@cynnix-studios/game-foundation';

const GAME_KEY = 'sudoku';
const SLOT = 'daily:completion_index_v1';

const saveService = createSaveService();

export type DailyCompletionIndexV1 = {
  v: 1;
  byDateKey: Record<string, { completedAtMs: number }>;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseIndex(raw: unknown): DailyCompletionIndexV1 | null {
  if (!isObject(raw)) return null;
  if (raw.v !== 1) return null;
  if (!isObject(raw.byDateKey)) return null;
  return raw as DailyCompletionIndexV1;
}

export async function readDailyCompletionIndex(): Promise<DailyCompletionIndexV1> {
  const saved = await saveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  const parsed = parseIndex(saved?.data);
  return parsed ?? { v: 1, byDateKey: {} };
}

export async function markDailyCompleted(args: { dateKey: string; completedAtMs?: number }): Promise<void> {
  const existing = await readDailyCompletionIndex();
  const completedAtMs = args.completedAtMs ?? Date.now();
  const next: DailyCompletionIndexV1 = {
    v: 1,
    byDateKey: {
      ...existing.byDateKey,
      [args.dateKey]: { completedAtMs },
    },
  };
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: next });
}


