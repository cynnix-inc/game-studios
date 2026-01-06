// Supabase Edge Function: track-event (Sudoku v1.1 Epic 10)
// Trusted write: validates telemetry payload, optionally maps auth user -> user_id, and inserts to public.telemetry_events.

// @ts-expect-error - Deno edge runtime resolves this remote module at runtime.
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

// Minimal Deno env typing for editor/TS tooling; Supabase Edge Runtime provides Deno at runtime.
declare const Deno: { env: { get(key: string): string | undefined } };

type Platform = 'web' | 'android' | 'ios';

type TelemetryEventName =
  | 'app_open'
  | 'start_freeplay'
  | 'start_daily'
  | 'complete_puzzle'
  | 'abandon_puzzle'
  | 'hint_used'
  | 'sign_in_success'
  | 'convert_guest_to_account'
  | 'leaderboard_view'
  | 'daily_rank_resolved';

type TelemetryPropValue = string | number | boolean | null;

type TrackEventBody = {
  name: TelemetryEventName;
  props?: Record<string, TelemetryPropValue>;
  platform: Platform;
  device_id: string;
  session_id: string;
  utc_ts_ms: number;
  app_version?: string | null;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isAllowedName(v: unknown): v is TelemetryEventName {
  if (typeof v !== 'string') return false;
  const allowed: Record<TelemetryEventName, true> = {
    app_open: true,
    start_freeplay: true,
    start_daily: true,
    complete_puzzle: true,
    abandon_puzzle: true,
    hint_used: true,
    sign_in_success: true,
    convert_guest_to_account: true,
    leaderboard_view: true,
    daily_rank_resolved: true,
  };
  return (allowed as Record<string, true | undefined>)[v] === true;
}

function isPlatform(v: unknown): v is Platform {
  return v === 'web' || v === 'android' || v === 'ios';
}

function isTelemetryProps(v: unknown): v is Record<string, TelemetryPropValue> {
  if (v == null) return true; // props optional
  if (!isObject(v)) return false;
  for (const [k, val] of Object.entries(v)) {
    if (k.length === 0) return false;
    const t = typeof val;
    if (val === null) continue;
    if (t === 'string' || t === 'number' || t === 'boolean') continue;
    return false;
  }
  return true;
}

function safeTruncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen);
}

function looksLikeJwtAuthHeader(v: string): boolean {
  // Expected shape: "Bearer <jwt>" where jwt has 3 dot-separated segments.
  const s = v.trim();
  const lower = s.toLowerCase();
  if (!lower.startsWith('bearer ')) return false;
  const token = s.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  // Quick sanity check: avoid huge strings and obvious non-jwt tokens.
  if (token.length > 5000) return false;
  return true;
}

export default async function handler(req: Request): Promise<Response> {
  const requestId = getRequestId(req);
  const startedAt = edgeStartTimer();

  if (req.method === 'OPTIONS') return handleOptions(req, requestId) ?? new Response(null, { status: 204 });

  if (req.method !== 'POST') {
    const res = err(405, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Method not allowed', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  let body: TrackEventBody;
  try {
    body = (await req.json()) as TrackEventBody;
  } catch {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid JSON', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  if (!isAllowedName(body?.name)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid name', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!isPlatform(body?.platform)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid platform', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!isNonEmptyString(body?.device_id)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid device_id', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!isNonEmptyString(body?.session_id)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid session_id', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!isFiniteNumber(body?.utc_ts_ms) || body.utc_ts_ms <= 0) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid utc_ts_ms', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }
  if (!isTelemetryProps(body?.props)) {
    const res = err(400, EDGE_ERROR_CODE.VALIDATION_ERROR, 'Invalid props', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
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
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  // Service-role client for DB insert (do not forward client Authorization header here).
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: withTimeoutFetch(8_000) },
  });

  // Optional user correlation: only attempt auth lookup when the Authorization looks like a JWT.
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  let userId: string | null = null;
  if (authHeader && looksLikeJwtAuthHeader(authHeader)) {
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader }, fetch: withTimeoutFetch(8_000) },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (!userErr && userData.user?.id) userId = userData.user.id;
  }

  const appVersion = body.app_version == null ? null : safeTruncate(String(body.app_version), 64);
  const deviceId = safeTruncate(body.device_id.trim(), 128);
  const sessionId = safeTruncate(body.session_id.trim(), 128);
  const props = { ...(body.props ?? {}), utc_ts_ms: body.utc_ts_ms };

  const insert = {
    event_name: body.name,
    props,
    platform: body.platform,
    app_version: appVersion,
    device_id: deviceId,
    session_id: sessionId,
    user_id: userId,
  };

  const { error: insertErr } = await supabase.from('telemetry_events').insert(insert);
  if (insertErr) {
    const res = err(500, EDGE_ERROR_CODE.INTERNAL, 'Failed to insert telemetry event', requestId);
    logEdgeResult({
      requestId,
      functionName: 'track-event',
      method: req.method,
      status: res.status,
      durationMs: Date.now() - startedAt,
      ok: false,
    });
    return res;
  }

  const res = ok({ inserted: 1 }, requestId);
  logEdgeResult({
    requestId,
    functionName: 'track-event',
    method: req.method,
    status: res.status,
    durationMs: Date.now() - startedAt,
    ok: true,
  });
  return res;
}


