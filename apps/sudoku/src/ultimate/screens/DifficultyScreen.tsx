import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { ArrowLeft, Flame, Skull, Target, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@cynnix-studios/ui';

import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { MakeButton } from '../../components/make/MakeButton';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import type { UltimateDifficulty } from '../navigation/UltimateNavState';

type DifficultyCard = {
  level: UltimateDifficulty;
  title: string;
  description: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  iconColor: string;
  gradient: [string, string];
};

const DIFFICULTIES: DifficultyCard[] = [
  {
    level: 'novice',
    title: 'Novice',
    description: '36–40 clues',
    icon: Zap,
    iconColor: '#4ade80',
    gradient: ['rgba(34,197,94,0.20)', 'rgba(16,185,129,0.20)'],
  },
  {
    level: 'skilled',
    title: 'Skilled',
    description: '30–34 clues',
    icon: Target,
    iconColor: '#60a5fa',
    gradient: ['rgba(59,130,246,0.20)', 'rgba(34,211,238,0.20)'],
  },
  {
    level: 'advanced',
    title: 'Advanced',
    description: '26–30 clues',
    icon: Flame,
    iconColor: '#fb923c',
    gradient: ['rgba(249,115,22,0.20)', 'rgba(239,68,68,0.20)'],
  },
  {
    level: 'expert',
    title: 'Expert',
    description: '22–26 clues',
    icon: Skull,
    iconColor: '#f87171',
    gradient: ['rgba(239,68,68,0.20)', 'rgba(244,63,94,0.20)'],
  },
  {
    level: 'fiendish',
    title: 'Fiendish',
    description: '20–24 clues',
    icon: Skull,
    iconColor: '#fb7185',
    gradient: ['rgba(244,63,94,0.20)', 'rgba(239,68,68,0.20)'],
  },
  {
    level: 'ultimate',
    title: 'Ultimate',
    description: '17–22 clues',
    icon: Skull,
    iconColor: '#fca5a5',
    gradient: ['rgba(239,68,68,0.22)', 'rgba(190,18,60,0.22)'],
  },
];

export function UltimateDifficultyScreen({
  onBack,
  onSelectDifficulty,
}: {
  onBack: () => void;
  onSelectDifficulty: (difficulty: UltimateDifficulty) => void;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const { theme: makeTheme } = useMakeTheme();

  return (
    <MakeScreen style={{ padding: isMd ? 32 : 16 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <MakeButton
            accessibilityLabel="Back"
            title="Back"
            variant="ghost"
            onPress={onBack}
            leftIcon={<ArrowLeft width={20} height={20} color={makeTheme.text.primary} />}
            contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
          />

          <MakeText style={{ fontSize: isMd ? 28 : 22 }} weight="bold">
            Select Difficulty
          </MakeText>

          {/* Spacer to balance header */}
          <View style={{ width: 88 }} />
        </View>

        {/* Cards */}
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <View style={{ flexDirection: isMd ? 'row' : 'column', flexWrap: 'wrap', gap: theme.spacing.md }}>
            {DIFFICULTIES.map((d) => {
              const Icon = d.icon;
              const cardWidth = isMd ? '48%' : '100%';
              return (
                <Pressable
                  key={d.level}
                  accessibilityRole="button"
                  accessibilityLabel={d.title}
                  onPress={() => onSelectDifficulty(d.level)}
                  style={(state) => {
                    const hovered =
                      Platform.OS === 'web' && 'hovered' in state
                        ? Boolean((state as unknown as { hovered?: boolean }).hovered)
                        : false;
                    return {
                      width: cardWidth as unknown as number,
                      opacity: state.pressed ? 0.96 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            transform: hovered ? 'scale(1.03)' : 'scale(1)',
                            transition: 'transform 250ms ease, opacity 150ms ease',
                          } as unknown as object)
                        : null),
                    };
                  }}
                >
                  {(state) => {
                    const hovered =
                      Platform.OS === 'web' && 'hovered' in state
                        ? Boolean((state as unknown as { hovered?: boolean }).hovered)
                        : false;
                    return (
                    <MakeCard style={{ borderRadius: 24 }}>
                      <View style={{ padding: 32, gap: 16 }}>
                        <LinearGradient
                          colors={d.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ padding: 16, borderRadius: 16, alignSelf: 'flex-start' }}
                        >
                          <Icon width={40} height={40} color={d.iconColor} />
                        </LinearGradient>

                        <View>
                          <MakeText style={{ fontSize: isMd ? 30 : 24 }} weight="bold">
                            {d.title}
                          </MakeText>
                          <MakeText tone="muted" style={{ marginTop: 4, fontSize: 14 }}>
                            {d.description}
                          </MakeText>
                        </View>

                        <View style={{ borderTopWidth: 1, borderTopColor: makeTheme.card.border, paddingTop: 16, gap: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <MakeText tone="secondary" style={{ fontSize: 14 }}>
                              Completion Rate
                            </MakeText>
                            <MakeText style={{ fontSize: 14 }}>
                              {d.level === 'novice'
                                ? '95%'
                                : d.level === 'skilled'
                                  ? '80%'
                                  : d.level === 'advanced'
                                    ? '55%'
                                    : d.level === 'expert'
                                      ? '35%'
                                      : d.level === 'fiendish'
                                        ? '20%'
                                        : '10%'}
                            </MakeText>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <MakeText tone="secondary" style={{ fontSize: 14 }}>
                              Avg. Time
                            </MakeText>
                            <MakeText style={{ fontSize: 14 }}>
                              {d.level === 'novice'
                                ? '8-12 min'
                                : d.level === 'skilled'
                                  ? '15-25 min'
                                  : d.level === 'advanced'
                                    ? '25-40 min'
                                    : d.level === 'expert'
                                      ? '40-60 min'
                                      : d.level === 'fiendish'
                                        ? '60-90 min'
                                        : '90+ min'}
                            </MakeText>
                          </View>
                        </View>

                        {/* Hover-only indicator (web) */}
                        <View style={{ alignItems: 'center', paddingTop: 6 }}>
                          <MakeText
                            style={{
                              fontSize: 14,
                              color: makeTheme.accent,
                              opacity: Platform.OS === 'web' && hovered ? 1 : 0,
                            }}
                          >
                            Click to play →
                          </MakeText>
                        </View>
                      </View>
                    </MakeCard>
                    );
                  }}
                </Pressable>
              );
            })}
          </View>

          {/* Info */}
          <MakeCard style={{ borderRadius: 16 }}>
            <View style={{ padding: 24 }}>
              <MakeText weight="semibold" style={{ marginBottom: 12 }}>
                About Difficulty Levels
              </MakeText>
              <View style={{ gap: 8 }}>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Novice:</MakeText> Great for warm-up and learning patterns
                </MakeText>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Skilled:</MakeText> Standard play with basic patterns
                </MakeText>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Advanced:</MakeText> Requires deeper scanning and control
                </MakeText>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Expert:</MakeText> Harder patterns and more complex deductions
                </MakeText>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Fiendish:</MakeText> Logic warrior tier
                </MakeText>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  • <MakeText>Ultimate:</MakeText> Legend mode
                </MakeText>
              </View>
            </View>
          </MakeCard>
        </View>
      </View>
    </MakeScreen>
  );
}


