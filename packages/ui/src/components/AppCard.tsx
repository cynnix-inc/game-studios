import React from 'react';
import { View, type ViewProps } from 'react-native';

import { theme } from '../theme';

export function AppCard({ style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    />
  );
}


