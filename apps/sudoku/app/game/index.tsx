import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';
import { getRunTimerElapsedMs } from '@cynnix-studios/sudoku-core';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { loadLocalSave, writeLocalSave } from '../../src/services/saves';
import { pullAndMergeCurrentPuzzle, pushCurrentPuzzle } from '../../src/services/sync';
import { createClientSubmissionId } from '../../src/services/leaderboard';
import { recordFreePlayCompleted } from '../../src/services/stats';
import { trackEvent } from '../../src/services/telemetry';
import { IconButton } from '../../src/components/IconButton';
import { NumberPad } from '../../src/components/NumberPad';
import { SudokuGrid } from '../../src/components/SudokuGrid';

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function GameScreen() {
  const difficulty = usePlayerStore((s) => s.difficulty);
  const puzzle = usePlayerStore((s) => s.puzzle);
  const solution = usePlayerStore((s) => s.solution);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const notes = usePlayerStore((s) => s.notes);
  const notesMode = usePlayerStore((s) => s.notesMode);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);
  const runTimer = usePlayerStore((s) => s.runTimer);
  const runStatus = usePlayerStore((s) => s.runStatus);
  const movesLen = usePlayerStore((s) => s.moves.length);
  const undoStackLen = usePlayerStore((s) => s.undoStack.length);
  const redoStackLen = usePlayerStore((s) => s.redoStack.length);

  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const toggleNotesMode = usePlayerStore((s) => s.toggleNotesMode);
  const undo = usePlayerStore((s) => s.undo);
  const redo = usePlayerStore((s) => s.redo);
  const pauseRun = usePlayerStore((s) => s.pauseRun);
  const resumeRun = usePlayerStore((s) => s.resumeRun);
  const markCompleted = usePlayerStore((s) => s.markCompleted);

  const [hydrated, setHydrated] = useState(false);

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        void writeLocalSave();
      }, 600),
    [],
  );

  const debouncedPush = useMemo(
    () =>
      debounce(() => {
        void pushCurrentPuzzle();
      }, 1500),
    [],
  );

  useEffect(() => {
    void (async () => {
      await loadLocalSave();
      void pullAndMergeCurrentPuzzle();
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (runStatus === 'completed') return;

    // Solve check: every cell must match the solution and be non-zero.
    for (let i = 0; i < 81; i++) {
      const pv = puzzle[i];
      const sv = solution[i];
      if (pv == null || sv == null) return;
      if (pv === 0) return;
      if (pv !== sv) return;
    }

    const clientSubmissionId = createClientSubmissionId();
    markCompleted({ clientSubmissionId });
    void recordFreePlayCompleted();
  }, [hydrated, markCompleted, puzzle, runStatus, solution]);

  useEffect(() => {
    if (!hydrated) return;
    debouncedSave();
    debouncedPush();
  }, [puzzle, mistakes, runTimer, hydrated, debouncedSave, debouncedPush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        pauseRun();
        void writeLocalSave();
        void pushCurrentPuzzle();
        return;
      }
      void pullAndMergeCurrentPuzzle();
    });
    return () => sub.remove();
  }, [pauseRun]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (typeof window === 'undefined') return;

    const onHidden = () => {
      pauseRun();
      void writeLocalSave();
      void pushCurrentPuzzle();
    };
    const onVisible = () => {
      void pullAndMergeCurrentPuzzle();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onHidden();
      else onVisible();
    };

    window.addEventListener('pagehide', onHidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', onHidden);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pauseRun]);

  const elapsedMs = getRunTimerElapsedMs(runTimer, Date.now());

  return (
    <Screen scroll>
      <View style={{ height: theme.spacing.md }} />

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <AppCard style={{ flex: 1 }}>
          <AppText tone="muted">Time: {Math.round(elapsedMs / 1000)}s</AppText>
          <AppText tone="muted">Mistakes: {mistakes}</AppText>
          <AppText tone="muted">Difficulty: {difficulty}</AppText>
          <AppText tone="muted">Mode: {notesMode ? 'Notes' : 'Value'}</AppText>
        </AppCard>
        <View style={{ justifyContent: 'center' }}>
          {runStatus === 'paused' ? (
            <IconButton icon="▶" label="Resume" onPress={() => resumeRun()} />
          ) : (
            <IconButton
              icon="⏸"
              label="Pause"
              onPress={() => {
                pauseRun();
                void writeLocalSave();
              }}
            />
          )}
        </View>
      </View>

      {runStatus === 'paused' ? (
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
            Paused
          </AppText>
          <AppText tone="muted">Your timer is stopped. Tap Resume to continue.</AppText>
        </AppCard>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <IconButton icon="✎" label="Notes (N)" active={notesMode} onPress={toggleNotesMode} />
            <IconButton icon="↶" label="Undo (U)" disabled={undoStackLen === 0} onPress={undo} />
            <IconButton icon="↷" label="Redo (R)" disabled={redoStackLen === 0} onPress={redo} />
          </View>

          <View style={{ marginBottom: theme.spacing.lg }}>
            <SudokuGrid
              puzzle={puzzle}
              givensMask={givensMask}
              notes={notes}
              notesMode={notesMode}
              selectedIndex={selectedIndex}
              onSelectCell={selectCell}
              onDigit={inputDigit}
              onClear={clearCell}
              onToggleNotesMode={toggleNotesMode}
              onUndo={undo}
              onRedo={redo}
            />
          </View>

          <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />
        </>
      )}

      <View style={{ height: theme.spacing.md }} />
      <AppCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText weight="semibold">New Puzzle</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {(['easy', 'medium', 'hard', 'expert', 'extreme'] as const).map((d) => (
            <AppButton
              key={d}
              title={d}
              variant={d === difficulty ? undefined : 'secondary'}
              onPress={() => {
                if (hydrated && runStatus !== 'completed' && movesLen > 0) {
                  void trackEvent({ name: 'abandon_puzzle', props: { mode: 'free', reason: 'new_puzzle' } });
                }
                newPuzzle(d);
                void trackEvent({ name: 'start_freeplay', props: { difficulty: d } });
              }}
            />
          ))}
        </View>
      </AppCard>

      <View style={{ height: theme.spacing.lg }} />
    </Screen>
  );
}


