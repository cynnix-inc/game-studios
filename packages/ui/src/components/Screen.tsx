import React from 'react';
import { SafeAreaView, ScrollView, type ViewProps } from 'react-native';

import { theme } from '../tokens';

export type ScreenProps = ViewProps & {
  scroll?: boolean;
};

export function Screen({ scroll = true, style, children, ...rest }: ScreenProps) {
  const content = (
    <SafeAreaView
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.bg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );

  if (!scroll) return content;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentInsetAdjustmentBehavior="automatic">
      {content}
    </ScrollView>
  );
}



