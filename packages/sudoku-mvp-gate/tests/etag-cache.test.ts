import { fetchJsonWithEtagCache } from '@cynnix-studios/game-foundation/http';

type CacheValue = { etag: string | null; json: unknown };

function makeMemoryCache() {
  const map = new Map<string, CacheValue>();
  return {
    async get(key: string): Promise<CacheValue | null> {
      return map.get(key) ?? null;
    },
    async set(key: string, value: CacheValue): Promise<void> {
      map.set(key, value);
    },
    clear() {
      map.clear();
    },
  };
}

describe('fetchJsonWithEtagCache', () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  test('caches JSON + ETag on 200, then returns cached JSON on 304 and sends If-None-Match', async () => {
    const cache = makeMemoryCache();
    const url = 'https://example.test/manifest.json';
    const key = 'daily-manifest';

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ schema_version: 1, ok: true }), {
          status: 200,
          headers: { ETag: '"abc123"' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304, headers: {} }));

    const r1 = await fetchJsonWithEtagCache({
      cache,
      cacheKey: key,
      input: url,
      init: undefined,
      policy: { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('unreachable');
    expect(r1.source).toBe('remote');
    expect(r1.etag).toBe('"abc123"');

    const r2 = await fetchJsonWithEtagCache({
      cache,
      cacheKey: key,
      input: url,
      init: undefined,
      policy: { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('unreachable');
    expect(r2.source).toBe('cache');
    expect(r2.json).toEqual({ schema_version: 1, ok: true });

    // Verify second call sent If-None-Match header.
    const secondInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
    const headers = secondInit?.headers;
    const ifNoneMatch =
      headers instanceof Headers
        ? headers.get('If-None-Match')
        : Array.isArray(headers)
          ? (headers.find((pair) => (pair?.[0] ?? '').toLowerCase() === 'if-none-match')?.[1] ?? null)
          : typeof headers === 'object' && headers
            ? ((headers as Record<string, string>)['If-None-Match'] ?? (headers as Record<string, string>)['if-none-match'] ?? null)
            : null;
    expect(ifNoneMatch).toBe('"abc123"');
  });

  test('returns a stable error when server replies 304 but cache is missing', async () => {
    const cache = makeMemoryCache();
    const url = 'https://example.test/manifest.json';
    const key = 'daily-manifest';

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 304, headers: {} }));

    const r = await fetchJsonWithEtagCache({
      cache,
      cacheKey: key,
      input: url,
      init: undefined,
      policy: { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('unreachable');
    expect(r.error.code).toBe('CACHE_MISS_ON_304');
  });
});


