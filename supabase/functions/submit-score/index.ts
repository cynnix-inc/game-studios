// Supabase Edge Function: submit-score (Sudoku v1.1)
// Trusted write: validates input, verifies auth, maps auth user -> player_id, computes score_ms server-side,
// enforces “first completion per UTC date is ranked”, and inserts a daily_runs row.

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
  const requestId = getRequestId(req);
  const startedAt = edgeStartTimer();

  // CORS preflight: handle OPTIONS and set Access-Control-Allow-Origin / Allow-Methods / Allow-Headers.
  // Request correlation: accepts incoming `x-request-id` if provided, otherwise generates one.
  if (req.method === 'OPTIONS') return handleOptions(req, requestId) ?? new Response(null, { status: 204 });

  if (req.method !== 'POST') {
    const res = err(405, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Method not allowed', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  let body: SubmitScoreBody;
  try {
    body = (await req.json()) as SubmitScoreBody;
  } catch {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid JSON', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const utcDate = body?.utc_date;
  if (typeof utcDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid utc_date', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!Number.isFinite(body.raw_time_ms) || body.raw_time_ms < 0) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid raw_time_ms', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!Number.isFinite(body.mistakes_count) || body.mistakes_count < 0) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid mistakes_count', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
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
      functionName: 'submit-score',
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
      functionName: 'submit-score',
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
      functionName: 'submit-score',
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
      functionName: 'submit-score',
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
        functionName: 'submit-score',
        method: req.method,
        status: res.status,
        durationMs: Date.now() - startedAt,
        ok: false,
      });
      return res;
    }
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
  if (rankedErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to check ranked submission', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

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
  if (runInsertErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to insert daily run', requestId);
    logEdgeResult({
      requestId,
      functionName: 'submit-score',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const res = ok(
    {
    utc_date: utcDate,
    ranked_submission: rankedSubmission,
    raw_time_ms: toNonNegativeInt(body.raw_time_ms),
    score_ms: scoreMs,
    mistakes_count: toNonNegativeInt(body.mistakes_count),
    hints_used_count: hintsUsed,
    },
    requestId,
  );
  logEdgeResult({
    requestId,
    functionName: 'submit-score',
    method: req.method,
    status: res.status,
    durationMs: Date.now() - startedAt,
    ok: true,
  });
  return res;
}


