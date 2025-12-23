import { createSaveService, fetchWithTimeout } from '@cynnix-studios/game-foundation';
import type { HintType } from '@cynnix-studios/sudoku-core';
import { getLastNUtcDateKeys } from '@cynnix-studios/sudoku-core';
import { getSupabasePublicEnv } from '@cynnix-studios/supabase';

type LeaderboardTab = 'score' | 'raw_time';

export type DailyLeaderboardRow = {
  utc_date: string;
  rank: number;
  player_id: string;
  display_name: string;
  score_ms: number;
  raw_time_ms: number;
  mistakes_count: number;
  hints_used_count: number;
  created_at: string;
};

type DailyLeaderboardViewName = 'daily_leaderboard_score_v1' | 'daily_leaderboard_raw_time_v1';

function viewNameForTab(tab: LeaderboardTab): DailyLeaderboardViewName {
  return tab === 'score' ? 'daily_leaderboard_score_v1' : 'daily_leaderboard_raw_time_v1';
}

function supabaseRestBaseUrl(): string {
  const { url } = getSupabasePublicEnv();
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function supabaseAnonKey(): string {
  return getSupabasePublicEnv().anonKey;
}

function buildRestUrl(path: string, params: Record<string, string | string[]>): string {
  const base = supabaseRestBaseUrl();
  const u = new URL(`${base}${path.startsWith('/') ? '' : '/'}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) u.searchParams.append(k, item);
      continue;
    }
    u.searchParams.set(k, v);
  }
  return u.toString();
}

async function restGetJson<T>(args: {
  url: string;
  token?: string;
}): Promise<{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }> {
  try {
    const headers: Record<string, string> = {
      apikey: supabaseAnonKey(),
      accept: 'application/json',
    };
    if (args.token) headers.authorization = `Bearer ${args.token}`;

    const res = await fetchWithTimeout(args.url, { method: 'GET', headers }, { timeoutMs: 10_000, maxAttempts: 3, idempotent: true });
    if (!res.ok) {
      return { ok: false, error: { code: `http_${res.status}`, message: `HTTP ${res.status}` } };
    }
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: { code: 'network_error', message: e instanceof Error ? e.message : String(e) } };
  }
}

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

function isUtcDateWithinLast30Days(utcDate: string, nowMs: number = Date.now()): boolean {
  // Archive window: last 30 days including today.
  return getLastNUtcDateKeys(nowMs, 30).includes(utcDate);
}

async function readPendingDailySubmissions(): Promise<PendingDailySubmissionsSave> {
  const saved = await pendingSaveService.local.read<PendingDailySubmissionsSave>(GAME_KEY, SLOT);
  return saved?.data ?? { byUtcDate: {} };
}

async function writePendingDailySubmissions(next: PendingDailySubmissionsSave): Promise<void> {
  await pendingSaveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: { ...next, clientUpdatedAtMs: Date.now() },
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
  | { ok: true; queued: false; data: unknown; rankedSubmission: boolean | null }
  | { ok: true; queued: true }
  | { ok: false; queued: true }
  | { ok: false; queued: false; error: { code: string; message: string } };

function extractRankedSubmissionFromEdgeResponse(json: unknown): boolean | null {
  // Expected: { ok: true, data: { ranked_submission: boolean, ... }, requestId: string }
  if (typeof json !== 'object' || json == null) return null;
  const r = json as Record<string, unknown>;
  if (r.ok !== true) return null;
  const data = r.data;
  if (typeof data !== 'object' || data == null) return null;
  const d = data as Record<string, unknown>;
  const v = d.ranked_submission;
  return typeof v === 'boolean' ? v : null;
}

export async function submitDailyRun(input: Omit<SubmitDailyRunInput, 'client_submission_id'> & { client_submission_id?: string }): Promise<SubmitDailyRunResult> {
  const e2eToken = process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN;
  const base =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    (e2eToken
      ? (globalThis as unknown as { __E2E_EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL?: string }).__E2E_EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL
      : undefined);
  if (!base) return { ok: false, queued: false, error: { code: 'missing_functions_url', message: 'Missing EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL' } };

  // Product policy: accept ranked submissions only within the Daily archive window (30 days, UTC-keyed).
  if (!isUtcDateWithinLast30Days(input.utc_date)) {
    return { ok: false, queued: false, error: { code: 'utc_date_out_of_range', message: 'Daily submission is outside the 30-day window' } };
  }

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
      // Idempotent via client_submission_id, but do not retry POST inline; we queue failures and flush later.
      { timeoutMs: 10_000, maxAttempts: 1, idempotent: true },
    );

    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      await enqueuePendingDailySubmission(payload);
      return { ok: false, queued: true };
    }

    // Expect stable `{ ok: true, data }` shape from edge.
    if (typeof json === 'object' && json != null && 'ok' in json && (json as { ok: unknown }).ok === true) {
      return { ok: true, queued: false, data: json, rankedSubmission: extractRankedSubmissionFromEdgeResponse(json) };
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
  const e2eToken = process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN;
  const base =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    (e2eToken
      ? (globalThis as unknown as { __E2E_EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL?: string }).__E2E_EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL
      : undefined);
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
    // Drop submissions that are no longer eligible (outside last 30 days).
    if (!isUtcDateWithinLast30Days(sub.utc_date)) {
      delete remaining.byUtcDate[sub.utc_date];
      continue;
    }
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
        // NOTE: Do not retry POST inline; flush itself is the retry mechanism.
        { timeoutMs: 10_000, maxAttempts: 1, idempotent: true },
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

export async function getDailyTop100(args: { utcDate: string; tab: LeaderboardTab }): Promise<{ ok: true; rows: DailyLeaderboardRow[] } | { ok: false; error: { code: string; message: string } }> {
  const view = viewNameForTab(args.tab);
  const select = 'utc_date,rank,player_id,display_name,score_ms,raw_time_ms,mistakes_count,hints_used_count,created_at';
  const url = buildRestUrl(`/rest/v1/${view}`, {
    select,
    utc_date: `eq.${args.utcDate}`,
    order: 'rank.asc',
    limit: '100',
  });

  const res = await restGetJson<DailyLeaderboardRow[]>({ url });
  if (!res.ok) return res;
  return { ok: true, rows: res.data ?? [] };
}

export async function getDailyAroundYou(args: {
  utcDate: string;
  tab: LeaderboardTab;
  window: number;
}): Promise<
  | { ok: true; rows: DailyLeaderboardRow[]; mePlayerId: string }
  | { ok: true; rows: DailyLeaderboardRow[]; mePlayerId: null }
  | { ok: false; error: { code: string; message: string } }
> {
  const { getAccessToken } = await import('./auth');
  const token = await getAccessToken();
  if (!token) return { ok: false, error: { code: 'not_authenticated', message: 'Not signed in' } };

  // Resolve auth user id without using supabase-js (avoid unbounded network calls without timeouts).
  const userRes = await restGetJson<{ id: string }>({
    url: buildRestUrl('/auth/v1/user', {}),
    token,
  });
  if (!userRes.ok) return userRes;

  const playerRes = await restGetJson<Array<{ id: string }>>({
    url: buildRestUrl('/rest/v1/players', { select: 'id', user_id: `eq.${userRes.data.id}`, limit: '1' }),
    token,
  });
  if (!playerRes.ok) return playerRes;
  const playerId = playerRes.data?.[0]?.id;
  if (!playerId) return { ok: true, rows: [], mePlayerId: null };

  const view = viewNameForTab(args.tab);
  const select = 'utc_date,rank,player_id,display_name,score_ms,raw_time_ms,mistakes_count,hints_used_count,created_at';

  const meRes = await restGetJson<DailyLeaderboardRow[]>({
    url: buildRestUrl(`/rest/v1/${view}`, {
      select,
      utc_date: `eq.${args.utcDate}`,
      player_id: `eq.${playerId}`,
      limit: '1',
    }),
    token,
  });
  if (!meRes.ok) return meRes;
  const me = meRes.data?.[0];
  if (!me) return { ok: true, rows: [], mePlayerId: playerId };

  const w = Math.max(0, Math.floor(args.window));
  const start = Math.max(1, me.rank - w);
  const end = me.rank + w;

  const rowsRes = await restGetJson<DailyLeaderboardRow[]>({
    url: buildRestUrl(`/rest/v1/${view}`, {
      select,
      utc_date: `eq.${args.utcDate}`,
      rank: [`gte.${start}`, `lte.${end}`],
      order: 'rank.asc',
    }),
    token,
  });
  if (!rowsRes.ok) return rowsRes;

  return { ok: true, rows: rowsRes.data ?? [], mePlayerId: playerId };
}
