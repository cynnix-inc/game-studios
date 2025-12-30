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
import { loadLocalStats } from '../../services/stats';
import { computeScoreMs } from '@cynnix-studios/sudoku-core';

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

  const [excludeZen, setExcludeZen] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<{
    puzzlesSolved: number;
    totalScoreMs: number;
    playTimeMs: number;
    startedCount: number;
  }>({ puzzlesSolved: 0, totalScoreMs: 0, playTimeMs: 0, startedCount: 0 });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const stats = await loadLocalStats();
      if (!alive) return;

      let puzzlesSolved = 0;
      let startedCount = 0;
      let playTimeMs = 0;
      let totalScoreMs = 0;

      for (const dev of Object.values(stats.devices)) {
        for (const [bucketKey, bucket] of Object.entries(dev.buckets)) {
          const zenFlag = bucketKey.split('::')[4] ?? '0';
          const isZen = zenFlag === '1';
          if (excludeZen && isZen) continue;

          startedCount += bucket.startedCount;
          puzzlesSolved += bucket.completedCount;
          playTimeMs += bucket.completed.totalTimeMs + bucket.abandoned.totalTimeMs;
          totalScoreMs += computeScoreMs({
            raw_time_ms: bucket.completed.totalTimeMs,
            mistakes_count: bucket.completed.totalMistakesCount,
            hint_breakdown: bucket.completed.hintBreakdown,
          });
        }
      }

      setSummary({ puzzlesSolved, totalScoreMs, playTimeMs, startedCount });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [excludeZen]);

  function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours <= 0) return `${minutes}m`;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  function formatScoreMs(totalMs: number): string {
    // Score is "lower is better" but this screen is a lifetime aggregate; show total seconds as an easy-to-read number.
    const seconds = Math.max(0, Math.floor(totalMs / 1000));
    return seconds.toLocaleString();
  }

  const completionRatePct = summary.startedCount > 0 ? Math.round((summary.puzzlesSolved / summary.startedCount) * 100) : 0;

  const stats = [
    { label: 'Puzzles Solved', value: loading ? '—' : String(summary.puzzlesSolved), icon: Target, color: '#60a5fa' },
    { label: 'Total Score', value: loading ? '—' : formatScoreMs(summary.totalScoreMs), icon: Trophy, color: '#facc15' },
    { label: 'Play Time', value: loading ? '—' : formatDuration(summary.playTimeMs), icon: Clock, color: '#a78bfa' },
    { label: 'Completion Rate', value: loading ? '—' : `${completionRatePct}%`, icon: TrendingUp, color: '#4ade80' },
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <MakeText tone="muted" style={{ fontSize: 12 }}>
            {excludeZen ? 'Excluding Zen runs' : 'Including Zen runs'}
          </MakeText>
          <MakeButton
            accessibilityLabel={excludeZen ? 'Include Zen runs' : 'Exclude Zen runs'}
            title={excludeZen ? 'Include Zen' : 'Exclude Zen'}
            variant="secondary"
            elevation="flat"
            radius={12}
            onPress={() => setExcludeZen((v) => !v)}
            contentStyle={{ height: 36, paddingVertical: 0, paddingHorizontal: 12 }}
            titleStyle={{ fontSize: 12, lineHeight: 16 }}
          />
        </View>

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
              Stats are local-first and sync when signed in; Zen runs are tracked but can be excluded.
            </MakeText>
          </View>
        </MakeCard>

        <View style={{ height: theme.spacing.lg }} />
      </View>
    </MakeScreen>
  );
}


