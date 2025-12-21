const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateKey(x: string): boolean {
  return DATE_KEY_RE.test(x);
}

export function computeDailyCacheKeysToEvict(input: { cachedKeys: string[]; keepKeys: string[] }): string[] {
  const keep = new Set(input.keepKeys.filter(isDateKey));
  return input.cachedKeys.filter((k) => isDateKey(k) && !keep.has(k));
}



