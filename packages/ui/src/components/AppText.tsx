import React from 'react';
import { Text, type TextProps } from 'react-native';

import { theme } from '../tokens';

export type AppTextProps = TextProps & {
  tone?: 'default' | 'muted' | 'danger';
  weight?: 'regular' | 'semibold' | 'bold';
};

export function AppText({ tone = 'default', weight = 'regular', style, ...rest }: AppTextProps) {
  const color =
    tone === 'muted' ? theme.colors.muted : tone === 'danger' ? theme.colors.danger : theme.colors.text;
  const fontWeight = weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '400';
  return <Text {...rest} style={[{ color, fontWeight }, style]} />;
}


