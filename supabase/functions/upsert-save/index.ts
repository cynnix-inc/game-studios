// Supabase Edge Function: upsert-save
// Trusted write: validates input, verifies auth, maps auth user -> player_id, and upserts to public.saves.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  EDGE_ERROR_CODE,
  edgeStartTimer,
  err,
  getRequestId,
  handleOptions,
  logEdgeResult,
  ok,
  withTimeoutFetch,
} from '../_shared/http.ts';

type UpsertSaveBody = {
  game_key: string;
  slot?: string;
  data: unknown;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

type PuzzleSaveV1 = {
  schemaVersion: 1;
  kind: 'sudoku_puzzle_save';
  puzzle_key: string;
  startedAtMs: number;
  givensMask: boolean[];
  serializedGivensPuzzle: string;
  mode: 'free' | 'daily';
  difficulty?: string;
  dailyDateKey?: string;
  device_id: string;
  revision: number;
  moves: Array<{
    schemaVersion: 1;
    device_id: string;
    rev: number;
    ts: number;
    kind: string;
    cell?: number;
    value?: number;
    hintType?: string;
    clientSubmissionId?: string;
  }>;
};

type SettingsV1 = {
  schemaVersion: 1;
  kind: 'sudoku_settings';
  updatedAtMs: number;
  updatedByDeviceId: string;
  ui?: unknown;
  toggles?: unknown;
  extra?: unknown;
};

type StatsV1 = {
  schemaVersion: 1;
  kind: 'sudoku_stats';
  updatedAtMs: number;
  updatedByDeviceId: string;
  daily: {
    completedCount: number;
    rankedCount: number;
    replayCount: number;
  };
  free: {
    completedCount: number;
  };
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isFiniteNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;
}

function isPuzzleSaveV1(v: unknown): v is PuzzleSaveV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_puzzle_save') return false;
  if (typeof v.puzzle_key !== 'string' || v.puzzle_key.length === 0) return false;
  if (!isFiniteNumber(v.startedAtMs) || v.startedAtMs < 0) return false;
  if (!Array.isArray(v.givensMask)) return false;
  if (typeof v.serializedGivensPuzzle !== 'string') return false;
  if (v.mode !== 'free' && v.mode !== 'daily') return false;
  if (typeof v.device_id !== 'string' || v.device_id.length === 0) return false;
  if (!isFiniteNumber(v.revision) || v.revision < 0) return false;
  if (!Array.isArray(v.moves)) return false;
  for (const m of v.moves) {
    if (!isObject(m)) return false;
    if (m.schemaVersion !== 1) return false;
    if (typeof m.device_id !== 'string' || m.device_id.length === 0) return false;
    if (!isFiniteNumber(m.rev) || m.rev < 0) return false;
    if (!isFiniteNumber(m.ts) || m.ts < 0) return false;
    if (typeof m.kind !== 'string' || m.kind.length === 0) return false;
  }
  return true;
}

function isSettingsV1(v: unknown): v is SettingsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_settings') return false;
  if (!isFiniteNumber(v.updatedAtMs) || v.updatedAtMs < 0) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  return true;
}

function isStatsV1(v: unknown): v is StatsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_stats') return false;
  if (!isFiniteNumber(v.updatedAtMs) || v.updatedAtMs < 0) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  if (!isObject(v.daily) || !isObject(v.free)) return false;
  const daily = v.daily as Record<string, unknown>;
  const free = v.free as Record<string, unknown>;
  if (!isFiniteNonNegativeInt(daily.completedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.rankedCount)) return false;
  if (!isFiniteNonNegativeInt(daily.replayCount)) return false;
  if (!isFiniteNonNegativeInt(free.completedCount)) return false;
  return true;
}

function mergeMoveLogs(
  existing: PuzzleSaveV1['moves'],
  incoming: PuzzleSaveV1['moves'],
): PuzzleSaveV1['moves'] {
  const byKey = new Map<string, PuzzleSaveV1['moves'][number]>();
  const push = (m: PuzzleSaveV1['moves'][number]) => {
    const key = `${m.device_id}:${m.rev}`;
    if (!byKey.has(key)) byKey.set(key, m);
  };
  for (const m of existing) push(m);
  for (const m of incoming) push(m);
  const out = Array.from(byKey.values());
  out.sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    if (a.device_id !== b.device_id) return a.device_id < b.device_id ? -1 : 1;
    return a.rev - b.rev;
  });
  return out;
}

function mergePuzzleSaves(existing: PuzzleSaveV1, incoming: PuzzleSaveV1): { ok: true; data: PuzzleSaveV1 } | { ok: false; reason: string } {
  if (existing.puzzle_key !== incoming.puzzle_key) return { ok: false, reason: 'puzzle_key_mismatch' };
  if (existing.serializedGivensPuzzle !== incoming.serializedGivensPuzzle) return { ok: false, reason: 'givens_mismatch' };

  return {
    ok: true,
    data: {
      ...existing,
      // Keep puzzle identity from existing; treat latest writer metadata as incoming.
      startedAtMs: Math.min(existing.startedAtMs, incoming.startedAtMs),
      device_id: incoming.device_id,
      revision: incoming.revision,
      moves: mergeMoveLogs(existing.moves, incoming.moves),
    },
  };
}

function mergeSettings(existing: SettingsV1, incoming: SettingsV1): SettingsV1 {
  if (incoming.updatedAtMs > existing.updatedAtMs) return incoming;
  if (incoming.updatedAtMs < existing.updatedAtMs) return existing;
  return incoming.updatedByDeviceId > existing.updatedByDeviceId ? incoming : existing;
}

function mergeStats(existing: StatsV1, incoming: StatsV1): StatsV1 {
  if (incoming.updatedAtMs > existing.updatedAtMs) return incoming;
  if (incoming.updatedAtMs < existing.updatedAtMs) return existing;
  return incoming.updatedByDeviceId > existing.updatedByDeviceId ? incoming : existing;
}

export default async function handler(req: Request): Promise<Response> {
  const requestId = getRequestId(req);
  const startedAt = edgeStartTimer();

  // CORS preflight: handle OPTIONS and set Access-Control-Allow-Origin / Allow-Methods / Allow-Headers.
  // Request correlation: accepts incoming `x-request-id` if provided, otherwise generates one.
  if (req.method === 'OPTIONS') return handleOptions(req, requestId) ?? new Response(null, { status: 204 });

  if (req.method !== 'POST') {
    const res = err(405, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Method not allowed', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  let body: UpsertSaveBody;
  try {
    body = (await req.json()) as UpsertSaveBody;
  } catch {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid JSON', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const { game_key, slot, data } = body ?? ({} as UpsertSaveBody);
  if (!game_key || typeof game_key !== 'string') {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Missing game_key', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (slot != null && typeof slot !== 'string') {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid slot', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (data == null || typeof data !== 'object') {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid data', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  // Basic payload size guard (JSON bytes). Per-game shape validation belongs in app services.
  const raw = JSON.stringify(data);
  if (raw.length > 250_000) {
    const res = err(413, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Save data too large', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Server misconfigured', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) {
    const res = err(401, EDGE_ERROR_CODE.UNAUTHENTICATED, 'Missing Authorization header', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader }, fetch: withTimeoutFetch(8_000) },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    const res = err(401, EDGE_ERROR_CODE.UNAUTHENTICATED, 'Invalid auth token', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const userId = userData.user.id;
  const { data: existingPlayer, error: playerSelectErr } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (playerSelectErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to load player', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  let playerId = existingPlayer?.id as string | undefined;
  if (!playerId) {
    const { data: inserted, error: insertErr } = await supabase
      .from('players')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (insertErr) {
      const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to create player', requestId);
      logEdgeResult({
        requestId,
        functionName: 'upsert-save',
        method: req.method,
        status: res.status,
        durationMs: Date.now() - startedAt,
        ok: false,
      });
      return res;
    }
    playerId = inserted.id as string;
  }

  const finalSlot = slot ?? 'main';

  // Validate supported save shapes (Epic 6/7: puzzle save + settings + stats).
  const isPuzzle = isPuzzleSaveV1(data);
  const isSettings = isSettingsV1(data);
  const isStats = isStatsV1(data);
  if (!isPuzzle && !isSettings && !isStats) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Unsupported save data shape', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  // Load existing save for merge (service role bypasses RLS).
  const { data: existingSaveRow, error: existingSaveErr } = await supabase
    .from('saves')
    .select('data')
    .eq('player_id', playerId)
    .eq('game_key', game_key)
    .eq('slot', finalSlot)
    .maybeSingle();
  if (existingSaveErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to load existing save', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  let canonical: unknown = data;
  const existingData = existingSaveRow?.data as unknown | undefined;
  if (existingData) {
    if (isPuzzle) {
      if (!isPuzzleSaveV1(existingData)) {
        const res = err(409, EDGE_ERROR_CODE.CONFLICT, 'Existing save has incompatible shape', requestId);
        logEdgeResult({
          requestId,
          functionName: 'upsert-save',
          method: req.method,
          status: res.status,
          durationMs: Date.now() - startedAt,
          ok: false,
        });
        return res;
      }
      const merged = mergePuzzleSaves(existingData, data);
      if (!merged.ok) {
        const res = err(409, EDGE_ERROR_CODE.CONFLICT, `Save conflict: ${merged.reason}`, requestId);
        logEdgeResult({
          requestId,
          functionName: 'upsert-save',
          method: req.method,
          status: res.status,
          durationMs: Date.now() - startedAt,
          ok: false,
        });
        return res;
      }
      canonical = merged.data;
    } else if (isSettings) {
      if (!isSettingsV1(existingData)) {
        const res = err(409, EDGE_ERROR_CODE.CONFLICT, 'Existing save has incompatible shape', requestId);
        logEdgeResult({
          requestId,
          functionName: 'upsert-save',
          method: req.method,
          status: res.status,
          durationMs: Date.now() - startedAt,
          ok: false,
        });
        return res;
      }
      canonical = mergeSettings(existingData, data);
    } else if (isStats) {
      if (!isStatsV1(existingData)) {
        const res = err(409, EDGE_ERROR_CODE.CONFLICT, 'Existing save has incompatible shape', requestId);
        logEdgeResult({
          requestId,
          functionName: 'upsert-save',
          method: req.method,
          status: res.status,
          durationMs: Date.now() - startedAt,
          ok: false,
        });
        return res;
      }
      canonical = mergeStats(existingData, data);
    }
  }

  // Re-check size guard post-merge.
  const canonicalRaw = JSON.stringify(canonical);
  if (canonicalRaw.length > 250_000) {
    const res = err(413, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Save data too large', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const { data: upserted, error: upsertErr } = await supabase
    .from('saves')
    .upsert(
      {
        player_id: playerId,
        game_key,
        slot: finalSlot,
        data: canonical,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,game_key,slot' },
    )
    .select('player_id, game_key, slot, updated_at, data')
    .single();
  if (upsertErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to upsert save', requestId);
    logEdgeResult({
      requestId,
      functionName: 'upsert-save',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const res = ok(
    {
      player_id: upserted.player_id,
      game_key: upserted.game_key,
      slot: upserted.slot,
      updated_at: upserted.updated_at,
      data: upserted.data,
    },
    requestId,
  );
  logEdgeResult({
    requestId,
    functionName: 'upsert-save',
    method: req.method,
    status: res.status,
    durationMs: Date.now() - startedAt,
    ok: true,
  });
  return res;
}


