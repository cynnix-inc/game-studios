import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, Award, Clock, Target, TrendingUp, Trophy, Zap } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import type { PlayerProfile } from '@cynnix-studios/game-foundation';

function usernameFromProfile(profile: PlayerProfile | null): string {
  if (!profile) return '';
  if (profile.mode === 'supabase') return profile.displayName ?? profile.email ?? 'Account';
  return profile.displayName;
}

function ProgressBar({ valuePct }: { valuePct: number }) {
  const clamped = Math.max(0, Math.min(100, valuePct));
  return (
    <View
      accessibilityLabel="Progress"
      style={{
        height: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface2,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: theme.colors.accent }} />
    </View>
  );
}

export function UltimateStatsScreen({ profile, onBack }: { profile: PlayerProfile | null; onBack: () => void }) {
  const { theme: makeTheme } = useMakeTheme();
  const username = usernameFromProfile(profile);

  // UI-only placeholders until a stable stats contract exists (see `docs/ultimate-sudoku-figma-gap-log.md` GAP-010).
  const stats = [
    { label: 'Puzzles Solved', value: '156', icon: Target, color: '#60a5fa' },
    { label: 'Total Score', value: '45,230', icon: Trophy, color: '#facc15' },
    { label: 'Play Time', value: '42h 15m', icon: Clock, color: '#a78bfa' },
    { label: 'Completion Rate', value: '67%', icon: TrendingUp, color: '#4ade80' },
  ] as const;

  const achievements = [
    { name: 'First Puzzle', description: 'Complete your first Sudoku', progress: 100 },
    { name: 'Century Club', description: 'Solve 100 puzzles', progress: 100 },
    { name: 'Speed Demon', description: 'Complete expert in under 30 min', progress: 75 },
    { name: 'Marathon', description: 'Play for 50 hours', progress: 84 },
    { name: 'Perfect Game', description: 'Complete without hints or mistakes', progress: 33 },
  ] as const;

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
          variant="secondary"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />

        <MakeText weight="bold" style={{ fontSize: 32, marginTop: 12, marginBottom: 16 }}>
          {username ? `${username}’s Stats` : 'Your Stats'}
        </MakeText>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {stats.map(({ label, value, icon: Icon, color }) => (
            <MakeCard key={label} style={{ borderRadius: 18, width: '48%' as unknown as number }}>
              <View style={{ padding: 16, gap: 10 }}>
                <Icon width={28} height={28} color={color} />
                <MakeText weight="bold" style={{ fontSize: 26 }}>
                  {value}
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  {label}
                </MakeText>
              </View>
            </MakeCard>
          ))}
        </View>

        {/* Level progress */}
        <MakeCard style={{ borderRadius: 18, marginBottom: 16 }}>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <MakeText weight="semibold" style={{ fontSize: 18 }}>
                  Level 24
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  2,450 / 3,000 XP to Level 25
                </MakeText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Zap width={22} height={22} color="#facc15" />
                <MakeText weight="bold" style={{ fontSize: 20 }}>
                  24
                </MakeText>
              </View>
            </View>
            <ProgressBar valuePct={81.67} />
          </View>
        </MakeCard>

        {/* Achievements */}
        <MakeCard style={{ borderRadius: 18 }}>
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Award width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Achievements
              </MakeText>
            </View>

            {achievements.map((a) => (
              <View key={a.name} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <MakeText weight="semibold">{a.name}</MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      {a.description}
                    </MakeText>
                  </View>
                  <MakeText tone="secondary" style={{ marginLeft: 12 }}>
                    {a.progress}%
                  </MakeText>
                </View>
                <ProgressBar valuePct={a.progress} />
              </View>
            ))}

            <MakeText tone="muted" style={{ fontSize: 12 }}>
              UI-only placeholders until stats contracts are finalized.
            </MakeText>
          </View>
        </MakeCard>

        <View style={{ height: theme.spacing.lg }} />
      </View>
    </MakeScreen>
  );
}


