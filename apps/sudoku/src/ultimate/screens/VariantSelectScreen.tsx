import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { MakeButton } from '../../components/make/MakeButton';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { VARIANT_DEFINITIONS, getSortedVariants, type UltimateVariant } from '../variants';

const USAGE_KEY = 'variantUsageStats'; // Keep Make parity.

function readUsageStatsWeb(): Partial<Record<UltimateVariant, number>> {
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Partial<Record<UltimateVariant, number>>;
  } catch {
    return {};
  }
}

function writeUsageStatsWeb(stats: Partial<Record<UltimateVariant, number>>) {
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function UltimateVariantSelectScreen({
  onBack,
  onSelectVariant,
}: {
  onBack: () => void;
  onSelectVariant: (variant: UltimateVariant) => void;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const isXl = width >= 1280;
  const { theme: makeTheme } = useMakeTheme();

  const [usageStats, setUsageStats] = React.useState<Partial<Record<UltimateVariant, number>>>(() => ({}));

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    setUsageStats(readUsageStatsWeb());
  }, []);

  const sortedVariants = React.useMemo(() => getSortedVariants(usageStats), [usageStats]);

  const handleSelectVariant = React.useCallback(
    (variant: UltimateVariant) => {
      const def = VARIANT_DEFINITIONS[variant];
      if (def.comingSoon) return;

      // Best-effort web persistence (Make behavior).
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const next: Partial<Record<UltimateVariant, number>> = {
          ...usageStats,
          [variant]: (usageStats[variant] ?? 0) + 1,
        };
        setUsageStats(next);
        writeUsageStatsWeb(next);
      }

      onSelectVariant(variant);
    },
    [onSelectVariant, usageStats],
  );

  const cols = isXl ? 4 : isLg ? 3 : isMd ? 2 : 1;

  return (
    <MakeScreen style={{ padding: isMd ? 32 : 16 }} scroll={false}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: isMd ? 24 : 16 }}>
          <MakeButton
            accessibilityLabel="Back"
            title="Back"
            variant="ghost"
            elevation="flat"
            onPress={onBack}
            leftIcon={<ArrowLeft width={20} height={20} color={makeTheme.text.primary} />}
            contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
          />
          <View style={{ flexShrink: 1 }}>
            <MakeText weight="bold" style={{ fontSize: isMd ? 26 : 22 }}>
              Choose Your Puzzle
            </MakeText>
            <MakeText tone="secondary" style={{ fontSize: 14 }}>
              Select a sudoku variant to play
            </MakeText>
          </View>
        </View>

        {/* Grid */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 8 }}>
            {sortedVariants.map((variantId) => {
              const variant = VARIANT_DEFINITIONS[variantId];
              const usageCount = usageStats[variantId] ?? 0;
              const isComingSoon = variant.comingSoon;
              const cardWidth = cols === 1 ? '100%' : cols === 2 ? '48%' : cols === 3 ? '32%' : '24%';

              return (
                <Pressable
                  key={variant.id}
                  accessibilityRole="button"
                  accessibilityLabel={variant.name}
                  disabled={isComingSoon}
                  onPress={() => handleSelectVariant(variant.id)}
                  style={(state) => {
                    const hovered =
                      Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                    return {
                      width: cardWidth as unknown as number,
                      opacity: isComingSoon ? 0.6 : state.pressed ? 0.96 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            cursor: isComingSoon ? 'not-allowed' : 'pointer',
                            transform: hovered && !isComingSoon ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 250ms ease, opacity 150ms ease',
                          } as unknown as object)
                        : null),
                    };
                  }}
                >
                  {(state) => {
                    const hovered =
                      Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                    return (
                      <MakeCard style={{ borderRadius: 16 }}>
                        <View style={{ padding: 14, gap: 10 }}>
                          {/* Badges */}
                          {isComingSoon ? (
                            <View
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                backgroundColor: 'rgba(168, 85, 247, 0.18)',
                                borderWidth: 1,
                                borderColor: 'rgba(236, 72, 153, 0.18)',
                              }}
                            >
                              <MakeText style={{ fontSize: 11, color: makeTheme.text.primary }}>Coming Soon</MakeText>
                            </View>
                          ) : usageCount > 0 ? (
                            <View
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                backgroundColor: makeTheme.button.secondaryBackground,
                                borderWidth: 1,
                                borderColor: makeTheme.card.border,
                              }}
                            >
                              <MakeText style={{ fontSize: 11 }}>{usageCount}x</MakeText>
                            </View>
                          ) : null}

                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                            <MakeText style={{ fontSize: 22 }}>{variant.icon}</MakeText>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <MakeText weight="semibold" style={{ fontSize: 14 }}>
                                {variant.name}
                              </MakeText>
                              <MakeText tone="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                                {variant.shortDescription}
                              </MakeText>
                            </View>
                          </View>

                          <MakeText tone="muted" style={{ fontSize: 12, lineHeight: 16 }}>
                            {variant.description}
                          </MakeText>

                          {!isComingSoon && Platform.OS === 'web' ? (
                            <View style={{ alignItems: 'flex-end', paddingTop: 2 }}>
                              <MakeText style={{ fontSize: 12, color: makeTheme.accent, opacity: hovered ? 1 : 0 }}>
                                →
                              </MakeText>
                            </View>
                          ) : null}
                        </View>
                      </MakeCard>
                    );
                  }}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: theme.spacing.md }} />
      </View>
    </MakeScreen>
  );
}



