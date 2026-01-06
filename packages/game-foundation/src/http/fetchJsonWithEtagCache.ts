import { fetchWithTimeout, type FetchPolicy } from './fetchWithTimeout';

export type EtagJsonCacheValue = {
  etag: string | null;
  json: unknown;
};

export type EtagJsonCache = {
  get(key: string): Promise<EtagJsonCacheValue | null>;
  set(key: string, value: EtagJsonCacheValue): Promise<void>;
};

export type FetchJsonWithEtagCacheErrorCode = 'HTTP_ERROR' | 'INVALID_JSON' | 'NETWORK_ERROR' | 'CACHE_MISS_ON_304';

export type FetchJsonWithEtagCacheError = {
  code: FetchJsonWithEtagCacheErrorCode;
  status?: number;
};

export type FetchJsonWithEtagCacheOk<T> = {
  ok: true;
  json: T;
  etag: string | null;
  source: 'remote' | 'cache';
  status: number;
};

export type FetchJsonWithEtagCacheErr = {
  ok: false;
  error: FetchJsonWithEtagCacheError;
};

export type FetchJsonWithEtagCacheResult<T> = FetchJsonWithEtagCacheOk<T> | FetchJsonWithEtagCacheErr;

function mergeHeaders(base: RequestInit['headers'] | undefined, extra: Record<string, string>): Headers {
  const h = new Headers(base);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

export async function fetchJsonWithEtagCache<T>(args: {
  cache: EtagJsonCache;
  cacheKey: string;
  input: RequestInfo | URL;
  init: RequestInit | undefined;
  policy: FetchPolicy;
  parse?: (json: unknown) => T;
}): Promise<FetchJsonWithEtagCacheResult<T>> {
  const cached = await args.cache.get(args.cacheKey);
  const ifNoneMatch = cached?.etag ?? null;

  const headers =
    ifNoneMatch && ifNoneMatch.length > 0
      ? mergeHeaders(args.init?.headers, { 'If-None-Match': ifNoneMatch })
      : new Headers(args.init?.headers);

  let res: Response;
  try {
    res = await fetchWithTimeout(args.input, { ...args.init, headers }, args.policy);
  } catch {
    return { ok: false, error: { code: 'NETWORK_ERROR' } };
  }

  if (res.status === 304) {
    if (!cached) return { ok: false, error: { code: 'CACHE_MISS_ON_304', status: 304 } };
    try {
      const parsed = args.parse ? args.parse(cached.json) : (cached.json as T);
      return { ok: true, json: parsed, etag: cached.etag, source: 'cache', status: 304 };
    } catch {
      return { ok: false, error: { code: 'INVALID_JSON', status: 304 } };
    }
  }

  if (!res.ok) {
    return { ok: false, error: { code: 'HTTP_ERROR', status: res.status } };
  }

  let jsonUnknown: unknown;
  try {
    jsonUnknown = (await res.json()) as unknown;
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', status: res.status } };
  }

  const etag = res.headers.get('ETag');
  await args.cache.set(args.cacheKey, { etag, json: jsonUnknown });

  try {
    const parsed = args.parse ? args.parse(jsonUnknown) : (jsonUnknown as T);
    return { ok: true, json: parsed, etag, source: 'remote', status: res.status };
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', status: res.status } };
  }
}


