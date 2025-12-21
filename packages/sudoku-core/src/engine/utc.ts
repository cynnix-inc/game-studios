function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Format a Date into a UTC day key: YYYY-MM-DD
 */
export function formatUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = pad2(date.getUTCMonth() + 1);
  const d = pad2(date.getUTCDate());
  return `${y}-${m}-${d}`;
}

/**
 * Get the UTC day key (YYYY-MM-DD) for a given timestamp (ms since epoch).
 */
export function nowUtcDateKey(nowMs: number = Date.now()): string {
  return formatUtcDateKey(new Date(nowMs));
}

/**
 * Milliseconds until the next UTC midnight boundary.
 * Always returns a value in the range (0..=86400000].
 */
export function msUntilNextUtcMidnight(nowMs: number = Date.now()): number {
  const d = new Date(nowMs);
  const nextMidnightMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
  const diff = nextMidnightMs - nowMs;
  return Math.max(0, diff);
}

/**
 * Return the last N UTC day keys including the day containing `nowMs`.
 * Output is most-recent first: [today, yesterday, ...].
 */
export function getLastNUtcDateKeys(nowMs: number, count: number): string[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return [];

  const base = new Date(nowMs);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime());
    d.setUTCDate(base.getUTCDate() - i);
    out.push(formatUtcDateKey(d));
  }
  return out;
}


