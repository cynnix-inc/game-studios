import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeText } from './MakeText';
import { useMakeTheme } from './MakeThemeProvider';

export type MakeButtonVariant = 'primary' | 'secondary';

export type MakeButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: MakeButtonVariant;
  leftIcon?: React.ReactNode;
  contentStyle?: { [key: string]: unknown };
};

export function MakeButton({ title, variant = 'primary', disabled, leftIcon, contentStyle, style, ...rest }: MakeButtonProps) {
  const { theme } = useMakeTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={(state) => {
        const extra = typeof style === 'function' ? style(state) : style;
        return [
          {
            borderRadius: 16,
            overflow: 'hidden',
            opacity: disabled ? 0.6 : state.pressed ? 0.92 : 1,
          },
          extra,
        ];
      }}
    >
      {variant === 'primary' ? (
        <LinearGradient
          testID="make-button-primary-bg"
          colors={theme.button.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
            ...(contentStyle ?? {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {leftIcon}
            {title ? <MakeText weight="semibold">{title}</MakeText> : null}
          </View>
        </LinearGradient>
      ) : (
        <View
          testID="make-button-secondary-bg"
          style={{
            backgroundColor: theme.button.secondaryBackground,
            borderWidth: 1,
            borderColor: theme.button.border,
            paddingVertical: 14,
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
            ...(contentStyle ?? {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {leftIcon}
            {title ? <MakeText weight="semibold">{title}</MakeText> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}


