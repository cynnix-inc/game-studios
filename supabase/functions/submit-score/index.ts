// Supabase Edge Function: submit-score (Sudoku v1.1)
// Trusted write: validates input, verifies auth, maps auth user -> player_id, computes score_ms server-side,
// enforces “first completion per UTC date is ranked”, and inserts a daily_runs row.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type HintType =
  | 'explain_technique'
  | 'show_candidates'
  | 'highlight_next_move'
  | 'check_selected_cell'
  | 'check_whole_board'
  | 'reveal_cell_value';

type SubmitScoreBody = {
  utc_date: string; // YYYY-MM-DD (UTC-keyed)
  raw_time_ms: number;
  mistakes_count: number;
  hints_used_count?: number;
  hint_breakdown?: Partial<Record<HintType, number>>;
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

function toNonNegativeInt(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function computeScoreMs(input: {
  raw_time_ms: number;
  mistakes_count: number;
  hint_breakdown?: Partial<Record<HintType, number>> | null;
}): number {
  const penalties: Record<HintType, number> = {
    explain_technique: 30_000,
    show_candidates: 45_000,
    highlight_next_move: 60_000,
    check_selected_cell: 30_000,
    check_whole_board: 90_000,
    reveal_cell_value: 120_000,
  };

  const raw = toNonNegativeInt(input.raw_time_ms);
  const mistakes = toNonNegativeInt(input.mistakes_count);
  const breakdown = input.hint_breakdown ?? {};

  let hintPenalty = 0;
  for (const k of Object.keys(penalties) as HintType[]) {
    const count = toNonNegativeInt((breakdown as Record<string, unknown>)[k]);
    hintPenalty += count * penalties[k];
  }

  return raw + mistakes * 30_000 + hintPenalty;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return err('method_not_allowed', 'Method not allowed', 405);

  let body: SubmitScoreBody;
  try {
    body = (await req.json()) as SubmitScoreBody;
  } catch {
    return err('invalid_json', 'Invalid JSON', 400);
  }

  const utcDate = body?.utc_date;
  if (typeof utcDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
    return err('invalid_payload', 'Invalid utc_date', 400);
  }
  if (!Number.isFinite(body.raw_time_ms) || body.raw_time_ms < 0) return err('invalid_payload', 'Invalid raw_time_ms');
  if (!Number.isFinite(body.mistakes_count) || body.mistakes_count < 0) return err('invalid_payload', 'Invalid mistakes_count');

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

  const scoreMs = computeScoreMs({
    raw_time_ms: body.raw_time_ms,
    mistakes_count: body.mistakes_count,
    hint_breakdown: body.hint_breakdown ?? {},
  });
  const hintsUsed = toNonNegativeInt(body.hints_used_count ?? 0);

  const { data: rankedExisting, error: rankedErr } = await supabase
    .from('daily_runs')
    .select('id')
    .eq('player_id', playerId)
    .eq('utc_date', utcDate)
    .eq('ranked_submission', true)
    .limit(1);
  if (rankedErr) return err('db_error', 'Failed to check ranked submission', 500);

  const rankedSubmission = (rankedExisting?.length ?? 0) === 0;

  const { error: runInsertErr } = await supabase.from('daily_runs').insert({
    utc_date: utcDate,
    player_id: playerId,
    raw_time_ms: toNonNegativeInt(body.raw_time_ms),
    score_ms: scoreMs,
    mistakes_count: toNonNegativeInt(body.mistakes_count),
    hints_used_count: hintsUsed,
    hint_breakdown: body.hint_breakdown ?? {},
    ranked_submission: rankedSubmission,
  });
  if (runInsertErr) return err('db_error', 'Failed to insert daily run', 500);

  return ok({
    utc_date: utcDate,
    ranked_submission: rankedSubmission,
    raw_time_ms: toNonNegativeInt(body.raw_time_ms),
    score_ms: scoreMs,
    mistakes_count: toNonNegativeInt(body.mistakes_count),
    hints_used_count: hintsUsed,
  });
}


