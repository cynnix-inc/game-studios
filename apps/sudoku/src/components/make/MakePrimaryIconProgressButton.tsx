import React from 'react';
import { Platform, Pressable, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useMakeTheme } from './MakeThemeProvider';

function rgbaFromHex(hex: string, alpha: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const expanded =
    h.length === 3
      ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : h.length === 6
        ? h
        : null;
  if (!expanded) return `rgba(0,0,0,${alpha})`;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function MakePrimaryIconProgressButton({
  accessibilityLabel,
  disabled,
  onPress,
  size = 36,
  radius = 10,
  children,
  onHoverIn,
  onHoverOut,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: PressableProps['onPress'];
  size?: number;
  radius?: number;
  onHoverIn?: PressableProps['onHoverIn'];
  onHoverOut?: PressableProps['onHoverOut'];
  /**
   * Provide the interior content (icon, optional progress bar). This mirrors Make's icon-only primary buttons,
   * but keeps layout flexible for resume/progress variants.
   */
  children: React.ReactNode;
}) {
  const { theme: makeTheme, reducedMotion } = useMakeTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={(state) => {
        const focused =
          Platform.OS === 'web' && 'focused' in state ? Boolean((state as unknown as { focused?: boolean }).focused) : false;
        return {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          opacity: disabled ? 0.6 : state.pressed ? 0.92 : 1,
          ...(Platform.OS === 'web'
            ? ({
                boxShadow: focused ? `0 0 0 3px ${rgbaFromHex(makeTheme.accent, 0.35)}` : undefined,
                transition: reducedMotion ? 'none' : 'opacity 150ms ease, box-shadow 200ms ease',
              } as unknown as object)
            : null),
        };
      }}
    >
      {(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        const showHover = Platform.OS === 'web' && hovered && !disabled && !state.pressed;

        return (
          <LinearGradient
            colors={showHover ? makeTheme.button.primaryGradientHover : makeTheme.button.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: makeTheme.button.border,
              ...(Platform.OS === 'web'
                ? ({
                    transition: reducedMotion ? 'none' : 'filter 300ms ease',
                  } as unknown as object)
                : null),
            }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>{children}</View>
          </LinearGradient>
        );
      }}
    </Pressable>
  );
}


