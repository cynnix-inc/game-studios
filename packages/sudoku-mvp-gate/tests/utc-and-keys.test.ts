import { formatUtcDateKey, makeDailyPuzzleKey, makeFreePuzzleKey } from '@cynnix-studios/sudoku-core';

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
});


