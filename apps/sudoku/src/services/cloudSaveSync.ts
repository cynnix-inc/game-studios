import { createSaveService, fetchWithTimeout, type GameSave } from '@cynnix-studios/game-foundation';
import { getSupabasePublicEnv } from '@cynnix-studios/supabase';

import { decideMainSaveSyncAction, type MainSaveSyncAction } from './authSyncPolicy';
import { getAccessToken } from './auth';

const GAME_KEY = 'sudoku';
const saveService = createSaveService();

export type CloudSaveSlot = 'main' | 'pending_daily_submissions';

type CloudSaveRow = {
  game_key: string;
  slot: string;
  data: unknown;
  updated_at: string; // ISO
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function extractClientUpdatedAtMs(data: unknown): number | null {
  if (!isObject(data)) return null;
  const v = data.clientUpdatedAtMs;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < 0) return null;
  return Math.floor(v);
}

function parseIsoMs(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function comparableLocalUpdatedAtMs(saved: GameSave<object> | null): number | null {
  if (!saved) return null;
  return extractClientUpdatedAtMs(saved.data) ?? saved.updatedAtMs ?? null;
}

function comparableCloudUpdatedAtMs(row: CloudSaveRow | null): number | null {
  if (!row) return null;
  return extractClientUpdatedAtMs(row.data) ?? parseIsoMs(row.updated_at);
}

export function computeSlotSyncAction(args: {
  local: GameSave<object> | null;
  cloud: CloudSaveRow | null;
}): MainSaveSyncAction {
  return decideMainSaveSyncAction({
    localUpdatedAtMs: comparableLocalUpdatedAtMs(args.local),
    cloudUpdatedAtMs: comparableCloudUpdatedAtMs(args.cloud),
  });
}

function supabaseRestBaseUrl(): string {
  const { url } = getSupabasePublicEnv();
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function supabaseAnonKey(): string {
  return getSupabasePublicEnv().anonKey;
}

function buildRestUrl(path: string, params: Record<string, string>): string {
  const base = supabaseRestBaseUrl();
  const u = new URL(`${base}${path.startsWith('/') ? '' : '/'}${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function restGetJson<T>(args: { url: string; token: string }): Promise<{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }> {
  try {
    const res = await fetchWithTimeout(
      args.url,
      {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey(),
          accept: 'application/json',
          authorization: `Bearer ${args.token}`,
        },
      },
      { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    );
    if (!res.ok) return { ok: false, error: { code: `http_${res.status}`, message: `HTTP ${res.status}` } };
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: { code: 'network_error', message: e instanceof Error ? e.message : String(e) } };
  }
}

async function fetchCloudSaveRow(slot: CloudSaveSlot, token: string): Promise<CloudSaveRow | null> {
  const url = buildRestUrl('/rest/v1/saves', {
    select: 'game_key,slot,data,updated_at',
    game_key: `eq.${GAME_KEY}`,
    slot: `eq.${slot}`,
    limit: '1',
  });

  const res = await restGetJson<CloudSaveRow[]>({ url, token });
  if (!res.ok) return null;
  return res.data?.[0] ?? null;
}

async function upsertSaveToCloud(args: { slot: CloudSaveSlot; data: unknown; token: string }): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return { ok: false, error: { code: 'missing_functions_url', message: 'Missing EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL' } };

  try {
    const res = await fetchWithTimeout(
      `${base}/upsert-save`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${args.token}`,
        },
        body: JSON.stringify({
          game_key: GAME_KEY,
          slot: args.slot,
          data: args.data,
        }),
      },
      { timeoutMs: 10_000, maxAttempts: 1, idempotent: true },
    );
    if (!res.ok) return { ok: false, error: { code: `http_${res.status}`, message: `HTTP ${res.status}` } };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: { code: 'network_error', message: e instanceof Error ? e.message : String(e) } };
  }
}

let syncInFlight: Promise<void> | null = null;
let lastSyncedUserId: string | null = null;

export async function syncSignedInSaveSlotsOnce(userId: string): Promise<void> {
  if (syncInFlight) return syncInFlight;
  if (lastSyncedUserId === userId) return;

  syncInFlight = (async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // Sync main + pending submissions (best-effort). Failures are non-fatal.
      const slots: CloudSaveSlot[] = ['main', 'pending_daily_submissions'];
      for (const slot of slots) {
        const local = await saveService.local.read<object>(GAME_KEY, slot);
        const cloud = await fetchCloudSaveRow(slot, token);
        const action = computeSlotSyncAction({ local, cloud });

        if (action === 'push') {
          if (!local) continue;
          await upsertSaveToCloud({ slot, data: local.data, token });
          continue;
        }

        if (action === 'pull') {
          if (!cloud) continue;
          // Preserve clientUpdatedAtMs if present in cloud data.
          await saveService.local.write({
            gameKey: GAME_KEY,
            slot,
            data: cloud.data as object,
          });
          continue;
        }
      }

      lastSyncedUserId = userId;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export async function migrateGuestLocalSavesToCloud(args: { token: string }): Promise<void> {
  // Best-effort: push the two relevant local slots to cloud.
  const slots: CloudSaveSlot[] = ['main', 'pending_daily_submissions'];
  for (const slot of slots) {
    const local = await saveService.local.read<object>(GAME_KEY, slot);
    if (!local) continue;
    await upsertSaveToCloud({ slot, data: local.data, token: args.token });
  }
}


