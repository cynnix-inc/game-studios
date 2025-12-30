import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
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
  highlightDigits,
  disabled,
  onDigit,
}: {
  widthPx?: number;
  contentPaddingPx?: number;
  lockMode?: boolean;
  lockedDigit?: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) | null;
  /**
   * Optional hint affordance (Make: Assist). When present and not in lockMode, digits not in the set are visually deemphasized.
   */
  highlightDigits?: ReadonlySet<number> | null;
  disabled: boolean;
  onDigit: (d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const settings = useSettingsStore((s) => s.settings);
  const uiSizing = settings ? getUiSizingSettings(settings) : null;
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  // Make intent: "Digit Size" should affect both the grid digits and the keypad digits.
  // Keep the keypad readable and stable across devices.
  const digitScale = (uiSizing?.digitSizePct ?? 100) / 100;
  // Make `Sudoku.tsx` uses baseDigitSize 16 (mobile) / 32 (desktop), then scales by digit size %.
  const baseDigitSize = isMd ? 32 : 16;
  const digitFontSize = clamp(Math.round(baseDigitSize * digitScale), 14, isMd ? 36 : 26);

  return (
    <View
      style={{
        width: widthPx ?? '100%',
        maxWidth: widthPx ?? 720,
        paddingHorizontal: contentPaddingPx ?? (widthPx ? 0 : 12),
        alignSelf: 'center',
      }}
    >
      {/* Make parity: "grid-cols-9 gap-px" feel (single-pixel separators, no double borders) */}
      <View
        style={{
          backgroundColor: makeTheme.card.border,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          padding: 1,
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
                const isHintHighlighted = !lockMode && highlightDigits && highlightDigits.has(d);
                const isHintDimmed = !lockMode && highlightDigits && !highlightDigits.has(d);
                return {
                  flex: 1,
                  aspectRatio: 1,
                  minHeight: isMd ? 64 : 48,
                  borderRadius: 0,
                  borderWidth: 0,
                  backgroundColor: lockMode && lockedDigit === d ? 'transparent' : makeTheme.button.secondaryBackground,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled ? 0.5 : state.pressed ? 0.9 : isHintDimmed ? 0.35 : 1,
                  ...(isHintHighlighted
                    ? ({
                        borderWidth: 2,
                        borderColor: makeTheme.accent,
                        margin: 1,
                      } as const)
                    : null),
                  // Make parity: keypad buttons are flat (no heavy hover shadows).
                  ...(Platform.OS === 'web'
                    ? ({
                        backgroundColor:
                          hovered && !(lockMode && lockedDigit === d) ? makeTheme.button.secondaryBackground : makeTheme.button.secondaryBackground,
                        transition: 'opacity 150ms ease',
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
                  borderRadius: 0,
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
    </View>
  );
}


