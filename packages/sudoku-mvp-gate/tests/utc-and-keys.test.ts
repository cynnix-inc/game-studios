import { computeDailyCacheKeysToEvict, formatUtcDateKey, getLastNUtcDateKeys, makeDailyPuzzleKey, makeFreePuzzleKey, msUntilNextUtcMidnight } from '@cynnix-studios/sudoku-core';

describe('UTC date keying + puzzle key conventions', () => {
  test('formatUtcDateKey uses UTC date parts (YYYY-MM-DD)', () => {
    // 2025-12-31T23:59:59.999Z is still 2025-12-31 in UTC.
    expect(formatUtcDateKey(new Date('2025-12-31T23:59:59.999Z'))).toBe('2025-12-31');
    // 2026-01-01T00:00:00.000Z is 2026-01-01 in UTC.
    expect(formatUtcDateKey(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
  });

  test('daily puzzle key format is daily:YYYY-MM-DD', () => {
    expect(makeDailyPuzzleKey('2025-12-20')).toBe('daily:2025-12-20');
  });

  test('free puzzle key format is free:<difficulty>:<puzzle_id>', () => {
    expect(makeFreePuzzleKey('easy', 'puz_123')).toBe('free:easy:puz_123');
  });

  test('Epic 2 gate: archive includes last 30 UTC days, most-recent first', () => {
    const nowMs = Date.UTC(2025, 0, 2, 12, 0, 0, 0); // 2025-01-02
    const keys = getLastNUtcDateKeys(nowMs, 30);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe('2025-01-02');
    expect(keys[1]).toBe('2025-01-01');
  });

  test('Epic 2 gate: rollover countdown is always within 24h', () => {
    const nowMs = Date.UTC(2025, 0, 2, 12, 0, 0, 0);
    const ms = msUntilNextUtcMidnight(nowMs);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  test('Epic 2 gate: cache eviction removes keys not in keep set', () => {
    const evict = computeDailyCacheKeysToEvict({
      cachedKeys: ['2025-01-02', '2024-12-31'],
      keepKeys: ['2025-01-02'],
    });
    expect(evict).toEqual(['2024-12-31']);
  });
});


