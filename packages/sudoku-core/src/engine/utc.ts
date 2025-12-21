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


