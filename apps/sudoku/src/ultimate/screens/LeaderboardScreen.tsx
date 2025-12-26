import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, Crown, Medal, Trophy } from 'lucide-react-native';

import { nowUtcDateKey } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { getDailyTop100, type DailyLeaderboardRow } from '../../services/leaderboard';

function formatMs(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

function rankStyle(rank: number): { bg: string; border: string } {
  if (rank === 1) return { bg: 'rgba(234,179,8,0.20)', border: 'rgba(234,179,8,0.30)' };
  if (rank === 2) return { bg: 'rgba(148,163,184,0.20)', border: 'rgba(148,163,184,0.30)' };
  if (rank === 3) return { bg: 'rgba(180,83,9,0.20)', border: 'rgba(180,83,9,0.30)' };
  return { bg: 'transparent', border: 'transparent' };
}

function isVisualTest(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof globalThis !== 'undefined' && (globalThis as any).__VISUAL_TEST__ === true;
}

const MOCK_ROWS: DailyLeaderboardRow[] = [
  {
    utc_date: '2025-01-01',
    rank: 1,
    player_id: 'p1',
    display_name: 'ProGamer2024',
    score_ms: 98_750,
    raw_time_ms: 42_000,
    mistakes_count: 0,
    hints_used_count: 0,
    created_at: '2025-01-01T12:00:00.000Z',
  },
  {
    utc_date: '2025-01-01',
    rank: 2,
    player_id: 'p2',
    display_name: 'ElitePlayer',
    score_ms: 95_230,
    raw_time_ms: 44_000,
    mistakes_count: 1,
    hints_used_count: 0,
    created_at: '2025-01-01T12:00:01.000Z',
  },
  {
    utc_date: '2025-01-01',
    rank: 3,
    player_id: 'p3',
    display_name: 'MasterChief',
    score_ms: 92_100,
    raw_time_ms: 48_000,
    mistakes_count: 2,
    hints_used_count: 1,
    created_at: '2025-01-01T12:00:02.000Z',
  },
] as const;

export function UltimateLeaderboardScreen({ onBack }: { onBack: () => void }) {
  const { theme: makeTheme } = useMakeTheme();
  const todayKey = nowUtcDateKey(Date.now());

  const [rows, setRows] = React.useState<DailyLeaderboardRow[]>([]);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');

  React.useEffect(() => {
    if (isVisualTest()) {
      setStatus('idle');
      setRows(MOCK_ROWS);
      return;
    }
    let cancelled = false;
    void (async () => {
      setStatus('loading');
      const res = await getDailyTop100({ utcDate: todayKey, tab: 'score' });
      if (cancelled) return;
      if (!res.ok) {
        setRows([]);
        setStatus('error');
        return;
      }
      setRows(res.rows);
      setStatus('idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
          variant="secondary"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 16 }}>
          <Trophy width={28} height={28} color="#facc15" />
          <MakeText weight="bold" style={{ fontSize: 32 }}>
            Leaderboard
          </MakeText>
        </View>

        <MakeText tone="secondary" style={{ marginBottom: 12 }}>
          Today ({todayKey}) • Score ranking
        </MakeText>

        {status === 'loading' ? <MakeText tone="muted">Loading…</MakeText> : null}
        {status === 'error' ? <MakeText tone="muted">Failed to load leaderboard.</MakeText> : null}

        <View style={{ gap: 10 }}>
          {status === 'idle'
            ? rows.slice(0, 25).map((r) => {
                const isTop = r.rank <= 3;
                const badge =
                  r.rank === 1 ? (
                    <Crown width={18} height={18} color="#facc15" />
                  ) : r.rank === 2 ? (
                    <Medal width={18} height={18} color="#d1d5db" />
                  ) : r.rank === 3 ? (
                    <Medal width={18} height={18} color="#d97706" />
                  ) : null;
                const rs = rankStyle(r.rank);
                const name = r.display_name ?? 'Player';

                return (
                  <MakeCard
                    key={`${r.utc_date}-${r.rank}`}
                    style={
                      r.rank <= 3
                        ? { borderRadius: 18, backgroundColor: rs.bg, borderColor: rs.border }
                        : { borderRadius: 18 }
                    }
                  >
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={{ width: 28, alignItems: 'center' }}>
                            {badge ? (
                              badge
                            ) : (
                              <MakeText weight="bold" style={{ fontSize: 18 }}>
                                {r.rank}
                              </MakeText>
                            )}
                          </View>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              borderWidth: 1,
                              borderColor: makeTheme.card.border,
                              backgroundColor: makeTheme.card.background,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MakeText weight="bold">{initials(name)}</MakeText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <MakeText weight={isTop ? 'bold' : 'semibold'} numberOfLines={1}>
                              {name}
                            </MakeText>
                            <MakeText tone="secondary" numberOfLines={1}>
                              Score {formatMs(r.score_ms)} • Time {formatMs(r.raw_time_ms)}
                            </MakeText>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <MakeText weight="semibold">{formatMs(r.score_ms)}</MakeText>
                          <MakeText tone="muted" style={{ fontSize: 12 }}>
                            mistakes {r.mistakes_count} • hints {r.hints_used_count}
                          </MakeText>
                        </View>
                      </View>
                    </View>
                  </MakeCard>
                );
              })
            : null}
        </View>

        <View style={{ height: theme.spacing.lg }} />
        <MakeText tone="muted" style={{ fontSize: 12 }}>
          Note: The redesign’s leaderboard UI does not specify a Raw Time tab; that feature is logged as a code→figma gap.
        </MakeText>
      </View>
    </MakeScreen>
  );
}


