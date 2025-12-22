import { getRunTimerElapsedMs } from '../src/engine/runTimer';
import { mergeMoveLogs, foldMovesToState, type SudokuMove } from '../src/engine/moveLog';

function m(partial: Omit<SudokuMove, 'schemaVersion'> & Partial<Pick<SudokuMove, 'schemaVersion'>>): SudokuMove {
  return { schemaVersion: 1, ...partial };
}

describe('move log merge + fold (Epic 6)', () => {
  test('mergeMoveLogs unions by (device_id, rev) and sorts deterministically by (ts, device_id, rev)', () => {
    const a: SudokuMove[] = [
      m({ device_id: 'b', rev: 1, ts: 100, kind: 'set', cell: 0, value: 1 }),
      m({ device_id: 'a', rev: 1, ts: 100, kind: 'set', cell: 0, value: 2 }),
    ];
    const b: SudokuMove[] = [
      // duplicate of a[0]
      m({ device_id: 'b', rev: 1, ts: 100, kind: 'set', cell: 0, value: 1 }),
      m({ device_id: 'a', rev: 2, ts: 50, kind: 'set', cell: 1, value: 9 }),
    ];

    const merged = mergeMoveLogs(a, b);
    expect(merged).toHaveLength(3);
    expect(merged.map((x) => `${x.ts}-${x.device_id}-${x.rev}`)).toEqual([
      '50-a-2',
      '100-a-1',
      '100-b-1',
    ]);
  });

  test('foldMovesToState applies last-write-wins for cell values and supports clear', () => {
    const moves: SudokuMove[] = [
      m({ device_id: 'a', rev: 1, ts: 10, kind: 'set', cell: 0, value: 1 }),
      m({ device_id: 'b', rev: 1, ts: 20, kind: 'set', cell: 0, value: 2 }),
      m({ device_id: 'a', rev: 2, ts: 30, kind: 'clear', cell: 0 }),
      m({ device_id: 'b', rev: 2, ts: 40, kind: 'set', cell: 0, value: 9 }),
    ];

    const out = foldMovesToState({ startedAtMs: 0 }, moves);
    expect(out.puzzle[0]).toBe(9);
  });

  test('foldMovesToState merges notes as sets using note_add/note_remove', () => {
    const moves: SudokuMove[] = [
      m({ device_id: 'a', rev: 1, ts: 10, kind: 'note_add', cell: 0, value: 3 }),
      m({ device_id: 'b', rev: 1, ts: 11, kind: 'note_add', cell: 0, value: 4 }),
      m({ device_id: 'a', rev: 2, ts: 12, kind: 'note_remove', cell: 0, value: 3 }),
    ];

    const out = foldMovesToState({ startedAtMs: 0 }, moves);
    expect(Array.from(out.notes[0] ?? []).sort()).toEqual([4]);
  });

  test('foldMovesToState pause/resume produces deterministic RunTimer state', () => {
    const moves: SudokuMove[] = [
      m({ device_id: 'a', rev: 1, ts: 1000, kind: 'pause' }),
      m({ device_id: 'a', rev: 2, ts: 2000, kind: 'resume' }),
    ];

    const out = foldMovesToState({ startedAtMs: 0 }, moves);
    expect(getRunTimerElapsedMs(out.runTimer, 3000)).toBe(2000);
    expect(out.runStatus).toBe('running');
  });

  test('foldMovesToState tracks mistakes + hint breakdown deterministically', () => {
    const moves: SudokuMove[] = [
      m({ device_id: 'a', rev: 1, ts: 10, kind: 'mistake' }),
      m({ device_id: 'b', rev: 1, ts: 11, kind: 'hint', hintType: 'reveal_cell_value' }),
      m({ device_id: 'a', rev: 2, ts: 12, kind: 'hint', hintType: 'reveal_cell_value' }),
    ];

    const out = foldMovesToState({ startedAtMs: 0 }, moves);
    expect(out.mistakesCount).toBe(1);
    expect(out.hintsUsedCount).toBe(2);
    expect(out.hintBreakdown.reveal_cell_value).toBe(2);
  });
});


