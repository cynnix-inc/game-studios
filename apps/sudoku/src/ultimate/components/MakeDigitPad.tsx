import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@cynnix-studios/ui';

import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { useSettingsStore } from '../../state/useSettingsStore';
import { getUiSizingSettings } from '../../services/settingsModel';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function MakeDigitPad({
  widthPx,
  contentPaddingPx,
  lockMode,
  lockedDigit,
  disabled,
  onDigit,
}: {
  widthPx?: number;
  contentPaddingPx?: number;
  lockMode?: boolean;
  lockedDigit?: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) | null;
  disabled: boolean;
  onDigit: (d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const settings = useSettingsStore((s) => s.settings);
  const uiSizing = settings ? getUiSizingSettings(settings) : null;
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  // Make intent: "Digit Size" should affect both the grid digits and the keypad digits.
  // Keep the keypad readable and stable across devices.
  const digitScale = (uiSizing?.digitSizePct ?? 100) / 100;
  const digitFontSize = clamp(Math.round(18 * digitScale), 14, 26);

  return (
    <View
      style={{
        width: widthPx ?? '100%',
        maxWidth: widthPx ?? 720,
        paddingHorizontal: contentPaddingPx ?? (widthPx ? 0 : 12),
        alignSelf: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 1 }}>
        {digits.map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`Digit ${d}`}
            disabled={disabled}
            onPress={() => onDigit(d)}
            style={(state) => {
              const hovered =
                Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
              return {
              flex: 1,
              aspectRatio: 1,
              minHeight: 48,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: makeTheme.card.border,
              backgroundColor: lockMode && lockedDigit === d ? 'transparent' : makeTheme.button.secondaryBackground,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.5 : state.pressed ? 0.9 : 1,
              ...(Platform.OS === 'web'
                ? ({
                    boxShadow: hovered ? '0 18px 44px rgba(0,0,0,0.25)' : '0 12px 32px rgba(0,0,0,0.20)',
                    transform: hovered ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 150ms ease',
                  } as unknown as object)
                : null),
              };
            }}
          >
            {lockMode && lockedDigit === d ? (
              <LinearGradient
                colors={makeTheme.button.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: theme.radius.md - 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MakeText weight="bold" style={{ fontSize: digitFontSize, color: makeTheme.button.textOnPrimary }}>
                  {d}
                </MakeText>
              </LinearGradient>
            ) : (
              <MakeText weight="bold" style={{ fontSize: digitFontSize }}>
                {d}
              </MakeText>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}


