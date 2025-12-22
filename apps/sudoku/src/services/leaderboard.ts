import { createSaveService, fetchWithTimeout } from '@cynnix-studios/game-foundation';
import type { HintType } from '@cynnix-studios/sudoku-core';

export type LeaderboardMode = 'time_ms' | 'mistakes';

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  value: number;
};

export function createClientSubmissionId(): string {
  const maybe = globalThis.crypto?.randomUUID?.();
  if (maybe) return maybe;
  // Fallback: pseudo UUIDv4-ish. Good enough for idempotency keys in MVP.
  const rnd = () => Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export type SubmitDailyRunInput = {
  utc_date: string; // YYYY-MM-DD
  raw_time_ms: number;
  mistakes_count: number;
  hint_breakdown: Partial<Record<HintType, number>>;
  client_submission_id: string;
};

type PendingDailySubmission = SubmitDailyRunInput & {
  createdAtMs: number;
};

type PendingDailySubmissionsSave = {
  byUtcDate: Record<string, PendingDailySubmission>;
};

const GAME_KEY = 'sudoku';
const SLOT = 'pending_daily_submissions';
const pendingSaveService = createSaveService();

async function readPendingDailySubmissions(): Promise<PendingDailySubmissionsSave> {
  const saved = await pendingSaveService.local.read<PendingDailySubmissionsSave>(GAME_KEY, SLOT);
  return saved?.data ?? { byUtcDate: {} };
}

async function writePendingDailySubmissions(next: PendingDailySubmissionsSave): Promise<void> {
  await pendingSaveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: next,
  });
}

export async function enqueuePendingDailySubmission(submission: SubmitDailyRunInput): Promise<void> {
  const existing = await readPendingDailySubmissions();
  await writePendingDailySubmissions({
    byUtcDate: {
      ...existing.byUtcDate,
      [submission.utc_date]: { ...submission, createdAtMs: Date.now() },
    },
  });
}

export type SubmitDailyRunResult =
  | { ok: true; queued: false; data: unknown }
  | { ok: true; queued: true }
  | { ok: false; queued: true }
  | { ok: false; queued: false; error: { code: string; message: string } };

export async function submitDailyRun(input: Omit<SubmitDailyRunInput, 'client_submission_id'> & { client_submission_id?: string }): Promise<SubmitDailyRunResult> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return { ok: false, queued: false, error: { code: 'missing_functions_url', message: 'Missing EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL' } };

  const { getAccessToken } = await import('./auth');
  const token = await getAccessToken();
  if (!token) return { ok: false, queued: false, error: { code: 'not_authenticated', message: 'Not signed in' } };

  const payload: SubmitDailyRunInput = {
    utc_date: input.utc_date,
    raw_time_ms: input.raw_time_ms,
    mistakes_count: input.mistakes_count,
    hint_breakdown: input.hint_breakdown,
    client_submission_id: input.client_submission_id ?? createClientSubmissionId(),
  };

  try {
    const res = await fetchWithTimeout(
    `${base}/submit-score`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
    // Idempotent via client_submission_id.
    { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
  );

    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      await enqueuePendingDailySubmission(payload);
      return { ok: false, queued: true };
    }

    // Expect stable `{ ok: true, data }` shape from edge.
    if (typeof json === 'object' && json != null && 'ok' in json && (json as { ok: unknown }).ok === true) {
      return { ok: true, queued: false, data: json };
    }

    // Unknown response shape; treat as failure and queue for retry.
    await enqueuePendingDailySubmission(payload);
    return { ok: false, queued: true };
  } catch {
    await enqueuePendingDailySubmission(payload);
    return { ok: false, queued: true };
  }
}

export async function flushPendingDailySubmissions(): Promise<{ ok: true; flushed: number } | { ok: false; flushed: number }> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return { ok: false, flushed: 0 };

  const { getAccessToken } = await import('./auth');
  const token = await getAccessToken();
  if (!token) return { ok: false, flushed: 0 };

  const existing = await readPendingDailySubmissions();
  const entries = Object.values(existing.byUtcDate);
  if (entries.length === 0) return { ok: true, flushed: 0 };

  let flushed = 0;
  const remaining: PendingDailySubmissionsSave = { byUtcDate: { ...existing.byUtcDate } };

  for (const sub of entries) {
    try {
      const res = await fetchWithTimeout(
        `${base}/submit-score`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sub),
        },
        { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
      );
      if (!res.ok) continue;
      // success -> remove
      delete remaining.byUtcDate[sub.utc_date];
      flushed++;
    } catch {
      continue;
    }
  }

  if (flushed > 0) await writePendingDailySubmissions(remaining);
  return { ok: true, flushed };
}

export async function getTop50(mode: LeaderboardMode): Promise<LeaderboardEntry[]> {
  // Placeholder: return mock until Supabase configured.
  return Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    displayName: `Player ${i + 1}`,
    value: mode === 'time_ms' ? 60_000 + i * 1_000 : i,
  }));
}


