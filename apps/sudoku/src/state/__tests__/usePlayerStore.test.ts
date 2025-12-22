jest.mock('../../services/telemetry', () => ({
  trackEvent: jest.fn(async () => {}),
}));

import { usePlayerStore } from '../usePlayerStore';
import { trackEvent } from '../../services/telemetry';

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


