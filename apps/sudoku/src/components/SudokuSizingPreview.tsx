import React, { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, theme } from '@cynnix-studios/ui';

type PreviewCell = { value: string; bold?: boolean; notes?: string };

export function SudokuSizingPreview({
  gridSizePct,
  digitSizePct,
  noteSizePct,
}: {
  gridSizePct: number;
  digitSizePct: number;
  noteSizePct: number;
}) {
  // Mirror Make preview intent (not pixel-perfect yet):
  // - gridSizePct scales the overall cell box
  // - digitSizePct scales main digit font
  // - noteSizePct scales note font (mapped so 200 => ~1.0 baseline)
  const baseCell = 40;
  const cell = useMemo(() => Math.max(24, Math.min(64, Math.round((baseCell * gridSizePct) / 100))), [gridSizePct]);
  const digitScale = useMemo(() => digitSizePct / 100, [digitSizePct]);
  const noteScale = useMemo(() => noteSizePct / 200, [noteSizePct]);
  const numberFontSize = useMemo(() => Math.max(12, Math.round(cell * 0.55 * digitScale)), [cell, digitScale]);
  const noteFontSize = useMemo(() => Math.max(8, Math.round(cell * 0.22 * noteScale)), [cell, noteScale]);

  // Simple 3×3 snapshot with a mix of values + notes.
  const sample = useMemo<PreviewCell[]>(
    () => [
      { value: '5', bold: true },
      { value: '', notes: '29' },
      { value: '7' },
      { value: '', notes: '134' },
      { value: '1' },
      { value: '' },
      { value: '9' },
      { value: '', notes: '68' },
      { value: '3' },
    ],
    [],
  );

  return (
    <View
      accessibilityLabel="Sizing preview"
      style={{
        alignSelf: 'flex-start',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ width: cell * 3, flexDirection: 'row', flexWrap: 'wrap' }}>
        {sample.map((s, i) => (
          <View
            key={i}
            style={{
              width: cell,
              height: cell,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface2,
            }}
          >
            {s.value ? (
              <AppText
                weight={s.bold ? 'bold' : 'regular'}
                style={{
                  fontSize: numberFontSize,
                  lineHeight: Math.round(numberFontSize * 1.1),
                }}
              >
                {s.value}
              </AppText>
            ) : s.notes ? (
              <AppText
                tone="muted"
                style={{
                  fontSize: noteFontSize,
                  lineHeight: Math.round(noteFontSize * 1.15),
                  textAlign: 'center',
                  paddingHorizontal: 2,
                }}
              >
                {s.notes}
              </AppText>
            ) : (
              <AppText>{''}</AppText>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}


