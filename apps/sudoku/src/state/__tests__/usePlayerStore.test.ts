jest.mock('../../services/telemetry', () => ({
  trackEvent: jest.fn(async () => {}),
}));

jest.mock('../../services/stats', () => ({
  recordRunStarted: jest.fn(async () => {}),
  recordRunCompleted: jest.fn(async () => {}),
  recordRunAbandoned: jest.fn(async () => {}),
  recordDailySubmissionResult: jest.fn(async () => {}),
  syncStatsOnce: jest.fn(async () => {}),
  loadLocalStats: jest.fn(async () => ({})),
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
    difficulty: 'skilled',
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

  it('advances backward when enabled and autoAdvanceDirection is backward (Shift parity)', () => {
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

    // Mark cell 1 as given, so from cell 2 the previous empty editable should be cell 0.
    usePlayerStore.setState({ givensMask: [false, true, false, ...Array.from({ length: 78 }, () => false)] } as never);

    const s = usePlayerStore.getState();
    s.selectCell(2);
    s.inputDigit(5, { autoAdvanceDirection: 'backward' });

    expect(usePlayerStore.getState().selectedIndex).toBe(0);
  });
});

describe('usePlayerStore: hint types (Make)', () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  function makeSingleCandidatePuzzle(): number[] {
    // Row 0 has digits 1..8 filled at cols 1..8. Cell (0,0) must be 9.
    const g = makeGrid(0);
    g[1] = 1;
    g[2] = 2;
    g[3] = 3;
    g[4] = 4;
    g[5] = 5;
    g[6] = 6;
    g[7] = 7;
    g[8] = 8;
    return g;
  }

  it('show_candidates records a hint and returns candidates without mutating the puzzle', () => {
    usePlayerStore.setState({
      puzzle: makeSingleCandidatePuzzle() as unknown as never,
      selectedIndex: 0,
      givensMask: Array.from({ length: 81 }, () => false),
    } as never);

    const before = usePlayerStore.getState().puzzle.slice();
    const candidates = usePlayerStore.getState().hintShowCandidates();

    expect(candidates).not.toBeNull();
    expect(candidates && candidates.has(9)).toBe(true);
    expect(usePlayerStore.getState().puzzle).toEqual(before);
    expect(usePlayerStore.getState().hintsUsedCount).toBe(1);
    expect(usePlayerStore.getState().hintBreakdown.show_candidates).toBe(1);
  });

  it('explain_technique records a hint and selects a suggested cell', () => {
    usePlayerStore.setState({
      puzzle: makeSingleCandidatePuzzle() as unknown as never,
      selectedIndex: 0,
      givensMask: Array.from({ length: 81 }, () => false),
    } as never);

    const res = usePlayerStore.getState().hintExplainTechnique();

    expect(res).not.toBeNull();
    expect(res?.cell).toBe(0);
    expect(res?.candidates.has(9)).toBe(true);
    expect(usePlayerStore.getState().selectedIndex).toBe(0);
    expect(usePlayerStore.getState().hintsUsedCount).toBe(1);
    expect(usePlayerStore.getState().hintBreakdown.explain_technique).toBe(1);
  });
});

describe('usePlayerStore: Zen mode', () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  it('does not increment mistakes or log mistake moves when zenMode is enabled', () => {
    useSettingsStore.setState({
      settings: {
        schemaVersion: 1,
        kind: 'sudoku_settings',
        updatedAtMs: 0,
        updatedByDeviceId: 'device_test',
        toggles: { zenMode: true },
        extra: {},
      },
    } as never);

    const s = usePlayerStore.getState();
    s.selectCell(0);
    // resetStoreForTest sets solution to all 1s, so 2 is wrong.
    s.inputDigit(2);

    const after = usePlayerStore.getState();
    expect(after.mistakes).toBe(0);
    expect(after.moves.some((m) => m.kind === 'mistake')).toBe(false);
    // Only the set move should be recorded (deviceId present).
    expect(after.revision).toBe(1);
  });
});

describe('usePlayerStore: lives limit (loss)', () => {
  beforeEach(() => {
    resetStoreForTest();
  });

  it('sets runStatus=failed and pauses timer when a wrong entry hits the lives limit', () => {
    useSettingsStore.setState({
      settings: {
        schemaVersion: 1,
        kind: 'sudoku_settings',
        updatedAtMs: 0,
        updatedByDeviceId: 'device_test',
        extra: { gameplay: { livesLimit: 1 } },
      },
    } as never);

    const s = usePlayerStore.getState();
    s.selectCell(0);
    // resetStoreForTest sets solution to all 1s, so 2 is wrong.
    s.inputDigit(2);

    const after = usePlayerStore.getState();
    expect(after.runStatus).toBe('failed');
    expect(after.runTimer.pausedAtMs).not.toBeNull();
  });
});

describe('usePlayerStore Epic 10: telemetry completion', () => {
  beforeEach(() => {
    resetStoreForTest();
    jest.clearAllMocks();
  });

  it('emits complete_puzzle with ranked=false for free play', () => {
    usePlayerStore.setState({ mode: 'free', difficulty: 'advanced' } as never);
    usePlayerStore.getState().markCompleted({ clientSubmissionId: 'cid_free', completedAtMs: 1000, nowMs: 1000 });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'complete_puzzle',
        props: expect.objectContaining({
          mode: 'free',
          difficulty: 'advanced',
          ranked: false,
          correlation_id: 'cid_free',
        }),
      }),
    );
  });

  it('emits complete_puzzle with ranked=null for daily', () => {
    usePlayerStore.setState({ mode: 'daily', dailyDateKey: '2025-12-22', difficulty: 'novice' } as never);
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


