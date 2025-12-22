import React, { useEffect, useMemo, useState } from 'react';
import { AppState, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';
import { getRunTimerElapsedMs } from '@cynnix-studios/sudoku-core';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { loadLocalSave, writeLocalSave } from '../../src/services/saves';
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

  useEffect(() => {
    void (async () => {
      await loadLocalSave();
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    debouncedSave();
  }, [puzzle, mistakes, runTimer, hydrated, debouncedSave]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        resumeRun();
        return;
      }
      pauseRun();
      void writeLocalSave();
    });
    return () => sub.remove();
  }, [pauseRun, resumeRun]);

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
          <AppButton title="New Puzzle" onPress={() => newPuzzle()} />
        </View>
      </View>

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

      <View style={{ height: theme.spacing.lg }} />
    </Screen>
  );
}


