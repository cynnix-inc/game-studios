import React from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeText } from './MakeText';
import { useMakeTheme } from './MakeThemeProvider';

export type MakeButtonVariant = 'primary' | 'secondary' | 'ghost';

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
        const hovered = Platform.OS === 'web' ? state.hovered : false;
        const showShadow = variant !== 'ghost';
        return [
          {
            borderRadius: 16,
            overflow: 'hidden',
            opacity: disabled ? 0.6 : state.pressed ? 0.92 : 1,
            ...(variant === 'ghost'
              ? ({
                  backgroundColor: hovered ? theme.card.background : 'transparent',
                } as const)
              : null),
            // Approximate Make: shadow-xl + hover:shadow-2xl + subtle hover scale (web only).
            ...(showShadow
              ? (Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOpacity: hovered ? 0.24 : 0.18,
                    shadowRadius: hovered ? 18 : 14,
                    shadowOffset: { width: 0, height: hovered ? 10 : 8 },
                  },
                  android: { elevation: hovered ? 10 : 8 },
                  web: {
                    boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.25)' : '0 14px 36px rgba(0,0,0,0.20)',
                    transform: hovered ? 'scale(1.01)' : 'scale(1)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 150ms ease',
                  },
                }) as unknown as object)
              : null),
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
        </LinearGradient>
      ) : variant === 'secondary' ? (
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
      ) : (
        <View
          testID="make-button-ghost-bg"
          style={{
            backgroundColor: 'transparent',
            paddingVertical: 10,
            paddingHorizontal: 12,
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


