import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AppText, theme } from '@cynnix-studios/ui';
import type { Grid } from '@cynnix-studios/sudoku-core';

type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function digitFromKey(key: string): Digit | null {
  switch (key) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    case '5':
      return 5;
    case '6':
      return 6;
    case '7':
      return 7;
    case '8':
      return 8;
    case '9':
      return 9;
    default:
      return null;
  }
}

function Cell({
  i,
  value,
  notes,
  selected,
  given,
  onPress,
}: {
  i: number;
  value: number;
  notes?: ReadonlySet<number>;
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
  const selectedBoost = selected ? 1 : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Cell row ${r + 1} column ${c + 1}${given ? ', given' : ''}${selected ? ', selected' : ''}`}
      style={{
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.surface2 : theme.colors.surface,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderLeftWidth: (thickL ? 2 : 1) + selectedBoost,
        borderTopWidth: (thickT ? 2 : 1) + selectedBoost,
        borderRightWidth: (thickR ? 2 : 1) + selectedBoost,
        borderBottomWidth: (thickB ? 2 : 1) + selectedBoost,
      }}
    >
      {value === 0 ? (
        notes && notes.size > 0 ? (
          <AppText
            tone="muted"
            style={{
              fontSize: 10,
              lineHeight: 12,
              textAlign: 'center',
              paddingHorizontal: 2,
            }}
          >
            {[...notes].sort((a, b) => a - b).join('')}
          </AppText>
        ) : (
          <AppText>{''}</AppText>
        )
      ) : (
        <AppText weight={given ? 'bold' : 'regular'}>{String(value)}</AppText>
      )}
    </Pressable>
  );
}

export function SudokuGrid({
  puzzle,
  givensMask,
  notes,
  notesMode,
  selectedIndex,
  onSelectCell,
  onDigit,
  onClear,
  onToggleNotesMode,
  onUndo,
  onRedo,
  onEscape,
}: {
  puzzle: Grid;
  givensMask: boolean[];
  notes?: Array<Set<number>>;
  notesMode?: boolean;
  selectedIndex: number | null;
  onSelectCell: (i: number) => void;
  onDigit?: (d: Digit) => void;
  onClear?: () => void;
  onToggleNotesMode?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
}) {
  const [focused, setFocused] = useState(false);

  const handleKey = useCallback(
    (key: string, preventDefault?: () => void) => {
      const lower = key.toLowerCase();

      // Esc: close-only (modal/overlay) per PRD 7.2. If nothing is open, this is a no-op.
      if (key === 'Escape') {
        preventDefault?.();
        onEscape?.();
        return;
      }

      if (lower === 'n') {
        preventDefault?.();
        onToggleNotesMode?.();
        return;
      }
      if (lower === 'u') {
        preventDefault?.();
        onUndo?.();
        return;
      }
      if (lower === 'r') {
        preventDefault?.();
        onRedo?.();
        return;
      }

      // Digits
      const digit = digitFromKey(key);
      if (digit) {
        preventDefault?.();
        onDigit?.(digit);
        return;
      }

      // Clear
      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        preventDefault?.();
        onClear?.();
        return;
      }

      // Navigation
      const startIndex = selectedIndex ?? 0;
      let next = startIndex;
      if (key === 'ArrowUp') next = Math.max(0, startIndex - 9);
      if (key === 'ArrowDown') next = Math.min(80, startIndex + 9);
      if (key === 'ArrowLeft') next = startIndex % 9 === 0 ? startIndex : startIndex - 1;
      if (key === 'ArrowRight') next = startIndex % 9 === 8 ? startIndex : startIndex + 1;

      if (next !== startIndex || selectedIndex == null) {
        if (key.startsWith('Arrow') || selectedIndex == null) {
          preventDefault?.();
          onSelectCell(next);
        }
      }
    },
    [onClear, onDigit, onEscape, onRedo, onSelectCell, onToggleNotesMode, onUndo, selectedIndex],
  );

  useEffect(() => {
    if (!focused) return;
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    function onKeyDown(e: KeyboardEvent) {
      // NOTE: keeping this local allows keyboard support without relying on react-native-web specific props.
      handleKey(e.key, () => e.preventDefault());
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused, handleKey]);

  return (
    <Pressable
      focusable
      accessibilityLabel="Sudoku grid"
      accessibilityHint={`Use arrow keys to move between cells. Use number keys 1 through 9 to enter. Use Backspace or Delete to clear. Notes mode is ${notesMode ? 'on' : 'off'}.`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      // On web, clicking a cell should enable keyboard immediately (not only when the wrapper receives DOM focus).
      onPress={() => setFocused(true)}
      style={() => ({
        alignItems: 'center',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        borderWidth: 2,
        borderColor: focused ? theme.colors.accent : theme.colors.border,
      })}
    >
      <View style={{ width: 9 * 36, flexDirection: 'row', flexWrap: 'wrap' }}>
        {puzzle.map((v, i) => (
          <Cell
            key={i}
            i={i}
            value={v}
            notes={notes?.[i]}
            selected={selectedIndex === i}
            given={!!givensMask[i]}
            onPress={() => {
              setFocused(true);
              onSelectCell(i);
            }}
          />
        ))}
      </View>
    </Pressable>
  );
}



