import { isSudokuStatsV1, mergeStatsLww, type SudokuStatsV1 } from '../statsModel';

describe('statsModel', () => {
  test('isSudokuStatsV1 validates minimal shape', () => {
    const v: SudokuStatsV1 = {
      schemaVersion: 1,
      kind: 'sudoku_stats',
      updatedAtMs: 123,
      updatedByDeviceId: 'dev1',
      daily: { completedCount: 0, rankedCount: 0, replayCount: 0 },
      free: { completedCount: 0 },
    };
    expect(isSudokuStatsV1(v)).toBe(true);
    expect(isSudokuStatsV1({ ...v, kind: 'nope' })).toBe(false);
  });

  test('mergeStatsLww prefers higher updatedAtMs, then device id tie-break', () => {
    const a: SudokuStatsV1 = {
      schemaVersion: 1,
      kind: 'sudoku_stats',
      updatedAtMs: 1000,
      updatedByDeviceId: 'aaa',
      daily: { completedCount: 1, rankedCount: 1, replayCount: 0 },
      free: { completedCount: 2 },
    };
    const b: SudokuStatsV1 = { ...a, updatedAtMs: 2000, daily: { completedCount: 2, rankedCount: 2, replayCount: 0 } };
    expect(mergeStatsLww(a, b)).toEqual(b);

    const c: SudokuStatsV1 = { ...a, updatedAtMs: 1000, updatedByDeviceId: 'bbb', free: { completedCount: 9 } };
    expect(mergeStatsLww(a, c)).toEqual(c);
  });
});


