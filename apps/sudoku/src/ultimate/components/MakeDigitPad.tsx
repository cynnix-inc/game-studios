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
  digitCounts,
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
  /**
   * Optional counts of digits currently present on the puzzle (index = digit).
   * When present, digits with count >= 9 are disabled and visually deemphasized (Make parity).
   */
  digitCounts?: ReadonlyArray<number> | null;
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

  // Make parity: disable digits that are already complete (9 occurrences).
  const isNumberComplete = (d: number) => {
    const c = digitCounts?.[d];
    return typeof c === 'number' && Number.isFinite(c) && c >= 9;
  };

  return (
    <View
      style={{
        width: widthPx ?? '100%',
        maxWidth: widthPx ?? 720,
        paddingHorizontal: contentPaddingPx ?? (widthPx ? 0 : 12),
        alignSelf: 'center',
      }}
    >
      {/* Make parity: 9-column keypad with gap-2 (separate square buttons) */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {digits.map((d) => {
          const complete = isNumberComplete(d);
          const isLocked = !!lockMode && lockedDigit === d;
          const isHintHighlighted = !lockMode && highlightDigits && highlightDigits.has(d);
          const isHintDimmed = !lockMode && highlightDigits && !highlightDigits.has(d);

          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
              disabled={disabled || complete}
              onPress={() => onDigit(d)}
              style={(state) => {
                const hovered =
                  Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;

                return {
                  flex: 1,
                  aspectRatio: 1,
                  minHeight: isMd ? 64 : 48,
                  // Make `Button` uses rounded-md.
                  borderRadius: 6,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLocked ? 'transparent' : makeTheme.button.secondaryBackground,
                  borderWidth: isLocked || isHintHighlighted ? 1 : 0,
                  // Make keypad uses card.border for the lock border.
                  borderColor: isLocked ? makeTheme.card.border : isHintHighlighted ? makeTheme.accent : 'transparent',
                  opacity: disabled ? 0.5 : complete ? 0.3 : state.pressed ? 0.9 : isHintDimmed ? 0.35 : 1,
                  ...(Platform.OS === 'web'
                    ? ({
                        cursor: disabled || complete ? 'not-allowed' : 'pointer',
                        // Make keypad hover is subtle; keep it flat.
                        transform: hovered && !state.pressed ? 'scale(1.005)' : 'scale(1)',
                        transition: 'transform 140ms ease, opacity 150ms ease',
                      } as unknown as object)
                    : null),
                };
              }}
            >
              {isLocked ? (
                <LinearGradient
                  colors={makeTheme.button.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
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
          );
        })}
      </View>
    </View>
  );
}


