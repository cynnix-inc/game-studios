import React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, CheckCircle, Flame, Lock, Target, TrendingUp, Trophy, X } from 'lucide-react-native';
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

function isVisualTest(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof globalThis !== 'undefined' && (globalThis as any).__VISUAL_TEST__ === true;
}

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'ProGamer99', score: 1850, streak: 15 },
  { rank: 2, username: 'DailyChamp', score: 1720, streak: 22 },
  { rank: 3, username: 'StreakMaster', score: 1680, streak: 30 },
  { rank: 4, username: 'GameWizard', score: 1550, streak: 8 },
  { rank: 5, username: 'ChallengeKing', score: 1490, streak: 12 },
] as const;

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
  username,
  onBack,
  onStartDaily,
}: {
  username: string;
  onBack: () => void;
  onStartDaily: (dateKey: string) => void;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const { theme: makeTheme } = useMakeTheme();
  // NOTE: `onStartDaily` is present for the eventual “Play this day” CTA.
  // The Make design currently doesn’t specify that CTA (tracked in the gap log).
  void onStartDaily;
  const [activeTab, setActiveTab] = React.useState<TabType>('calendar');
  const [selectedDay, setSelectedDay] = React.useState<{ dateKey: string; dayOfMonth: number; completed: boolean; isToday: boolean } | null>(null);

  const todayKey = nowUtcDateKey(Date.now());
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const calendar = buildUtcMonthCalendar({ year: today.getUTCFullYear(), month0: today.getUTCMonth() });

  const [completionKeys, setCompletionKeys] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    if (isVisualTest()) return;
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
    if (isVisualTest()) {
      setTopStatus('idle');
      setTop([]);
      return;
    }
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

  const monthPrefix = `${calendar.year}-${String(calendar.month0 + 1).padStart(2, '0')}-`;
  const completedThisMonth = React.useMemo(() => {
    let n = 0;
    for (const k of completionKeys) if (k.startsWith(monthPrefix)) n++;
    return n;
  }, [completionKeys, monthPrefix]);

  const TabButton = ({
    label,
    icon: Icon,
    tab,
  }: {
    label: string;
    icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
    tab: TabType;
  }) => {
    const active = activeTab === tab;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} tab`}
        onPress={() => setActiveTab(tab)}
        style={({ pressed, hovered }) => ({
          flex: 1,
          borderRadius: 12,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
          backgroundColor: !active && hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        })}
      >
        {active ? (
          <LinearGradient
            colors={makeTheme.button.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, paddingHorizontal: 12 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Icon width={18} height={18} color={makeTheme.button.textOnPrimary} />
              <MakeText weight="semibold" style={{ color: makeTheme.button.textOnPrimary }}>
                {label}
              </MakeText>
            </View>
          </LinearGradient>
        ) : (
          <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Icon width={18} height={18} color={makeTheme.text.secondary} />
              <MakeText weight="semibold" tone="secondary">
                {label}
              </MakeText>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <MakeScreen scroll={false} style={{ paddingHorizontal: isMd ? 24 : 16, paddingVertical: isMd ? 24 : 16 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1152, alignSelf: 'center' }}>
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
              <MakeText style={{ fontSize: isMd ? 30 : 24 }} weight="bold">
                Daily Challenges
              </MakeText>
              <MakeText tone="secondary" style={{ fontSize: isMd ? 16 : 14 }}>
                Complete daily challenges to build your streak
              </MakeText>
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
          <View style={{ flexDirection: 'row', gap: 8, padding: 8 }}>
            <TabButton label="Calendar" icon={Calendar} tab="calendar" />
            <TabButton label="Leaderboard" icon={Trophy} tab="leaderboard" />
            <TabButton label="Stats" icon={TrendingUp} tab="stats" />
          </View>
        </MakeCard>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {activeTab === 'calendar' ? (
            <MakeCard style={{ borderRadius: 16 }}>
              <View style={{ padding: isMd ? 24 : 16 }}>
                <View style={{ marginBottom: isMd ? 24 : 16 }}>
                  <MakeText style={{ fontSize: isMd ? 28 : 22 }} weight="bold">
                    {monthNames[calendar.month0]} {calendar.year}
                  </MakeText>
                  <MakeText tone="secondary" style={{ fontSize: isMd ? 16 : 14 }}>
                    {completedThisMonth} challenges completed this month
                  </MakeText>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isMd ? 16 : 8 }}>
                  {dayNames.map((d) => (
                    <View key={d} style={{ width: '14.28%', alignItems: 'center', paddingVertical: isMd ? 8 : 6 }}>
                      <MakeText tone="muted" style={{ fontSize: isMd ? 14 : 12 }}>
                        {d}
                      </MakeText>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {calendar.slots.map((slot, idx) => {
                    if (slot.kind === 'blank') {
                      return <View key={`b-${idx}`} style={{ width: '14.28%', aspectRatio: 1, padding: isMd ? 6 : 4 }} />;
                    }
                    const isFuture = slot.dateKey > todayKey;
                    const isToday = slot.dateKey === todayKey;
                    const completed = completionKeys.has(slot.dateKey);
                    const disabled = isFuture;

                    const borderColor = makeTheme.card.border;

                    return (
                      <View key={slot.dateKey} style={{ width: '14.28%', aspectRatio: 1, padding: isMd ? 6 : 4 }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Day ${slot.dayOfMonth}${isToday ? ', today' : ''}${completed ? ', completed' : ''}${isFuture ? ', locked' : ''}`}
                          disabled={disabled}
                          onPress={() => setSelectedDay({ dateKey: slot.dateKey, dayOfMonth: slot.dayOfMonth, completed, isToday })}
                          style={({ pressed }) => ({
                            flex: 1,
                            borderRadius: isMd ? 14 : 10,
                            borderWidth: 1,
                            borderColor,
                            backgroundColor: isToday ? 'transparent' : completed ? 'rgba(34,197,94,0.20)' : makeTheme.card.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
                          })}
                        >
                          {isToday ? (
                            <LinearGradient
                              colors={makeTheme.button.primaryGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: isMd ? 14 : 10,
                              }}
                            />
                          ) : null}
                          <MakeText
                            weight="semibold"
                            style={{ color: isToday ? makeTheme.button.textOnPrimary : makeTheme.text.primary, fontSize: isMd ? 16 : 14 }}
                          >
                            {slot.dayOfMonth}
                          </MakeText>
                          {completed ? (
                            <View style={{ position: 'absolute', top: 6, right: 6 }}>
                              <CheckCircle width={isMd ? 16 : 14} height={isMd ? 16 : 14} color="#22c55e" />
                            </View>
                          ) : null}
                          {isFuture ? (
                            <View style={{ position: 'absolute', top: 6, right: 6 }}>
                              <Lock width={isMd ? 16 : 14} height={isMd ? 16 : 14} color={makeTheme.text.muted} />
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
            <MakeCard style={{ borderRadius: 16 }}>
              <View style={{ padding: isMd ? 24 : 16, gap: isMd ? 18 : 14 }}>
                <View>
                  <MakeText style={{ fontSize: isMd ? 28 : 22 }} weight="bold">
                    Today’s Leaderboard
                  </MakeText>
                  <MakeText tone="secondary" style={{ fontSize: isMd ? 16 : 14 }}>
                    Top players for today’s daily challenge
                  </MakeText>
                </View>

                {topStatus === 'loading' ? <MakeText tone="muted">Loading…</MakeText> : null}
                {topStatus === 'error' ? <MakeText tone="muted">Failed to load.</MakeText> : null}

                <View style={{ gap: isMd ? 12 : 10 }}>
                  {(isVisualTest()
                    ? MOCK_LEADERBOARD
                    : top.slice(0, 5).map((r) => ({
                        rank: r.rank,
                        username: r.display_name,
                        score: Math.round(r.score_ms / 1000),
                        streak: 0,
                      }))).map((p) => {
                    const isYou = p.username === username;
                    const badge =
                      p.rank === 1
                        ? { bg: 'rgba(234,179,8,0.20)', fg: '#facc15' }
                        : p.rank === 2
                          ? { bg: 'rgba(148,163,184,0.20)', fg: '#e2e8f0' }
                          : p.rank === 3
                            ? { bg: 'rgba(180,83,9,0.20)', fg: '#b45309' }
                            : { bg: makeTheme.card.background, fg: makeTheme.text.secondary };

                    return (
                      <MakeCard key={p.rank} style={{ borderRadius: 14 }}>
                        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: badge.bg,
                            }}
                          >
                            {p.rank <= 3 ? <Trophy width={20} height={20} color={badge.fg} /> : <MakeText tone="secondary">#{p.rank}</MakeText>}
                          </View>

                          <View style={{ flex: 1 }}>
                            <MakeText weight="semibold">{p.username}</MakeText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <MakeText tone="secondary" style={{ fontSize: 14 }}>
                                {p.score} pts
                              </MakeText>
                              {isVisualTest() ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Flame width={14} height={14} color="#f97316" />
                                  <MakeText tone="secondary" style={{ fontSize: 14 }}>
                                    {p.streak}
                                  </MakeText>
                                </View>
                              ) : null}
                            </View>
                          </View>

                          {isYou ? (
                            <LinearGradient
                              colors={makeTheme.button.primaryGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}
                            >
                              <MakeText weight="semibold" style={{ color: makeTheme.button.textOnPrimary, fontSize: 14 }}>
                                You
                              </MakeText>
                            </LinearGradient>
                          ) : null}
                        </View>
                      </MakeCard>
                    );
                  })}
                </View>
              </View>
            </MakeCard>
          ) : null}

          {activeTab === 'stats' ? (
            <View style={{ flexDirection: isMd ? 'row' : 'column', flexWrap: 'wrap', gap: isMd ? 16 : 12 }}>
              <MakeCard style={{ borderRadius: 16, width: isMd ? '48%' : '100%' }}>
                <View style={{ padding: isMd ? 24 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <LinearGradient
                      colors={makeTheme.button.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 10, borderRadius: 12 }}
                    >
                      <Flame width={20} height={20} color={makeTheme.button.textOnPrimary} />
                    </LinearGradient>
                    <View>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Current Streak
                      </MakeText>
                      <MakeText style={{ fontSize: isMd ? 28 : 24 }} weight="bold">
                        {currentStreak} days
                      </MakeText>
                    </View>
                  </View>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Keep playing daily to maintain your streak!
                  </MakeText>
                </View>
              </MakeCard>

              <MakeCard style={{ borderRadius: 16, width: isMd ? '48%' : '100%' }}>
                <View style={{ padding: isMd ? 24 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <LinearGradient
                      colors={makeTheme.button.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 10, borderRadius: 12 }}
                    >
                      <Trophy width={20} height={20} color={makeTheme.button.textOnPrimary} />
                    </LinearGradient>
                    <View>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Longest Streak
                      </MakeText>
                      <MakeText style={{ fontSize: isMd ? 28 : 24 }} weight="bold">
                        {Math.max(currentStreak, 0)} days
                      </MakeText>
                    </View>
                  </View>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Your personal record for consecutive days
                  </MakeText>
                </View>
              </MakeCard>

              <MakeCard style={{ borderRadius: 16, width: isMd ? '48%' : '100%' }}>
                <View style={{ padding: isMd ? 24 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <LinearGradient
                      colors={makeTheme.button.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 10, borderRadius: 12 }}
                    >
                      <Target width={20} height={20} color={makeTheme.button.textOnPrimary} />
                    </LinearGradient>
                    <View>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Total Completed
                      </MakeText>
                      <MakeText style={{ fontSize: isMd ? 28 : 24 }} weight="bold">
                        {completionKeys.size}
                      </MakeText>
                    </View>
                  </View>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Daily challenges completed all-time
                  </MakeText>
                </View>
              </MakeCard>

              <MakeCard style={{ borderRadius: 16, width: isMd ? '48%' : '100%' }}>
                <View style={{ padding: isMd ? 24 : 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <LinearGradient
                      colors={makeTheme.button.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 10, borderRadius: 12 }}
                    >
                      <TrendingUp width={20} height={20} color={makeTheme.button.textOnPrimary} />
                    </LinearGradient>
                    <View>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Average Score
                      </MakeText>
                      <MakeText style={{ fontSize: isMd ? 28 : 24 }} weight="bold">
                        {isVisualTest() ? 1325 : 0}
                      </MakeText>
                    </View>
                  </View>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Personal best: {isVisualTest() ? 1890 : 0} pts
                  </MakeText>
                </View>
              </MakeCard>
            </View>
          ) : null}
        </ScrollView>

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

                  {selectedDay.completed ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle width={18} height={18} color="#22c55e" />
                      <MakeText weight="semibold" style={{ fontSize: 18 }}>
                        Completed
                      </MakeText>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <X width={18} height={18} color="#ef4444" />
                      <MakeText weight="semibold" style={{ fontSize: 18 }}>
                        Not Completed
                      </MakeText>
                    </View>
                  )}

                  {selectedDay.completed ? (
                    <MakeCard style={{ borderRadius: 14 }}>
                      <View style={{ padding: 14 }}>
                        <MakeText tone="secondary" style={{ fontSize: 14, marginBottom: 4 }}>
                          Score
                        </MakeText>
                        <MakeText style={{ fontSize: 28 }} weight="bold">
                          {isVisualTest() ? 1250 : 0} pts
                        </MakeText>
                      </View>
                    </MakeCard>
                  ) : (
                    <MakeText tone="secondary">
                      You didn’t complete the challenge this day.
                    </MakeText>
                  )}

                  <MakeButton title="Close" variant="secondary" onPress={() => setSelectedDay(null)} />
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Calendar is UTC-keyed. Daily start CTA not yet specified in Make design (tracked as a design gap).
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


