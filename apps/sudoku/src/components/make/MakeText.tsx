import React from 'react';
import { Text, type TextProps } from 'react-native';

import { useMakeTheme } from './MakeThemeProvider';

export type MakeTextTone = 'primary' | 'secondary' | 'muted';
export type MakeTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export function MakeText({
  tone = 'primary',
  weight = 'regular',
  style,
  ...rest
}: TextProps & { tone?: MakeTextTone; weight?: MakeTextWeight }) {
  const { theme } = useMakeTheme();
  const color =
    tone === 'primary' ? theme.text.primary : tone === 'secondary' ? theme.text.secondary : theme.text.muted;

  const fontWeight =
    weight === 'regular' ? '400' : weight === 'medium' ? '500' : weight === 'semibold' ? '600' : '700';

  return <Text {...rest} style={[{ color, fontWeight }, style]} />;
}


