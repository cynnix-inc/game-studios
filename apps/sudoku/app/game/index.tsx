import React, { useEffect, useMemo, useState } from 'react';
import { AppState, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';
import { getRunTimerElapsedMs } from '@cynnix-studios/sudoku-core';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { loadLocalSave, writeLocalSave } from '../../src/services/saves';
import { pullAndMergeCurrentPuzzle, pushCurrentPuzzle } from '../../src/services/sync';
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
  const puzzle = usePlayerStore((s) => s.puzzle);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);
  const runTimer = usePlayerStore((s) => s.runTimer);
  const runStatus = usePlayerStore((s) => s.runStatus);

  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const pauseRun = usePlayerStore((s) => s.pauseRun);
  const resumeRun = usePlayerStore((s) => s.resumeRun);

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

  const elapsedMs = getRunTimerElapsedMs(runTimer, Date.now());

  return (
    <Screen scroll>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Sudoku
      </AppText>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <AppCard style={{ flex: 1 }}>
          <AppText tone="muted">Time: {Math.round(elapsedMs / 1000)}s</AppText>
          <AppText tone="muted">Mistakes: {mistakes}</AppText>
        </AppCard>
        <View style={{ justifyContent: 'center' }}>
          {runStatus === 'paused' ? (
            <AppButton
              title="Resume"
              onPress={() => {
                resumeRun();
              }}
            />
          ) : (
            <AppButton
              title="Pause"
              variant="secondary"
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
          <View style={{ marginBottom: theme.spacing.lg }}>
            <SudokuGrid
              puzzle={puzzle}
              givensMask={givensMask}
              selectedIndex={selectedIndex}
              onSelectCell={selectCell}
              onDigit={inputDigit}
              onClear={clearCell}
            />
          </View>

          <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />
        </>
      )}

      <View style={{ height: theme.spacing.md }} />
      <AppButton title="New Puzzle" onPress={() => newPuzzle()} />

      <View style={{ height: theme.spacing.lg }} />
    </Screen>
  );
}


