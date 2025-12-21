import { createSaveService } from '@cynnix-studios/game-foundation';
import { assertDailyManifest, assertDailyPayload, type DailyManifestV1, type DailyPayloadV1 } from '@cynnix-studios/sudoku-core';

const GAME_KEY = 'sudoku';
const DAILY_SLOT_PREFIX = 'daily:';

function dailySlot(dateKey: string) {
  return `${DAILY_SLOT_PREFIX}${dateKey}`;
}

function dailyBaseUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL;
  if (!base) return null;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export type DailyLoadOk = {
  ok: true;
  payload: DailyPayloadV1;
  source: 'remote' | 'cache';
};

export type DailyLoadUnavailable = {
  ok: false;
  reason: 'missing_base_url' | 'not_cached_offline' | 'invalid_remote_payload';
};

export type DailyLoadResult = DailyLoadOk | DailyLoadUnavailable;

export const dailySaveService = createSaveService();

export async function readCachedDaily(dateKey: string): Promise<DailyPayloadV1 | null> {
  const saved = await dailySaveService.local.read<Record<string, unknown>>(GAME_KEY, dailySlot(dateKey));
  if (!saved) return null;
  try {
    return assertDailyPayload(saved.data);
  } catch {
    return null;
  }
}

export async function writeCachedDaily(payload: DailyPayloadV1): Promise<void> {
  await dailySaveService.local.write({
    gameKey: GAME_KEY,
    slot: dailySlot(payload.date_key),
    data: payload,
  });
}

export async function fetchDailyManifest(): Promise<DailyManifestV1> {
  const base = dailyBaseUrl();
  if (!base) throw new Error('missing_base_url');
  const res = await fetch(`${base}/manifest.json`);
  if (!res.ok) throw new Error(`manifest_http_${res.status}`);
  const json = (await res.json()) as unknown;
  return assertDailyManifest(json);
}

export async function fetchDailyPayload(url: string): Promise<DailyPayloadV1> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`payload_http_${res.status}`);
  const json = (await res.json()) as unknown;
  return assertDailyPayload(json);
}

export async function loadDailyByDateKey(dateKey: string): Promise<DailyLoadResult> {
  const cached = await readCachedDaily(dateKey);

  const base = dailyBaseUrl();
  if (!base) {
    if (cached) return { ok: true, payload: cached, source: 'cache' };
    return { ok: false, reason: 'missing_base_url' };
  }

  try {
    const manifest = await fetchDailyManifest();
    const entry = manifest.entries.find((e) => e.date_key === dateKey);
    if (!entry) {
      if (cached) return { ok: true, payload: cached, source: 'cache' };
      return { ok: false, reason: 'not_cached_offline' };
    }

    const payload = await fetchDailyPayload(entry.url.startsWith('http') ? entry.url : `${base}/${entry.url.replace(/^\//, '')}`);
    await writeCachedDaily(payload);
    return { ok: true, payload, source: 'remote' };
  } catch {
    if (cached) return { ok: true, payload: cached, source: 'cache' };
    return { ok: false, reason: 'not_cached_offline' };
  }
}



