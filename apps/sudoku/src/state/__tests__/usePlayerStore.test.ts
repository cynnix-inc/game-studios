import { usePlayerStore } from '../usePlayerStore';

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


