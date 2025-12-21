import { formatUtcDateKey, getLastNUtcDateKeys, msUntilNextUtcMidnight, nowUtcDateKey } from '../src/engine/utc';

describe('daily UTC helpers', () => {
  test('nowUtcDateKey formats UTC day key for a timestamp', () => {
    // 2025-01-02T03:04:05.006Z
    const nowMs = Date.UTC(2025, 0, 2, 3, 4, 5, 6);
    expect(nowUtcDateKey(nowMs)).toBe('2025-01-02');
  });

  test('formatUtcDateKey uses UTC fields (not local)', () => {
    const d = new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999));
    expect(formatUtcDateKey(d)).toBe('2025-12-31');
  });

  test('msUntilNextUtcMidnight counts down to the next UTC midnight boundary', () => {
    // 2025-01-02T23:59:59.000Z -> 1s remaining
    const nowMs = Date.UTC(2025, 0, 2, 23, 59, 59, 0);
    expect(msUntilNextUtcMidnight(nowMs)).toBe(1000);
  });

  test('getLastNUtcDateKeys returns the last N UTC date keys including today (most recent first)', () => {
    // 2025-01-02
    const nowMs = Date.UTC(2025, 0, 2, 12, 0, 0, 0);
    expect(getLastNUtcDateKeys(nowMs, 3)).toEqual(['2025-01-02', '2025-01-01', '2024-12-31']);
  });

  test('getLastNUtcDateKeys works across leap day', () => {
    // 2024-03-01
    const nowMs = Date.UTC(2024, 2, 1, 12, 0, 0, 0);
    expect(getLastNUtcDateKeys(nowMs, 2)).toEqual(['2024-03-01', '2024-02-29']);
  });
});


