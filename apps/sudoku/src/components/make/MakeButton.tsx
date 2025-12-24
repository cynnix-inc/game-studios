import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { makeThemeCurrent } from '../../theme/makeTheme';
import { MakeText } from './MakeText';

export type MakeButtonVariant = 'primary' | 'secondary';

export type MakeButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: MakeButtonVariant;
  leftIcon?: React.ReactNode;
  contentStyle?: { [key: string]: unknown };
};

export function MakeButton({ title, variant = 'primary', disabled, leftIcon, contentStyle, style, ...rest }: MakeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => {
        const extra = typeof style === 'function' ? style({ pressed }) : style;
        return [
          {
            borderRadius: 16,
            overflow: 'hidden',
            opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          },
          extra,
        ];
      }}
    >
      {variant === 'primary' ? (
        <LinearGradient
          testID="make-button-primary-bg"
          colors={makeThemeCurrent.button.primaryGradient}
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
            backgroundColor: makeThemeCurrent.button.secondaryBackground,
            borderWidth: 1,
            borderColor: makeThemeCurrent.button.border,
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


