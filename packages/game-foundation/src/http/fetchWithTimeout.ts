export type FetchPolicy = {
  /**
   * Hard timeout for the whole request attempt.
   * Rule 11 guidance: app/client HTTP <= 10s.
   */
  timeoutMs: number;
  /**
   * Total attempts including the first try. Recommended max is 3.
   */
  maxAttempts: number;
  /**
   * Only retry when the caller asserts the operation is idempotent.
   */
  idempotent: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(header: string | null): number | null {
  if (!header) return null;
  const n = Number(header);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  policy: FetchPolicy,
): Promise<Response> {
  const { timeoutMs, maxAttempts, idempotent } = policy;
  const attempts = Math.max(1, Math.floor(maxAttempts));
  const timeout = Math.max(1, Math.floor(timeoutMs));

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      if (!idempotent || attempt === attempts) return res;
      if (!isRetryableStatus(res.status)) return res;

      // Respect Retry-After (seconds) when present for 429.
      const retryAfter = parseRetryAfterSeconds(res.headers.get('Retry-After'));
      const base = retryAfter != null ? retryAfter * 1000 : 250 * 2 ** (attempt - 1);
      const jitter = Math.floor(Math.random() * 100);
      await sleep(base + jitter);
      continue;
    } catch (e) {
      lastErr = e;
      if (!idempotent || attempt === attempts) throw e;
      const base = 250 * 2 ** (attempt - 1);
      const jitter = Math.floor(Math.random() * 100);
      await sleep(base + jitter);
      continue;
    } finally {
      clearTimeout(t);
    }
  }

  // Should be unreachable, but keep TS happy.
  throw lastErr ?? new Error('fetchWithTimeout failed');
}


