jest.mock('../../services/telemetry', () => ({
  trackEvent: jest.fn(async () => {}),
}));

import { usePlayerStore } from '../usePlayerStore';
import { trackEvent } from '../../services/telemetry';
import { useSettingsStore } from '../../state/useSettingsStore';
import { getRunTimerElapsedMs, serializeGrid, type RunTimer, type SudokuMove } from '@cynnix-studios/sudoku-core';

function makeGrid(fill: number): number[] {
  return Array.from({ length: 81 }, () => fill);
}

function resetStoreForTest() {
  // Minimal deterministic state for tests; we avoid generator randomness.
  usePlayerStore.setState({
    profile: null,
    guestEnabled: false,
    deviceId: 'device_test',
    revision: 0,
    moves: [],
    notesMode: false,
    notes: Array.from({ length: 81 }, () => new Set<number>()),
    undoStack: [],
    redoStack: [],
    mode: 'free',
    dailyDateKey: null,
    dailyLoad: { status: 'idle' },
    dailySource: null,
    difficulty: 'easy',
    puzzle: makeGrid(0) as unknown as never,
    solution: makeGrid(1) as unknown as never,
    givensMask: Array.from({ length: 81 }, () => false),
    selectedIndex: null,
    mistakes: 0,
    hintsUsedCount: 0,
    hintBreakdown: {},
    runTimer: { startedAtMs: 0, totalPausedMs: 0, pausedAtMs: null } as unknown as never,
    runStatus: 'running',
    completedAtMs: null,
    completionClientSubmissionId: null,
    // Epic1 additions (notes/undo/redo) will be set by implementation.
  } as never);
  useSettingsStore.setState({ settings: null } as never);
}

describe('usePlayerStore Epic 1: notes + undo/redo', () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  it('toggles notes without changing the cell value', () => {
    const s = usePlayerStore.getState();
    s.selectCell(0);
    s.toggleNotesMode();
    s.inputDigit(3);

    const after = usePlayerStore.getState();
    expect(after.puzzle[0]).toBe(0);
    expect(after.notes[0]?.has(3)).toBe(true);
  });

  it('undo reverts a value change and redo reapplies it', () => {
    const s = usePlayerStore.getState();
    s.selectCell(0);
    s.inputDigit(5);
    expect(usePlayerStore.getState().puzzle[0]).toBe(5);

    s.undo();
    expect(usePlayerStore.getState().puzzle[0]).toBe(0);

    s.redo();
    expect(usePlayerStore.getState().puzzle[0]).toBe(5);
  });
});

describe('usePlayerStore: auto-advance', () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  it('advances to the next empty editable cell after digit entry when enabled', () => {
    // Enable auto-advance
    useSettingsStore.setState({
      settings: {
        schemaVersion: 1,
        kind: 'sudoku_settings',
        updatedAtMs: 0,
        updatedByDeviceId: 'device_test',
        toggles: { autoAdvance: true },
        extra: {},
      },
    } as never);

    // Mark cell 1 as given, so the next empty editable should be cell 2.
    usePlayerStore.setState({ givensMask: [false, true, false, ...Array.from({ length: 78 }, () => false)] } as never);

    const s = usePlayerStore.getState();
    s.selectCell(0);
    s.inputDigit(5);

    expect(usePlayerStore.getState().selectedIndex).toBe(2);
  });
});

describe('usePlayerStore Epic 10: telemetry completion', () => {
  beforeEach(() => {
    resetStoreForTest();
    jest.clearAllMocks();
  });

  it('emits complete_puzzle with ranked=false for free play', () => {
    usePlayerStore.setState({ mode: 'free', difficulty: 'hard' } as never);
    usePlayerStore.getState().markCompleted({ clientSubmissionId: 'cid_free', completedAtMs: 1000, nowMs: 1000 });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'complete_puzzle',
        props: expect.objectContaining({
          mode: 'free',
          difficulty: 'hard',
          ranked: false,
          correlation_id: 'cid_free',
        }),
      }),
    );
  });

  it('emits complete_puzzle with ranked=null for daily', () => {
    usePlayerStore.setState({ mode: 'daily', dailyDateKey: '2025-12-22', difficulty: 'easy' } as never);
    usePlayerStore.getState().markCompleted({ clientSubmissionId: 'cid_daily', completedAtMs: 1000, nowMs: 1000 });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'complete_puzzle',
        props: expect.objectContaining({
          mode: 'daily',
          ranked: null,
          correlation_id: 'cid_daily',
          utc_date: '2025-12-22',
        }),
      }),
    );
  });
});

describe('usePlayerStore: run timer persistence on hydrate/resume', () => {
  beforeEach(() => {
    resetStoreForTest();
    jest.restoreAllMocks();
  });

  it('prefers persisted runTimer on hydrateFromSave even when moves exist (so elapsed time does not reset)', () => {
    // Freeze "now" so hydrateFromSave would previously reset startedAtMs when folding moves.
    jest.spyOn(Date, 'now').mockReturnValue(100_000);

    const puzzle = makeGrid(0);
    const solution = makeGrid(1);
    const serializedPuzzle = serializeGrid(puzzle as never);
    const serializedSolution = serializeGrid(solution as never);

    const persistedTimer: RunTimer = { startedAtMs: 10_000, totalPausedMs: 2_000, pausedAtMs: 99_000 };
    const moves: SudokuMove[] = [
      { schemaVersion: 1, device_id: 'device_test', rev: 1, ts: 20_000, kind: 'set', cell: 0, value: 5 },
    ];

    usePlayerStore.getState().hydrateFromSave(serializedPuzzle, serializedSolution, Array.from({ length: 81 }, () => false), {
      deviceId: 'device_test',
      revision: 1,
      moves,
      runTimer: persistedTimer,
      runStatus: 'paused',
    });

    const after = usePlayerStore.getState();
    expect(after.runTimer).toEqual(persistedTimer);
    expect(after.runStatus).toBe('paused');

    // Sanity: elapsed time should reflect the persisted timer (not be reset to ~0).
    const elapsedMs0 = getRunTimerElapsedMs(after.runTimer, 100_000);
    expect(elapsedMs0).toBeGreaterThan(0);

    // Resume should clear pausedAtMs and elapsed should tick forward.
    usePlayerStore.getState().resumeRun(100_000);
    const resumed = usePlayerStore.getState();
    expect(resumed.runStatus).toBe('running');
    expect(resumed.runTimer.pausedAtMs).toBeNull();

    const elapsedMs1 = getRunTimerElapsedMs(resumed.runTimer, 101_000);
    expect(elapsedMs1).toBeGreaterThan(elapsedMs0);
  });
});


