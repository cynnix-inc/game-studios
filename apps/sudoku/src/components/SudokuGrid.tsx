import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText, theme } from '@cynnix-studios/ui';
import type { Grid } from '@cynnix-studios/sudoku-core';

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
      <AppText weight={given ? 'bold' : 'regular'}>{value === 0 ? '' : String(value)}</AppText>
    </Pressable>
  );
}

export function SudokuGrid({
  puzzle,
  givensMask,
  selectedIndex,
  onSelectCell,
}: {
  puzzle: Grid;
  givensMask: boolean[];
  selectedIndex: number | null;
  onSelectCell: (i: number) => void;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 9 * 36, flexDirection: 'row', flexWrap: 'wrap' }}>
        {puzzle.map((v, i) => (
          <Cell
            key={i}
            i={i}
            value={v}
            selected={selectedIndex === i}
            given={!!givensMask[i]}
            onPress={() => onSelectCell(i)}
          />
        ))}
      </View>
    </View>
  );
}



