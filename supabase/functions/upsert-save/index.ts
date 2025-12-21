// Supabase Edge Function: upsert-save
// Trusted write: validates input, verifies auth, maps auth user -> player_id, and upserts to public.saves.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type UpsertSaveBody = {
  game_key: string;
  slot?: string;
  data: unknown;
};

type ErrorCode =
  | 'method_not_allowed'
  | 'invalid_json'
  | 'invalid_payload'
  | 'not_authenticated'
  | 'server_misconfigured'
  | 'db_error';

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function ok<T>(data: T) {
  return json(200, { ok: true, data });
}

function err(code: ErrorCode, message: string, status = 400) {
  return json(status, { ok: false, error: { code, message } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return err('method_not_allowed', 'Method not allowed', 405);

  let body: UpsertSaveBody;
  try {
    body = (await req.json()) as UpsertSaveBody;
  } catch {
    return err('invalid_json', 'Invalid JSON', 400);
  }

  const { game_key, slot, data } = body ?? ({} as UpsertSaveBody);
  if (!game_key || typeof game_key !== 'string') return err('invalid_payload', 'Missing game_key', 400);
  if (slot != null && typeof slot !== 'string') return err('invalid_payload', 'Invalid slot', 400);
  if (data == null || typeof data !== 'object') return err('invalid_payload', 'Invalid data', 400);

  // Basic payload size guard (JSON bytes). Per-game shape validation belongs in app services.
  const raw = JSON.stringify(data);
  if (raw.length > 250_000) return err('invalid_payload', 'Save data too large', 413);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return err('server_misconfigured', 'Missing Supabase env', 500);

  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) return err('not_authenticated', 'Missing Authorization header', 401);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return err('not_authenticated', 'Invalid auth token', 401);

  const userId = userData.user.id;
  const { data: existingPlayer, error: playerSelectErr } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (playerSelectErr) return err('db_error', 'Failed to load player', 500);

  let playerId = existingPlayer?.id as string | undefined;
  if (!playerId) {
    const { data: inserted, error: insertErr } = await supabase
      .from('players')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (insertErr) return err('db_error', 'Failed to create player', 500);
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
  if (upsertErr) return err('db_error', 'Failed to upsert save', 500);

  return ok({
    player_id: upserted.player_id,
    game_key: upserted.game_key,
    slot: upserted.slot,
    updated_at: upserted.updated_at,
  });
}


