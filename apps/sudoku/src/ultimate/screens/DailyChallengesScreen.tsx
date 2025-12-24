import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft, Calendar, CheckCircle, Flame, Lock, TrendingUp, Trophy, X } from 'lucide-react-native';
import { nowUtcDateKey } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { getDailyTop100, type DailyLeaderboardRow } from '../../services/leaderboard';
import { readDailyCompletionIndex } from '../../services/dailyCompletion';
import { buildUtcMonthCalendar } from './daily/calendarModel';

type TabType = 'calendar' | 'leaderboard' | 'stats';

function formatMs(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function computeCurrentStreak(args: { todayKey: string; completedKeys: Set<string> }): number {
  // UTC date keys are ISO-like, so we can walk backwards by days via Date.
  let streak = 0;
  let cursor = new Date(`${args.todayKey}T00:00:00.000Z`);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!args.completedKeys.has(key)) break;
    streak++;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

export function UltimateDailyChallengesScreen({
  onBack,
  onStartDaily,
}: {
  onBack: () => void;
  onStartDaily: (dateKey: string) => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const [activeTab, setActiveTab] = React.useState<TabType>('calendar');
  const [selectedDay, setSelectedDay] = React.useState<{ dateKey: string; dayOfMonth: number } | null>(null);

  const todayKey = nowUtcDateKey(Date.now());
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const calendar = buildUtcMonthCalendar({ year: today.getUTCFullYear(), month0: today.getUTCMonth() });

  const [completionKeys, setCompletionKeys] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const idx = await readDailyCompletionIndex();
      if (cancelled) return;
      setCompletionKeys(new Set(Object.keys(idx.byDateKey)));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentStreak = computeCurrentStreak({ todayKey, completedKeys: completionKeys });

  const [top, setTop] = React.useState<DailyLeaderboardRow[]>([]);
  const [topStatus, setTopStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  React.useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    let cancelled = false;
    void (async () => {
      setTopStatus('loading');
      const res = await getDailyTop100({ utcDate: todayKey, tab: 'score' });
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
  }, [activeTab, todayKey]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ] as const;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

  return (
    <MakeScreen scroll={false} style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <MakeButton
              title=""
              accessibilityLabel="Back"
              variant="secondary"
              onPress={onBack}
              leftIcon={<ArrowLeft width={20} height={20} color={makeTheme.text.primary} />}
              contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
            />
            <View>
              <MakeText style={{ fontSize: 26 }} weight="bold">
                Daily Challenges
              </MakeText>
              <MakeText tone="secondary">Complete daily challenges to build your streak</MakeText>
            </View>
          </View>

          <MakeCard style={{ borderRadius: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Flame width={18} height={18} color="#f97316" />
              <MakeText weight="semibold">{currentStreak} Day Streak</MakeText>
            </View>
          </MakeCard>
        </View>

        {/* Tabs */}
        <MakeCard style={{ borderRadius: 14, marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 8, padding: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calendar tab"
              onPress={() => setActiveTab('calendar')}
              style={{
                flex: 1,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: activeTab === 'calendar' ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Calendar width={18} height={18} color={makeTheme.text.primary} />
                <MakeText weight="semibold">Calendar</MakeText>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leaderboard tab"
              onPress={() => setActiveTab('leaderboard')}
              style={{
                flex: 1,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: activeTab === 'leaderboard' ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Trophy width={18} height={18} color={makeTheme.text.primary} />
                <MakeText weight="semibold">Leaderboard</MakeText>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stats tab"
              onPress={() => setActiveTab('stats')}
              style={{
                flex: 1,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: activeTab === 'stats' ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <TrendingUp width={18} height={18} color={makeTheme.text.primary} />
                <MakeText weight="semibold">Stats</MakeText>
              </View>
            </Pressable>
          </View>
        </MakeCard>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'calendar' ? (
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16 }}>
                <View style={{ marginBottom: 12 }}>
                  <MakeText style={{ fontSize: 22 }} weight="bold">
                    {monthNames[calendar.month0]} {calendar.year}
                  </MakeText>
                  <MakeText tone="secondary">Tap a past or current day to play or view.</MakeText>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  {dayNames.map((d) => (
                    <View key={d} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 6 }}>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        {d}
                      </MakeText>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {calendar.slots.map((slot, idx) => {
                    if (slot.kind === 'blank') {
                      return <View key={`b-${idx}`} style={{ width: '14.28%', aspectRatio: 1, padding: 4 }} />;
                    }
                    const isFuture = slot.dateKey > todayKey;
                    const isToday = slot.dateKey === todayKey;
                    const completed = completionKeys.has(slot.dateKey);
                    const disabled = isFuture;

                    const bg = isToday
                      ? makeTheme.button.primaryGradient[0]
                      : completed
                        ? 'rgba(34,197,94,0.20)'
                        : makeTheme.card.background;
                    const borderColor = makeTheme.card.border;

                    return (
                      <View key={slot.dateKey} style={{ width: '14.28%', aspectRatio: 1, padding: 4 }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Day ${slot.dayOfMonth}${isToday ? ', today' : ''}${completed ? ', completed' : ''}${isFuture ? ', locked' : ''}`}
                          disabled={disabled}
                          onPress={() => setSelectedDay({ dateKey: slot.dateKey, dayOfMonth: slot.dayOfMonth })}
                          style={({ pressed }) => ({
                            flex: 1,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor,
                            backgroundColor: bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
                          })}
                        >
                          <MakeText weight="semibold" style={{ color: isToday ? makeTheme.button.textOnPrimary : makeTheme.text.primary }}>
                            {slot.dayOfMonth}
                          </MakeText>
                          {completed ? (
                            <View style={{ position: 'absolute', top: 6, right: 6 }}>
                              <CheckCircle width={14} height={14} color="#22c55e" />
                            </View>
                          ) : null}
                          {isFuture ? (
                            <View style={{ position: 'absolute', top: 6, right: 6 }}>
                              <Lock width={14} height={14} color={makeTheme.text.muted} />
                            </View>
                          ) : null}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </MakeCard>
          ) : null}

          {activeTab === 'leaderboard' ? (
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16, gap: 10 }}>
                <View>
                  <MakeText style={{ fontSize: 22 }} weight="bold">
                    Today’s Leaderboard
                  </MakeText>
                  <MakeText tone="secondary">Top scores for {todayKey} (score tab)</MakeText>
                </View>

                {topStatus === 'loading' ? <MakeText tone="muted">Loading…</MakeText> : null}
                {topStatus === 'error' ? <MakeText tone="muted">Failed to load.</MakeText> : null}

                {topStatus === 'idle' ? (
                  <View style={{ gap: 8 }}>
                    {top.slice(0, 10).map((r) => (
                      <View
                        key={`${r.utc_date}-${r.rank}`}
                        style={{
                          borderRadius: 14,
                          borderWidth: 1,
                        borderColor: makeTheme.card.border,
                        backgroundColor: makeTheme.card.background,
                          padding: 12,
                        }}
                      >
                        <MakeText weight="semibold">
                          {r.rank}. {r.display_name}
                        </MakeText>
                        <MakeText tone="secondary">
                          Score {formatMs(r.score_ms)} · Time {formatMs(r.raw_time_ms)} · Mistakes {r.mistakes_count} · Hints {r.hints_used_count}
                        </MakeText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </MakeCard>
          ) : null}

          {activeTab === 'stats' ? (
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16, gap: 10 }}>
                <MakeText style={{ fontSize: 22 }} weight="bold">
                  Stats
                </MakeText>
                <MakeText tone="secondary">
                  Daily streak is computed from local completion index; other stats will be mapped once the product contract is defined.
                </MakeText>
                <MakeText tone="muted">Current streak: {currentStreak} days</MakeText>
                <MakeText tone="muted">Other daily stats: disabled (design/data gap)</MakeText>
              </View>
            </MakeCard>
          ) : null}
        </View>

        {/* Day Detail Modal */}
        {selectedDay ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close day details"
            onPress={() => setSelectedDay(null)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.50)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <Pressable accessibilityRole="none" onPress={() => {}} style={{ width: '100%', maxWidth: 420 }}>
              <MakeCard style={{ borderRadius: 18 }}>
                <View style={{ padding: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MakeText style={{ fontSize: 18 }} weight="bold">
                      {monthNames[calendar.month0]} {selectedDay.dayOfMonth}
                    </MakeText>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSelectedDay(null)} style={{ padding: 6 }}>
                      <X width={18} height={18} color={makeTheme.text.muted} />
                    </Pressable>
                  </View>

                  {completionKeys.has(selectedDay.dateKey) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle width={18} height={18} color="#22c55e" />
                      <MakeText weight="semibold">Completed</MakeText>
                    </View>
                  ) : (
                    <MakeText tone="secondary">Not completed</MakeText>
                  )}

                  <MakeButton
                    title={selectedDay.dateKey === todayKey ? 'Play Today' : 'Play This Day'}
                    onPress={() => {
                      const key = selectedDay.dateKey;
                      setSelectedDay(null);
                      onStartDaily(key);
                    }}
                  />
                  <MakeButton title="Close" variant="secondary" onPress={() => setSelectedDay(null)} />
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Note: date keys are UTC-based.
                  </MakeText>
                </View>
              </MakeCard>
            </Pressable>
          </Pressable>
        ) : null}
      </View>
    </MakeScreen>
  );
}


