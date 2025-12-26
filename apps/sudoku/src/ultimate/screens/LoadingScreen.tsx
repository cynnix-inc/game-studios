import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Grid3X3 } from 'lucide-react-native';

import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';

export function UltimateLoadingScreen({
  message = 'Loading…',
  progress01,
}: {
  message?: string;
  /**
   * Optional progress in the range [0..1].
   * Intended hook point for pack downloads / updates.
   */
  progress01?: number | null;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const pct = progress01 == null ? null : Math.max(0, Math.min(1, progress01));

  return (
    <MakeScreen scroll={false} style={{ padding: 0 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: makeTheme.card.border,
              backgroundColor: makeTheme.card.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Grid3X3 width={40} height={40} color={makeTheme.accent} />
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <MakeText weight="bold" style={{ fontSize: 24 }}>
              Ultimate Sudoku
            </MakeText>
            <MakeText tone="muted" style={{ textAlign: 'center' }}>
              {message}
              {pct != null ? ` (${Math.round(pct * 100)}%)` : ''}
            </MakeText>
          </View>

          <ActivityIndicator size="large" color={makeTheme.accent} />
        </View>
      </View>
    </MakeScreen>
  );
}


