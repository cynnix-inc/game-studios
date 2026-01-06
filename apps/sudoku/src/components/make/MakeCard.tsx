import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { useMakeTheme } from './MakeThemeProvider';

export function MakeCard({ style, children, ...rest }: ViewProps) {
  const { theme, resolvedThemeType } = useMakeTheme();
  const tint = resolvedThemeType === 'light' ? 'light' : 'dark';
  const webBackdrop =
    Platform.OS === 'web'
      ? ({
          // Make uses `backdrop-blur-xl`. Using CSS backdrop-filter on web avoids the
          // “extra frosted overlay” look that `expo-blur` can introduce in nested translucent areas (like grid gaps).
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        } as unknown as object)
      : null;

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
        webBackdrop,
        style,
      ]}
    >
      {/* Native: blur overlay for glass effect; web uses backdrop-filter on the container for closer Make parity. */}
      {Platform.OS === 'web' ? null : (
        <BlurView intensity={18} tint={tint} style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />
      )}
      {children}
    </View>
  );
}


