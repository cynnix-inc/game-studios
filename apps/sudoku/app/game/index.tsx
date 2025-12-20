import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { loadLocalSave, writeLocalSave } from '../../src/services/saves';
import { submitScore } from '../../src/services/leaderboard';

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function Cell({
  i,
  value,
  selected,
  given,
  onPress,
}: {
  i: number;
  value: number;
  selected: boolean;
  given: boolean;
  onPress: () => void;
}) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const thickL = c % 3 === 0;
  const thickT = r % 3 === 0;
  const thickR = c === 8;
  const thickB = r === 8;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.surface2 : theme.colors.surface,
        borderColor: theme.colors.border,
        borderLeftWidth: thickL ? 2 : 1,
        borderTopWidth: thickT ? 2 : 1,
        borderRightWidth: thickR ? 2 : 1,
        borderBottomWidth: thickB ? 2 : 1,
      }}
    >
      <AppText weight={given ? 'bold' : 'regular'}>{value === 0 ? '' : String(value)}</AppText>
    </Pressable>
  );
}

function NumberPad({
  onDigit,
  onClear,
}: {
  onDigit: (d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
  onClear: () => void;
}) {
  const digits = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9] as const, []);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {digits.map((d) => (
          <Pressable
            key={d}
            onPress={() => onDigit(d)}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface2,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText weight="semibold">{d}</AppText>
          </Pressable>
        ))}
      </View>
      <AppButton title="Clear" variant="secondary" onPress={onClear} />
    </View>
  );
}

export default function GameScreen() {
  const puzzle = usePlayerStore((s) => s.puzzle);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);
  const startedAtMs = usePlayerStore((s) => s.startedAtMs);

  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);

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
  }, [puzzle, mistakes, startedAtMs, hydrated, debouncedSave]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void writeLocalSave();
    });
    return () => sub.remove();
  }, []);

  const elapsedMs = Math.max(0, Date.now() - startedAtMs);

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

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <View style={{ width: 9 * 36, flexDirection: 'row', flexWrap: 'wrap' }}>
          {puzzle.map((v, i) => (
            <Cell
              key={i}
              i={i}
              value={v}
              selected={selectedIndex === i}
              given={!!givensMask[i]}
              onPress={() => selectCell(i)}
            />
          ))}
        </View>
      </View>

      <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />

      <View style={{ height: theme.spacing.lg }} />

      <AppButton
        title="Submit Score (placeholder)"
        variant="secondary"
        onPress={async () => {
          await submitScore({ mode: 'mistakes', value: mistakes });
        }}
      />
    </Screen>
  );
}


