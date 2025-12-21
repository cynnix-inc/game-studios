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
  notesMask,
  onPress,
}: {
  i: number;
  value: number;
  selected: boolean;
  given: boolean;
  notesMask: number;
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
      accessibilityRole="button"
      accessibilityLabel={`Cell row ${r + 1} column ${c + 1}${given ? ', given' : ''}`}
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
      {value !== 0 ? (
        <AppText weight={given ? 'bold' : 'regular'}>{String(value)}</AppText>
      ) : notesMask ? (
        <View style={{ width: 34, height: 34, flexDirection: 'row', flexWrap: 'wrap' }}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((d) => {
            const on = (notesMask & (1 << (d - 1))) !== 0;
            return (
              <View
                key={d}
                style={{ width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' }}
              >
                <AppText tone="muted" style={{ fontSize: 9, lineHeight: 10 }}>
                  {on ? String(d) : ''}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}
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
  const difficulty = usePlayerStore((s) => s.difficulty);
  const notes = usePlayerStore((s) => s.notes);
  const notesMode = usePlayerStore((s) => s.notesMode);
  const canUndo = usePlayerStore((s) => s.undoStack.length > 0);
  const canRedo = usePlayerStore((s) => s.redoStack.length > 0);

  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const toggleNotesMode = usePlayerStore((s) => s.toggleNotesMode);
  const undo = usePlayerStore((s) => s.undo);
  const redo = usePlayerStore((s) => s.redo);

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
  }, [puzzle, notes, notesMode, mistakes, startedAtMs, difficulty, canUndo, canRedo, hydrated, debouncedSave]);

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
          <AppText tone="muted">Difficulty: {difficulty}</AppText>
        </AppCard>
        <View style={{ justifyContent: 'center' }}>
          <AppButton title="New Puzzle" onPress={() => newPuzzle()} />
        </View>
      </View>

      <AppCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText weight="semibold">Free Play</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {(['easy', 'medium', 'hard', 'expert', 'extreme'] as const).map((d) => {
            const active = d === difficulty;
            return (
              <Pressable
                key={d}
                onPress={() => newPuzzle(d)}
                accessibilityRole="button"
                accessibilityLabel={`Start ${d} puzzle`}
                style={{
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.accent : theme.colors.surface2,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <AppText weight="semibold" tone={active ? 'default' : 'muted'}>
                  {d}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <View style={{ width: 9 * 36, flexDirection: 'row', flexWrap: 'wrap' }}>
          {puzzle.map((v, i) => (
            <Cell
              key={i}
              i={i}
              value={v}
              selected={selectedIndex === i}
              given={!!givensMask[i]}
              notesMask={notes[i] ?? 0}
              onPress={() => selectCell(i)}
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <AppButton
          title={notesMode ? 'Notes: ON' : 'Notes'}
          onPress={toggleNotesMode}
          variant={notesMode ? 'primary' : 'secondary'}
          accessibilityLabel={notesMode ? 'Notes mode on' : 'Notes mode off'}
        />
        <AppButton title="Undo" onPress={undo} variant="secondary" disabled={!canUndo} accessibilityLabel="Undo last action" />
        <AppButton title="Redo" onPress={redo} variant="secondary" disabled={!canRedo} accessibilityLabel="Redo last undone action" />
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


