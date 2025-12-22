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
  const { data: upserted, error: upsertErr } = await supabase
    .from('saves')
    .upsert(
      {
        player_id: playerId,
        game_key,
        slot: finalSlot,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,game_key,slot' },
    )
    .select('player_id, game_key, slot, updated_at')
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


