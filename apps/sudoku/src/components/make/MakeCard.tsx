import React from 'react';
import { View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { makeThemeCurrent } from '../../theme/makeTheme';

export function MakeCard({ style, children, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      testID="make-card"
      style={[
        {
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: makeThemeCurrent.card.background,
          borderWidth: 1,
          borderColor: makeThemeCurrent.card.border,
        },
        style,
      ]}
    >
      {/* Blur overlay for glass effect; backgroundColor above ensures web has an rgba() background. */}
      <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
      <View style={{ padding: 18 }}>{children}</View>
    </View>
  );
}


