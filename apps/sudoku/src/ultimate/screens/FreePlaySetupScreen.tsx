import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Brain, Crown, Sunrise, Target, Trophy, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@cynnix-studios/ui';

import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { MakeButton } from '../../components/make/MakeButton';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { useSettingsStore } from '../../state/useSettingsStore';
import { usePlayerStore } from '../../state/usePlayerStore';
import { updateLocalSettings } from '../../services/settings';
import { getSettingsToggles, setSettingsToggles } from '../../services/settingsModel';
import type { UltimateDifficulty } from '../navigation/UltimateNavState';
import { VARIANT_DEFINITIONS, type UltimateVariant } from '../variants';

type Mode = 'classic' | 'zen';

type DifficultyCard = {
  level: UltimateDifficulty;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  title: string;
  subtitle: string;
  description: string;
  clues: string;
  completionRate: string;
  avgTime: string;
  iconColor: string;
  gradient: [string, string];
};

// Mirrors Make `GameSetup.tsx` difficulty cards.
const DIFFICULTIES: readonly DifficultyCard[] = [
  {
    level: 'novice',
    icon: Sunrise,
    title: 'Novice',
    subtitle: 'Warm-Up Mode',
    description: 'Quick wins. Mostly obvious placements, great for learning and getting momentum.',
    clues: '40-45',
    completionRate: '98%',
    avgTime: '5-8 min',
    iconColor: '#4ade80',
    gradient: ['rgba(34,197,94,0.20)', 'rgba(16,185,129,0.20)'],
  },
  {
    level: 'skilled',
    icon: Target,
    title: 'Skilled',
    subtitle: 'Standard Play',
    description: 'Feels like "real Sudoku." You will use pairs and basic line and box interactions.',
    clues: '32-36',
    completionRate: '85%',
    avgTime: '12-18 min',
    iconColor: '#60a5fa',
    gradient: ['rgba(59,130,246,0.20)', 'rgba(34,211,238,0.20)'],
  },
  {
    level: 'advanced',
    icon: Brain,
    title: 'Advanced',
    subtitle: "Thinker's Level",
    description: 'Fewer freebies. You will need planning, triples, and pattern spotting.',
    clues: '28-32',
    completionRate: '65%',
    avgTime: '20-30 min',
    iconColor: '#facc15',
    gradient: ['rgba(234,179,8,0.20)', 'rgba(245,158,11,0.20)'],
  },
  {
    level: 'expert',
    icon: Trophy,
    title: 'Expert',
    subtitle: 'Puzzle Master',
    description: 'Pattern hunting starts. Expect X-Wing and deeper eliminations.',
    clues: '25-28',
    completionRate: '40%',
    avgTime: '35-50 min',
    iconColor: '#fb923c',
    gradient: ['rgba(249,115,22,0.20)', 'rgba(239,68,68,0.20)'],
  },
  {
    level: 'fiendish',
    icon: Zap,
    title: 'Fiendish',
    subtitle: 'Logic Warrior',
    description: 'Tight and demanding. Multi-step logic required to break through.',
    clues: '23-25',
    completionRate: '25%',
    avgTime: '50-75 min',
    iconColor: '#f87171',
    gradient: ['rgba(239,68,68,0.20)', 'rgba(244,63,94,0.20)'],
  },
  {
    level: 'ultimate',
    icon: Crown,
    title: 'Ultimate',
    subtitle: 'Legend Mode',
    description: 'The brain-melter tier. Minimal clues, very precise logic required.',
    clues: '20-23',
    completionRate: '10%',
    avgTime: '75+ min',
    iconColor: '#c084fc',
    gradient: ['rgba(168,85,247,0.20)', 'rgba(236,72,153,0.20)'],
  },
];

export function UltimateFreePlaySetupScreen({
  selectedVariant,
  onBack,
  onStart,
}: {
  selectedVariant: UltimateVariant;
  onBack: () => void;
  onStart: (args: { difficulty: UltimateDifficulty; mode: Mode; gridSize: '9x9' }) => void;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const { theme: makeTheme } = useMakeTheme();

  const variantDef = VARIANT_DEFINITIONS[selectedVariant];
  const settings = useSettingsStore((s) => s.settings);
  const deviceId = usePlayerStore((s) => s.deviceId) ?? 'unknown';

  const toggles = settings ? getSettingsToggles(settings) : null;
  const [selectedMode, setSelectedMode] = React.useState<Mode>(() => (toggles?.zenMode ? 'zen' : 'classic'));
  const [gridSize] = React.useState<'9x9'>('9x9');

  // Keep initial mode in sync if settings load after mount.
  React.useEffect(() => {
    if (!toggles) return;
    setSelectedMode(toggles.zenMode ? 'zen' : 'classic');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.updatedAtMs]);

  const persistModeToSettings = React.useCallback(
    (mode: Mode) => {
      setSelectedMode(mode);
      if (!settings) return;
      const zenMode = mode === 'zen';
      const next = setSettingsToggles(settings, { zenMode }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
      updateLocalSettings(next);
    },
    [deviceId, settings],
  );

  return (
    <MakeScreen style={{ padding: isMd ? 32 : 16 }}>
      <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
            <MakeText style={{ fontSize: isMd ? 30 : 26 }}>{variantDef.icon}</MakeText>
            <View style={{ flexShrink: 1 }}>
              <MakeText weight="bold" style={{ fontSize: isMd ? 24 : 20 }}>
                {variantDef.name}
              </MakeText>
              <MakeText tone="secondary" style={{ fontSize: 14 }}>
                {variantDef.shortDescription}
              </MakeText>
            </View>
          </View>
        </View>

        {/* Mode selection */}
        <View style={{ marginBottom: 18 }}>
          <MakeText weight="semibold" style={{ marginBottom: 10, fontSize: 16 }}>
            Mode
          </MakeText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mode Classic"
              onPress={() => persistModeToSettings('classic')}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed ? 0.96 : 1,
              })}
            >
              <MakeCard
                style={{
                  borderRadius: 12,
                  borderColor: selectedMode === 'classic' ? makeTheme.accent : makeTheme.card.border,
                  borderWidth: selectedMode === 'classic' ? 2 : 1,
                }}
              >
                <View style={{ paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <MakeText style={{ fontSize: 18 }}>⏱️</MakeText>
                  <View>
                    <MakeText weight="semibold" style={{ fontSize: 14 }}>
                      Classic
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Timed with mistakes
                    </MakeText>
                  </View>
                </View>
              </MakeCard>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mode Zen"
              onPress={() => persistModeToSettings('zen')}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed ? 0.96 : 1,
              })}
            >
              <MakeCard
                style={{
                  borderRadius: 12,
                  borderColor: selectedMode === 'zen' ? makeTheme.accent : makeTheme.card.border,
                  borderWidth: selectedMode === 'zen' ? 2 : 1,
                }}
              >
                <View style={{ paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <MakeText style={{ fontSize: 18 }}>🧘</MakeText>
                  <View>
                    <MakeText weight="semibold" style={{ fontSize: 14 }}>
                      Zen
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Relaxed, no pressure
                    </MakeText>
                  </View>
                </View>
              </MakeCard>
            </Pressable>
          </View>
        </View>

        {/* Difficulty selection */}
        <View style={{ marginBottom: 18 }}>
          <MakeText weight="semibold" style={{ marginBottom: 10, fontSize: 16 }}>
            Select Difficulty
          </MakeText>
          <View style={{ flexDirection: isLg ? 'row' : 'column', flexWrap: isLg ? 'wrap' : 'nowrap', gap: 12 }}>
            {DIFFICULTIES.map((d) => {
              const Icon = d.icon;
              const cardWidth = isLg ? '32%' : isMd ? '48%' : '100%';
              return (
                <Pressable
                  key={d.level}
                  accessibilityRole="button"
                  accessibilityLabel={d.title}
                  onPress={() => onStart({ difficulty: d.level, mode: selectedMode, gridSize })}
                  style={(state) => {
                    const hovered =
                      Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                    return {
                      width: cardWidth as unknown as number,
                      opacity: state.pressed ? 0.96 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            transform: hovered ? 'scale(1.02)' : 'scale(1)',
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
                        <View style={{ padding: 16, gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                            <LinearGradient
                              colors={d.gradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{ padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}
                            >
                              <Icon width={20} height={20} color={d.iconColor} />
                            </LinearGradient>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <MakeText weight="bold" style={{ fontSize: 18 }}>
                                {d.title}
                              </MakeText>
                              <MakeText tone="secondary" style={{ fontSize: 12, marginTop: 1 }}>
                                {d.subtitle}
                              </MakeText>
                            </View>
                          </View>

                          <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
                            {d.description}
                          </MakeText>

                          <View style={{ borderTopWidth: 1, borderTopColor: makeTheme.card.border, paddingTop: 10, flexDirection: 'row' }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                              <MakeText style={{ fontSize: 12 }}>{d.clues}</MakeText>
                              <MakeText tone="muted" style={{ fontSize: 11 }}>
                                Clues
                              </MakeText>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                              <MakeText style={{ fontSize: 12 }}>{d.completionRate}</MakeText>
                              <MakeText tone="muted" style={{ fontSize: 11 }}>
                                Success
                              </MakeText>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                              <MakeText style={{ fontSize: 12 }}>{d.avgTime}</MakeText>
                              <MakeText tone="muted" style={{ fontSize: 11 }}>
                                Avg.
                              </MakeText>
                            </View>
                          </View>

                          {Platform.OS === 'web' ? (
                            <View style={{ alignItems: 'center', paddingTop: 2 }}>
                              <MakeText style={{ fontSize: 12, color: makeTheme.accent, opacity: hovered ? 1 : 0 }}>
                                Click to play →
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

        {/* Sub-variant (if applicable). Today we only support classic 9x9, so other options are disabled. */}
        {variantDef.subVariants?.type === 'grid-size' ? (
          <MakeCard style={{ borderRadius: 16 }}>
            <View style={{ padding: 16, gap: 10 }}>
              <MakeText weight="semibold">{variantDef.subVariants?.label}</MakeText>
              <MakeText tone="muted" style={{ fontSize: 12 }}>
                Only 9×9 is available right now.
              </MakeText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(variantDef.subVariants.options as readonly string[]).map((opt) => {
                  const enabled = opt === '9x9';
                  const selected = opt === gridSize;
                  return (
                    <Pressable
                      key={opt}
                      accessibilityRole="button"
                      accessibilityLabel={`${variantDef.subVariants?.label ?? 'Option'} ${opt}`}
                      disabled={!enabled}
                      style={({ pressed }) => ({
                        opacity: !enabled ? 0.5 : pressed ? 0.92 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? makeTheme.button.secondaryBackground : 'transparent',
                          borderWidth: 1,
                          borderColor: selected ? makeTheme.accent : makeTheme.card.border,
                        }}
                      >
                        <MakeText>{opt}</MakeText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </MakeCard>
        ) : null}

        <View style={{ height: theme.spacing.xl }} />
      </View>
    </MakeScreen>
  );
}


