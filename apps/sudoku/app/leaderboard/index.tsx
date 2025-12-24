import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { getLastNUtcDateKeys, nowUtcDateKey } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';

import { getDailyAroundYou, getDailyTop100, type DailyLeaderboardRow } from '../../src/services/leaderboard';
import { trackEvent } from '../../src/services/telemetry';
import { MakeCard } from '../../src/components/make/MakeCard';
import { MakeScreen } from '../../src/components/make/MakeScreen';
import { MakeText } from '../../src/components/make/MakeText';

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
        borderTopColor: 'rgba(255,255,255,0.20)',
      }}
    >
      <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
        <MakeText weight={isMe ? 'semibold' : 'regular'}>{r.rank}. {isMe ? 'You' : r.display_name}</MakeText>
        <MakeText tone="muted">
          Score {formatMs(r.score_ms)} · Time {formatMs(r.raw_time_ms)} · Mistakes {r.mistakes_count} · Hints {r.hints_used_count}
        </MakeText>
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
    <MakeScreen scroll>
      <MakeText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Daily Leaderboard
      </MakeText>

      <MakeCard style={{ marginBottom: theme.spacing.md }}>
        <MakeText tone="muted">UTC date: {utcDate}</MakeText>
      </MakeCard>

      <MakeCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <MakeText weight="semibold">Day</MakeText>
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
                  backgroundColor: active ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                }}
              >
                <MakeText weight="semibold" tone={active ? 'primary' : 'muted'}>
                  {k === todayKey ? 'Today' : k.slice(5)}
                </MakeText>
              </Pressable>
            );
          })}
        </View>
      </MakeCard>

      <MakeCard style={{ marginBottom: theme.spacing.md }}>
        <MakeText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Tabs
        </MakeText>
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
                  backgroundColor: active ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                  alignItems: 'center',
                }}
              >
                <MakeText weight="semibold">{t === 'score' ? 'Score' : 'Raw Time'}</MakeText>
              </Pressable>
            );
          })}
        </View>
      </MakeCard>

      <MakeCard style={{ marginBottom: theme.spacing.md }}>
        <MakeText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Top 100
        </MakeText>
        {topStatus === 'loading' ? <MakeText tone="muted">Loading…</MakeText> : null}
        {topStatus === 'error' ? <MakeText tone="muted">Unable to load leaderboard.</MakeText> : null}
        {topStatus === 'idle' && top.length === 0 ? <MakeText tone="muted">No ranked runs yet for this day.</MakeText> : null}
        {top.map((r) => (
          <Row key={`${r.utc_date}-${r.rank}-${r.player_id}`} r={r} mePlayerId={mePlayerId} />
        ))}
      </MakeCard>

      <MakeCard style={{ marginBottom: theme.spacing.md }}>
        <MakeText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Around You
        </MakeText>
        {aroundStatus === 'loading' ? <MakeText tone="muted">Loading…</MakeText> : null}
        {aroundStatus === 'not_signed_in' ? <MakeText tone="muted">Sign in to see your position.</MakeText> : null}
        {aroundStatus === 'error' ? <MakeText tone="muted">Unable to load your slice.</MakeText> : null}
        {aroundStatus === 'idle' && around.length === 0 ? <MakeText tone="muted">No ranked run for this day.</MakeText> : null}
        {around.map((r) => (
          <Row key={`around-${r.utc_date}-${r.rank}-${r.player_id}`} r={r} mePlayerId={mePlayerId} />
        ))}
      </MakeCard>
    </MakeScreen>
  );
}


