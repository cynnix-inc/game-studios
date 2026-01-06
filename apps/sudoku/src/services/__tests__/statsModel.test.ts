import { isSudokuStatsV1, isSudokuStatsV2, isSudokuStatsV3, mergeStatsV3, type SudokuStatsV1, type SudokuStatsV2, type SudokuStatsV3 } from '../statsModel';

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

  test('isSudokuStatsV2 validates minimal shape', () => {
    const v: SudokuStatsV2 = {
      schemaVersion: 2,
      kind: 'sudoku_stats',
      updatedAtMs: 123,
      updatedByDeviceId: 'dev1',
      devices: {
        dev1: { updatedAtMs: 123, buckets: {}, daily: { rankedCount: 0, replayCount: 0 } },
      },
    };
    expect(isSudokuStatsV2(v)).toBe(true);
    expect(isSudokuStatsV2({ ...v, schemaVersion: 1 } as unknown)).toBe(false);
  });

  test('isSudokuStatsV3 validates minimal shape', () => {
    const emptyRun = {
      totalTimeMs: 0,
      totalSetCount: 0,
      totalClearCount: 0,
      totalNoteAddCount: 0,
      totalNoteRemoveCount: 0,
      totalMistakesCount: 0,
      totalHintsUsedCount: 0,
      hintBreakdown: {},
    } as const;
    const v: SudokuStatsV3 = {
      schemaVersion: 3,
      kind: 'sudoku_stats',
      updatedAtMs: 123,
      updatedByDeviceId: 'dev1',
      devices: {
        dev1: {
          updatedAtMs: 123,
          buckets: {
            k: { startedCount: 0, completedCount: 0, abandonedCount: 0, completed: { ...emptyRun }, abandoned: { ...emptyRun } },
          },
          daily: { rankedCount: 0, replayCount: 0 },
        },
      },
    };
    expect(isSudokuStatsV3(v)).toBe(true);
  });

  test('mergeStatsV3 preserves both devices and picks newest per device', () => {
    const bucket = {
      startedCount: 1,
      completedCount: 0,
      abandonedCount: 0,
      completed: {
        totalTimeMs: 0,
        totalSetCount: 0,
        totalClearCount: 0,
        totalNoteAddCount: 0,
        totalNoteRemoveCount: 0,
        totalMistakesCount: 0,
        totalHintsUsedCount: 0,
        hintBreakdown: {},
      },
      abandoned: {
        totalTimeMs: 0,
        totalSetCount: 0,
        totalClearCount: 0,
        totalNoteAddCount: 0,
        totalNoteRemoveCount: 0,
        totalMistakesCount: 0,
        totalHintsUsedCount: 0,
        hintBreakdown: {},
      },
    } as const;

    const a: SudokuStatsV3 = {
      schemaVersion: 3,
      kind: 'sudoku_stats',
      updatedAtMs: 1000,
      updatedByDeviceId: 'dev1',
      devices: {
        dev1: { updatedAtMs: 1000, buckets: { a: { ...bucket, startedCount: 1 } }, daily: { rankedCount: 0, replayCount: 0 } },
      },
    };

    const b: SudokuStatsV3 = {
      schemaVersion: 3,
      kind: 'sudoku_stats',
      updatedAtMs: 2000,
      updatedByDeviceId: 'dev2',
      devices: {
        dev2: { updatedAtMs: 2000, buckets: { a: { ...bucket, startedCount: 9 } }, daily: { rankedCount: 0, replayCount: 0 } },
      },
    };

    const merged = mergeStatsV3(a, b);
    expect(Object.keys(merged.devices).sort()).toEqual(['dev1', 'dev2']);
    expect(merged.devices.dev1!.updatedAtMs).toBe(1000);
    expect(merged.devices.dev2!.updatedAtMs).toBe(2000);
  });
});


