import React from 'react';
import { View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { useMakeTheme } from './MakeThemeProvider';

export function MakeCard({ style, children, ...rest }: ViewProps) {
  const { theme, resolvedThemeType } = useMakeTheme();
  const tint = resolvedThemeType === 'light' ? 'light' : 'dark';
  return (
    <View
      {...rest}
      testID="make-card"
      style={[
        {
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: theme.card.background,
          borderWidth: 1,
          borderColor: theme.card.border,
        },
        style,
      ]}
    >
      {/* Blur overlay for glass effect; backgroundColor above ensures web has an rgba() background. */}
      <BlurView intensity={18} tint={tint} style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />
      {children}
    </View>
  );
}


