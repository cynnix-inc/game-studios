type EdgeError = {
  code: string;
  message: string;
  details?: unknown;
};

type OkEnvelope<T> = { ok: true; data: T; requestId: string };
type ErrEnvelope = { ok: false; error: EdgeError; requestId: string };

export const EDGE_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  INTERNAL: 'INTERNAL',
} as const;

export type EdgeErrorCode = (typeof EDGE_ERROR_CODE)[keyof typeof EDGE_ERROR_CODE];

function safeNowMs(): number {
  return Date.now();
}

export function getRequestId(req: Request): string {
  const incoming = req.headers.get('x-request-id') ?? req.headers.get('X-Request-Id');
  if (incoming && incoming.trim().length > 0) return incoming.trim();
  return crypto.randomUUID();
}

export function corsHeaders(): HeadersInit {
  // Public API surface for apps/web export. If we later want a locked-down origin list,
  // make it explicit via env and do NOT reflect arbitrary origins.
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    // Include `apikey` because app clients may call public Edge Functions with the anon key.
    'access-control-allow-headers': 'authorization, apikey, content-type, x-request-id',
    'access-control-max-age': '86400',
  };
}

export function jsonResponse(status: number, body: unknown, requestId: string, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders(),
      ...(extraHeaders ?? {}),
    },
  });
}

export function ok<T>(data: T, requestId: string): Response {
  const body: OkEnvelope<T> = { ok: true, data, requestId };
  return jsonResponse(200, body, requestId);
}

export function err(
  status: number,
  code: EdgeErrorCode,
  message: string,
  requestId: string,
  details?: unknown,
): Response {
  const error: EdgeError = details === undefined ? { code, message } : { code, message, details };
  const body: ErrEnvelope = { ok: false, error, requestId };
  return jsonResponse(status, body, requestId);
}

export function handleOptions(req: Request, requestId: string): Response | null {
  if (req.method !== 'OPTIONS') return null;
  // No body required for preflight; still include requestId for consistency/debuggability.
  return new Response(null, { status: 204, headers: { ...corsHeaders(), 'x-request-id': requestId } });
}

export function logEdgeResult(input: {
  requestId: string;
  functionName: string;
  method: string;
  status: number;
  durationMs: number;
  ok: boolean;
}): void {
  const payload = {
    requestId: input.requestId,
    fn: input.functionName,
    method: input.method,
    status: input.status,
    durationMs: input.durationMs,
    ok: input.ok,
  };
  // Never log secrets/tokens. Keep logs to summaries only.
  if (input.ok) console.info('edge_ok', payload);
  else console.error('edge_error', payload);
}

export function withTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // If caller passed a signal, we still enforce our timeout as well.
      const res = await fetch(input, { ...init, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(t);
    }
  };
}

export function edgeStartTimer(): number {
  return safeNowMs();
}


