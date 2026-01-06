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
  client_submission_id?: string; // UUID (idempotency key)
};

function toNonNegativeInt(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function isUuid(v: string): boolean {
  // Accept lowercase/uppercase canonical UUIDs.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
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

function computeHintsUsedCount(breakdown: Partial<Record<HintType, number>> | null | undefined): number {
  const b = breakdown ?? {};
  let total = 0;
  const keys: HintType[] = [
    'explain_technique',
    'show_candidates',
    'highlight_next_move',
    'check_selected_cell',
    'check_whole_board',
    'reveal_cell_value',
  ];
  for (const k of keys) total += toNonNegativeInt((b as Record<string, unknown>)[k]);
  return total;
}

function makePseudonymousDisplayName(): string {
  // MVP: Not required to be unique. Avoid PII (do not derive from email).
  // Example: Player-AB12
  const token = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9]/gi, '');
  return `Player-${token.slice(0, 4).toUpperCase()}`;
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

  const clientSubmissionId = body.client_submission_id;
  if (clientSubmissionId != null) {
    if (typeof clientSubmissionId !== 'string' || !isUuid(clientSubmissionId)) {
      const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid client_submission_id', requestId);
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
    .select('id, display_name')
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
  let displayName = (existingPlayer?.display_name as string | null | undefined) ?? null;
  if (!playerId) {
    const newName = makePseudonymousDisplayName();
    const { data: inserted, error: insertErr } = await supabase
      .from('players')
      .insert({ user_id: userId, display_name: newName })
      .select('id, display_name')
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
    displayName = (inserted.display_name as string | null | undefined) ?? newName;
  }

  if (!displayName) {
    const newName = makePseudonymousDisplayName();
    const { error: updateErr } = await supabase.from('players').update({ display_name: newName }).eq('id', playerId);
    if (!updateErr) displayName = newName;
    else displayName = 'Player';
  }

  const scoreMs = computeScoreMs({
    raw_time_ms: body.raw_time_ms,
    mistakes_count: body.mistakes_count,
    hint_breakdown: body.hint_breakdown ?? {},
  });
  const hintBreakdown = body.hint_breakdown ?? {};
  const hintsUsed = computeHintsUsedCount(hintBreakdown);

  const baseInsert = {
    utc_date: utcDate,
    player_id: playerId,
    display_name: displayName,
    raw_time_ms: toNonNegativeInt(body.raw_time_ms),
    score_ms: scoreMs,
    mistakes_count: toNonNegativeInt(body.mistakes_count),
    hints_used_count: hintsUsed,
    hint_breakdown: hintBreakdown,
    client_submission_id: clientSubmissionId ?? null,
  };

  async function loadByClientSubmissionId(id: string) {
    const { data, error } = await supabase
      .from('daily_runs')
      .select('utc_date, ranked_submission, display_name, raw_time_ms, score_ms, mistakes_count, hints_used_count, client_submission_id')
      .eq('client_submission_id', id)
      .maybeSingle();
    return { data, error };
  }

  // Race-safe ranked-first-attempt enforcement:
  // - Prefer inserting ranked_submission=true first (protected by a partial unique index on (player_id, utc_date) where ranked_submission=true).
  // - If that conflicts, insert ranked_submission=false (replay).
  const tryInsert = async (ranked: boolean) => {
    return await supabase
      .from('daily_runs')
      .insert({ ...baseInsert, ranked_submission: ranked })
      .select('utc_date, ranked_submission, display_name, raw_time_ms, score_ms, mistakes_count, hints_used_count, client_submission_id')
      .single();
  };

  let inserted:
    | {
        utc_date: string;
        ranked_submission: boolean;
        display_name: string;
        raw_time_ms: number;
        score_ms: number;
        mistakes_count: number;
        hints_used_count: number;
        client_submission_id: string | null;
      }
    | null = null;

  // First attempt: ranked
  const rankedAttempt = await tryInsert(true);
  if (!rankedAttempt.error) {
    inserted = rankedAttempt.data as typeof inserted;
  } else if (rankedAttempt.error.code === '23505' && clientSubmissionId) {
    // Duplicate (idempotency or ranked-unique). If the id exists, return the previously inserted row.
    const existing = await loadByClientSubmissionId(clientSubmissionId);
    if (!existing.error && existing.data) {
      inserted = existing.data as typeof inserted;
    }
  }

  // If ranked insert failed because ranked submission already exists, insert replay.
  if (!inserted) {
    const replayAttempt = await tryInsert(false);
    if (!replayAttempt.error) {
      inserted = replayAttempt.data as typeof inserted;
    } else if (replayAttempt.error.code === '23505' && clientSubmissionId) {
      const existing = await loadByClientSubmissionId(clientSubmissionId);
      if (!existing.error && existing.data) {
        inserted = existing.data as typeof inserted;
      }
    }
  }

  if (!inserted) {
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
      utc_date: inserted.utc_date,
      ranked_submission: inserted.ranked_submission,
      display_name: inserted.display_name,
      raw_time_ms: inserted.raw_time_ms,
      score_ms: inserted.score_ms,
      mistakes_count: inserted.mistakes_count,
      hints_used_count: inserted.hints_used_count,
      client_submission_id: inserted.client_submission_id,
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



