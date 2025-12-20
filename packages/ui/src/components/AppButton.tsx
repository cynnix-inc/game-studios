import React from 'react';
import { Pressable, type PressableProps, Text } from 'react-native';

import { theme } from '../theme';

export type AppButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ title, variant = 'primary', style, ...rest }: AppButtonProps) {
  const bg = variant === 'primary' ? theme.colors.accent : theme.colors.surface2;
  return (
    <Pressable
      {...rest}
      style={(state) => {
        const extra = typeof style === 'function' ? style(state) : style;
        return [
          {
            backgroundColor: bg,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.md,
            opacity: state.pressed ? 0.85 : 1,
            borderWidth: variant === 'secondary' ? 1 : 0,
            borderColor: theme.colors.border,
            alignItems: 'center',
          },
          extra,
        ];
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}


