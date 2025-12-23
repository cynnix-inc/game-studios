export function buildSupabaseRestUrl(baseUrl: string, path: string, params: Record<string, string | string[]>): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const u = new URL(`${base}${path.startsWith('/') ? '' : '/'}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) u.searchParams.append(k, item);
      continue;
    }
    u.searchParams.set(k, v);
  }
  return u.toString();
}


