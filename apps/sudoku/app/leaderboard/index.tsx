import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { getLastNUtcDateKeys, nowUtcDateKey } from '@cynnix-studios/sudoku-core';
import { AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { getDailyAroundYou, getDailyTop100, type DailyLeaderboardRow } from '../../src/services/leaderboard';
import { trackEvent } from '../../src/services/telemetry';

type LeaderboardTab = 'score' | 'raw_time';

function formatMs(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function Row({
  r,
  mePlayerId,
}: {
  r: DailyLeaderboardRow;
  mePlayerId: string | null;
}) {
  const isMe = mePlayerId != null && r.player_id === mePlayerId;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderTopWidth: r.rank === 1 ? 0 : 1,
        borderTopColor: theme.colors.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
        <AppText weight={isMe ? 'semibold' : 'regular'}>{r.rank}. {isMe ? 'You' : r.display_name}</AppText>
        <AppText tone="muted">
          Score {formatMs(r.score_ms)} · Time {formatMs(r.raw_time_ms)} · Mistakes {r.mistakes_count} · Hints {r.hints_used_count}
        </AppText>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const todayKey = nowUtcDateKey(Date.now());
  const archive = useMemo(() => getLastNUtcDateKeys(Date.now(), 30), []);

  const [utcDate, setUtcDate] = useState<string>(todayKey);
  const [tab, setTab] = useState<LeaderboardTab>('score');

  useEffect(() => {
    void trackEvent({ name: 'leaderboard_view', props: { tab, utc_date: utcDate } });
  }, [tab, utcDate]);

  const [top, setTop] = useState<DailyLeaderboardRow[]>([]);
  const [topStatus, setTopStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const [around, setAround] = useState<DailyLeaderboardRow[]>([]);
  const [mePlayerId, setMePlayerId] = useState<string | null>(null);
  const [aroundStatus, setAroundStatus] = useState<'idle' | 'loading' | 'not_signed_in' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setTopStatus('loading');
      const res = await getDailyTop100({ utcDate, tab });
      if (cancelled) return;
      if (!res.ok) {
        setTop([]);
        setTopStatus('error');
        return;
      }
      setTop(res.rows);
      setTopStatus('idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, utcDate]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setAroundStatus('loading');
      const res = await getDailyAroundYou({ utcDate, tab, window: 3 });
      if (cancelled) return;
      if (!res.ok) {
        setAround([]);
        setMePlayerId(null);
        setAroundStatus(res.error.code === 'not_authenticated' ? 'not_signed_in' : 'error');
        return;
      }
      setAround(res.rows);
      setMePlayerId(res.mePlayerId);
      setAroundStatus('idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, utcDate]);

  return (
    <Screen scroll>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Daily Leaderboard
      </AppText>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText tone="muted">UTC date: {utcDate}</AppText>
      </AppCard>

      <AppCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText weight="semibold">Day</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {archive.map((k) => {
            const active = k === utcDate;
            return (
              <Pressable
                key={k}
                onPress={() => setUtcDate(k)}
                accessibilityRole="button"
                accessibilityLabel={`View leaderboard for ${k}`}
                style={{
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.accent : theme.colors.surface2,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <AppText weight="semibold" tone={active ? 'default' : 'muted'}>
                  {k === todayKey ? 'Today' : k.slice(5)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Tabs
        </AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {(['score', 'raw_time'] as const).map((t) => {
            const active = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="button"
                accessibilityLabel={t === 'score' ? 'Score tab' : 'Raw Time tab'}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.accent : theme.colors.surface2,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <AppText weight="semibold">{t === 'score' ? 'Score' : 'Raw Time'}</AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Top 100
        </AppText>
        {topStatus === 'loading' ? <AppText tone="muted">Loading…</AppText> : null}
        {topStatus === 'error' ? <AppText tone="muted">Unable to load leaderboard.</AppText> : null}
        {top.map((r) => (
          <Row key={`${r.utc_date}-${r.rank}-${r.player_id}`} r={r} mePlayerId={mePlayerId} />
        ))}
      </AppCard>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Around You
        </AppText>
        {aroundStatus === 'loading' ? <AppText tone="muted">Loading…</AppText> : null}
        {aroundStatus === 'not_signed_in' ? <AppText tone="muted">Sign in to see your position.</AppText> : null}
        {aroundStatus === 'error' ? <AppText tone="muted">Unable to load your slice.</AppText> : null}
        {aroundStatus === 'idle' && around.length === 0 ? <AppText tone="muted">No ranked run for this day.</AppText> : null}
        {around.map((r) => (
          <Row key={`around-${r.utc_date}-${r.rank}-${r.player_id}`} r={r} mePlayerId={mePlayerId} />
        ))}
      </AppCard>
    </Screen>
  );
}


