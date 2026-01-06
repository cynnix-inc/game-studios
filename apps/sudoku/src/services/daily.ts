import { createSaveService, fetchWithTimeout } from '@cynnix-studios/game-foundation';
import { fetchJsonWithEtagCache, type EtagJsonCache } from '@cynnix-studios/game-foundation/http';
import {
  assertDailyManifest,
  assertDailyPayload,
  getLastNUtcDateKeys,
  type DailyManifestV1,
  type DailyPayloadV1,
} from '@cynnix-studios/sudoku-core';

import { upsertDailyIndexForDateKey, warmDailyCacheAndEvict } from './dailyCache';

const GAME_KEY = 'sudoku';
const DAILY_SLOT_PREFIX = 'daily:';
const DAILY_MANIFEST_SLOT = 'daily:manifest';

function dailySlot(dateKey: string) {
  return `${DAILY_SLOT_PREFIX}${dateKey}`;
}

function dailyBaseUrl(): string | null {
  const e2eToken = process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN;
  const base =
    process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL ??
    (e2eToken
      ? (globalThis as unknown as { __E2E_EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL?: string }).__E2E_EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL
      : undefined);
  if (!base) {
    // Zero-config web default: host daily JSON in the same site under /puzzles/daily.
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return `${window.location.origin}/puzzles/daily`;
    }
    return null;
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function isWebRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function fallbackWebDailyBaseUrl(): string | null {
  if (!isWebRuntime()) return null;
  return `${window.location.origin}/puzzles/daily`;
}

function dailyBaseUrlCandidates(): string[] {
  const primary = dailyBaseUrl();
  if (!primary) return [];
  const out = [primary];
  const fallback = fallbackWebDailyBaseUrl();
  if (fallback && fallback !== primary) out.push(fallback);
  return out;
}

export type DailyLoadOk = {
  ok: true;
  payload: DailyPayloadV1;
  source: 'remote' | 'cache';
};

export type DailyLoadUnavailable = {
  ok: false;
  reason: 'missing_base_url' | 'offline' | 'invalid_remote_payload';
};

export type DailyLoadResult = DailyLoadOk | DailyLoadUnavailable;

export const dailySaveService = createSaveService();

type ManifestCacheValue = { etag: string | null; json: unknown };

function makeManifestCache(): EtagJsonCache {
  return {
    get: async (key) => {
      const saved = await dailySaveService.local.read<ManifestCacheValue>(GAME_KEY, key);
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
      await dailySaveService.local.write({
        gameKey: GAME_KEY,
        slot: key,
        data: value,
      });
    },
  };
}

function resolveUrl(base: string, url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}/${url.replace(/^\//, '')}`;
}

export async function readCachedDaily(dateKey: string): Promise<DailyPayloadV1 | null> {
  const saved = await dailySaveService.local.read<Record<string, unknown>>(GAME_KEY, dailySlot(dateKey));
  if (!saved) return null;
  try {
    return assertDailyPayload(normalizeDailyPayloadJson(saved.data));
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
  await upsertDailyIndexForDateKey(dailySaveService, payload.date_key);
}

function normalizeDailyPayloadJson(input: unknown): unknown {
  // Back-compat: older daily JSONs used legacy difficulties:
  // `easy|medium|hard|expert|extreme`. Our engine contract uses:
  // `novice|skilled|advanced|expert|fiendish|ultimate`.
  //
  // Make parity requires showing difficulty everywhere; normalize at the boundary
  // so the rest of the app can stay typed against `Difficulty`.
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const raw = obj.difficulty;
  if (typeof raw !== 'string') return input;

  // If it's already a contract difficulty, keep it.
  if (raw === 'novice' || raw === 'skilled' || raw === 'advanced' || raw === 'expert' || raw === 'fiendish' || raw === 'ultimate') {
    return input;
  }

  const mapped =
    raw === 'easy'
      ? 'novice'
      : raw === 'medium'
        ? 'skilled'
        : raw === 'hard'
          ? 'advanced'
          : raw === 'expert'
            ? 'expert'
            : raw === 'extreme'
              ? 'ultimate'
              : null;

  if (!mapped) return input;
  return { ...obj, difficulty: mapped };
}

export async function fetchDailyManifest(): Promise<DailyManifestV1> {
  const base = dailyBaseUrl();
  if (!base) throw new Error('missing_base_url');
  return await fetchDailyManifestForBase(base);
}

async function fetchDailyManifestForBase(base: string): Promise<DailyManifestV1> {
  const cache = makeManifestCache();
  const res = await fetchJsonWithEtagCache<DailyManifestV1>({
    cache,
    cacheKey: DAILY_MANIFEST_SLOT,
    input: `${base}/manifest.json`,
    init: undefined,
    policy: { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    parse: assertDailyManifest,
  });
  if (!res.ok) throw new Error('manifest_unavailable');
  return res.json;
}

export async function fetchDailyPayload(url: string): Promise<DailyPayloadV1> {
  const res = await fetchWithTimeout(
    url,
    undefined,
    { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
  );
  if (!res.ok) throw new Error(`payload_http_${res.status}`);
  const json = (await res.json()) as unknown;
  return assertDailyPayload(normalizeDailyPayloadJson(json));
}

export async function loadDailyByDateKey(dateKey: string): Promise<DailyLoadResult> {
  const bases = dailyBaseUrlCandidates();
  if (bases.length === 0) {
    return { ok: false, reason: 'missing_base_url' };
  }

  for (const base of bases) {
    try {
      const manifest = await fetchDailyManifestForBase(base);
      const entry = manifest.entries.find((e) => e.date_key === dateKey);
      if (!entry) {
        return { ok: false, reason: 'invalid_remote_payload' };
      }

      const payload = await fetchDailyPayload(resolveUrl(base, entry.url));
      await writeCachedDaily(payload);

      // Opportunistic background warm-cache of today + last 30 days (PRD: still requires internet to play Daily).
      // Never blocks returning today's requested payload.
      const keep = getLastNUtcDateKeys(Date.now(), 30);
      void warmDailyCacheAndEvict({
        saveService: dailySaveService,
        manifest,
        keepDateKeys: keep,
        fetchPayload: fetchDailyPayload,
        resolveUrl: (u) => resolveUrl(base, u),
      }).catch(() => {
        // Best-effort background caching; never crash the caller.
      });

      return { ok: true, payload, source: 'remote' };
    } catch {
      // Try next base (web fallback) before declaring offline.
      continue;
    }
  }

  return { ok: false, reason: 'offline' };
}

export function warmDailyCacheInBackground(): void {
  const bases = dailyBaseUrlCandidates();
  if (bases.length === 0) return;
  const base0 = bases[0];
  if (!base0) return;
  void (async () => {
    try {
      const manifest = await fetchDailyManifestForBase(base0);
      const keep = getLastNUtcDateKeys(Date.now(), 30);
      await warmDailyCacheAndEvict({
        saveService: dailySaveService,
        manifest,
        keepDateKeys: keep,
        fetchPayload: fetchDailyPayload,
        resolveUrl: (u) => resolveUrl(base0, u),
      });
    } catch {
      // Swallow: this is best-effort background caching.
    }
  })();
}



