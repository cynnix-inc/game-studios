import React from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeText } from './MakeText';
import { useMakeTheme } from './MakeThemeProvider';

export type MakeButtonVariant = 'primary' | 'secondary' | 'ghost';
export type MakeButtonElevation = 'elevated' | 'flat';

export type MakeButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: MakeButtonVariant;
  leftIcon?: React.ReactNode;
  /**
   * Spacing between leftIcon and title. Make uses a slightly tighter gap for some compact controls.
   */
  contentGap?: number;
  contentStyle?: { [key: string]: unknown };
  titleStyle?: { [key: string]: unknown };
  radius?: number;
  elevation?: MakeButtonElevation;
};

export function MakeButton({
  title,
  variant = 'primary',
  disabled,
  leftIcon,
  contentGap = 10,
  contentStyle,
  titleStyle,
  radius = 16,
  elevation = 'elevated',
  style,
  ...rest
}: MakeButtonProps) {
  const { theme, reducedMotion } = useMakeTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={(state) => {
        const extra = typeof style === 'function' ? style(state) : style;
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        const showHover = Platform.OS === 'web' && hovered && !disabled && !state.pressed;
        const showShadow = variant !== 'ghost' && elevation === 'elevated';
        const webTransition = reducedMotion ? 'none' : 'transform 300ms ease, box-shadow 300ms ease, opacity 150ms ease';
        return [
          {
            borderRadius: radius,
            overflow: 'hidden',
            opacity: disabled ? 0.6 : state.pressed ? 0.92 : 1,
            ...(variant === 'ghost'
              ? ({
                  backgroundColor: showHover ? theme.card.hoverBackground : 'transparent',
                } as const)
              : null),
            // Approximate Make: shadow-xl + hover:shadow-2xl + subtle hover scale (web only).
            ...(showShadow
              ? (Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOpacity: showHover ? 0.24 : 0.18,
                    shadowRadius: showHover ? 18 : 14,
                    shadowOffset: { width: 0, height: showHover ? 10 : 8 },
                  },
                  android: { elevation: showHover ? 10 : 8 },
                  web: {
                    boxShadow: showHover ? '0 20px 50px rgba(0,0,0,0.25)' : '0 14px 36px rgba(0,0,0,0.20)',
                    transform: showHover ? 'scale(1.01)' : 'scale(1)',
                    transition: webTransition,
                  },
                }) as unknown as object)
              : null),
          },
          extra,
        ];
      }}
    >
      {(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        const showHover = Platform.OS === 'web' && hovered && !disabled && !state.pressed;

        const content = (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: contentGap }}>
            {leftIcon}
            {title ? (
              <MakeText weight="semibold" style={titleStyle}>
                {title}
              </MakeText>
            ) : null}
          </View>
        );

        if (variant === 'primary') {
          return (
            <LinearGradient
              testID="make-button-primary-bg"
              colors={showHover ? theme.button.primaryGradientHover : theme.button.primaryGradient}
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
              {content}
            </LinearGradient>
          );
        }

        if (variant === 'secondary') {
          return (
            <View
              testID="make-button-secondary-bg"
              style={{
                backgroundColor: showHover ? theme.button.secondaryBackgroundHover : theme.button.secondaryBackground,
                borderWidth: 1,
                borderColor: theme.button.border,
                paddingVertical: 14,
                paddingHorizontal: 18,
                alignItems: 'center',
                justifyContent: 'center',
                ...(Platform.OS === 'web'
                  ? ({
                      transition: reducedMotion ? 'none' : 'background-color 300ms ease, border-color 300ms ease',
                    } as unknown as object)
                  : null),
                ...(contentStyle ?? {}),
              }}
            >
              {content}
            </View>
          );
        }

        return (
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
            {content}
          </View>
        );
      }}
    </Pressable>
  );
}


