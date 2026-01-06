import React from 'react';
import { Animated, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Flame, Lock, Play, Trophy } from 'lucide-react-native';
import { nowUtcDateKey, type Difficulty } from '@cynnix-studios/sudoku-core';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { readCachedDaily } from '../../services/daily';
import { addMonths, buildDailyCalendarMonth, monthFromUtcDateKey, type CalendarMonth } from '../../services/dailyCalendarModel';
import { loadDailyByDateKey } from '../../services/daily';
import { readDailyCompletionIndex } from '../../services/dailyCompletion';
import { getSettingsToggles } from '../../services/settingsModel';
import { useSettingsStore } from '../../state/useSettingsStore';

export function UltimateDailyChallengesScreen({
  username: _username,
  onBack,
  onPlayDaily,
}: {
  username: string;
  onBack: () => void;
  onPlayDaily: (dateKey: string) => void | Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const isSm = width >= 640;
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const { theme: makeTheme, reducedMotion } = useMakeTheme();

  const settings = useSettingsStore((s) => s.settings);
  const toggles = settings ? getSettingsToggles(settings) : null;
  const zenModeEnabled = !!toggles?.zenMode;

  const todayKey = nowUtcDateKey(Date.now());
  const todayDate = new Date(`${todayKey}T00:00:00.000Z`);

  const availableDateKeys = React.useMemo(() => {
    // Make parity: month navigation is bounded by "30 days ago, rounded down to month start".
    // (This can include a few extra days beyond exactly 30.)
    const today = new Date(`${todayKey}T00:00:00.000Z`);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = new Date(Date.UTC(thirtyDaysAgo.getUTCFullYear(), thirtyDaysAgo.getUTCMonth(), 1, 0, 0, 0, 0));
    const keys: string[] = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= today.getTime()) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    // Most-recent-first (expected by `buildDailyCalendarMonth` bounds logic).
    keys.reverse();
    return keys;
  }, [todayKey]);
  const availableKeySet = React.useMemo(() => new Set(availableDateKeys), [availableDateKeys]);
  const [selectedMonth, setSelectedMonth] = React.useState<CalendarMonth>(() => monthFromUtcDateKey(todayKey));

  const [completionIndex, setCompletionIndex] = React.useState<Awaited<ReturnType<typeof import('../../services/dailyCompletion').readDailyCompletionIndex>> | null>(
    null,
  );
  const [completedKeys, setCompletedKeys] = React.useState<Set<string>>(new Set());

  const [difficultyByDateKey, setDifficultyByDateKey] = React.useState<Record<string, Difficulty | undefined>>({});

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;
    let cancelled = false;
    void (async () => {
      const idx = await readDailyCompletionIndex();
      if (cancelled) return;
      setCompletionIndex(idx);
      setCompletedKeys(new Set(Object.keys(idx.byDateKey)));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Best-effort: pull difficulty from cached daily payloads (no network). This enables Make parity
  // for difficulty dots/tooltips and the Today difficulty pill when we have data.
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;
    let cancelled = false;
    void (async () => {
      const map: Record<string, Difficulty | undefined> = {};
      for (const k of availableDateKeys) {
        const cached = await readCachedDaily(k);
        if (!cached) continue;
        map[k] = cached.difficulty;
      }
      if (cancelled) return;
      setDifficultyByDateKey(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [availableDateKeys]);

  // If today's difficulty isn't cached yet, fetch it (best-effort) so the UI doesn't look "missing".
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;
    if (difficultyByDateKey[todayKey]) return;
    let cancelled = false;
    void (async () => {
      const res = await loadDailyByDateKey(todayKey);
      if (cancelled) return;
      if (!res.ok) return;
      setDifficultyByDateKey((prev) => ({ ...prev, [todayKey]: res.payload.difficulty }));
    })();
    return () => {
      cancelled = true;
    };
  }, [difficultyByDateKey, todayKey]);

  // Make parity: streak counts consecutive completed days ending yesterday (today doesn't count until completed).
  const currentStreak = React.useMemo(() => {
    let streak = 0;
    const cursor = new Date(`${todayKey}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!completedKeys.has(key)) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }, [completedKeys, todayKey]);

  const monthPrefix = `${todayKey.slice(0, 7)}-`;
  const completedThisMonth = React.useMemo(() => {
    let n = 0;
    for (const k of completedKeys) if (k.startsWith(monthPrefix)) n++;
    return n;
  }, [completedKeys, monthPrefix]);

  const daysInThisMonth = React.useMemo(() => {
    return new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 0)).getUTCDate();
  }, [todayDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
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

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function difficultyColors(difficulty: Difficulty) {
    if (difficulty === 'novice') return { bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.30)', text: '#4ade80', dot: '#4ade80' };
    if (difficulty === 'skilled') return { bg: 'rgba(59,130,246,0.20)', border: 'rgba(59,130,246,0.30)', text: '#60a5fa', dot: '#60a5fa' };
    if (difficulty === 'advanced') return { bg: 'rgba(234,179,8,0.20)', border: 'rgba(234,179,8,0.30)', text: '#facc15', dot: '#facc15' };
    if (difficulty === 'expert') return { bg: 'rgba(249,115,22,0.20)', border: 'rgba(249,115,22,0.30)', text: '#fb923c', dot: '#fb923c' };
    if (difficulty === 'fiendish') return { bg: 'rgba(239,68,68,0.20)', border: 'rgba(239,68,68,0.30)', text: '#f87171', dot: '#f87171' };
    return { bg: 'rgba(168,85,247,0.20)', border: 'rgba(168,85,247,0.30)', text: '#c084fc', dot: '#c084fc' };
  }

  function difficultyLabel(difficulty: Difficulty): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  // Week view: last 6 days + today (UTC)
  const rolling7 = React.useMemo(() => {
    const out: Array<{ dateKey: string; dayOfMonth: number; dow: number; isToday: boolean; completed: boolean; selectable: boolean }> = [];
    const cursor = new Date(`${todayKey}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 6);
    for (let i = 0; i < 7; i++) {
      const key = cursor.toISOString().slice(0, 10);
      out.push({
        dateKey: key,
        dayOfMonth: cursor.getUTCDate(),
        dow: cursor.getUTCDay(),
        isToday: key === todayKey,
        completed: completedKeys.has(key),
        selectable: availableKeySet.has(key),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }, [availableKeySet, completedKeys, todayKey]);

  const calendar = React.useMemo(() => {
    return buildDailyCalendarMonth({
      month: selectedMonth,
      todayKey,
      availableDateKeys,
      completedDateKeys: completedKeys,
      difficultyByDateKey,
    });
  }, [availableDateKeys, completedKeys, difficultyByDateKey, selectedMonth, todayKey]);

  // Make parity: difficulty dots should show for visible days (week + current calendar month) even on first load.
  // Prefetch missing daily payloads in the background and update `difficultyByDateKey` as results come in.
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;

    const inFlight = new Set<string>();
    let cancelled = false;

    const visibleKeys = new Set<string>();
    for (const d of rolling7) {
      // Include all visible week tiles (past/today/future); future will be locked but should still show difficulty.
      visibleKeys.add(d.dateKey);
    }
    for (const cell of calendar.cells) {
      if (cell.kind !== 'date') continue;
      // Skip out-of-window archive days; include future locked days.
      if (cell.status === 'out_of_window') continue;
      visibleKeys.add(cell.dateKey);
    }

    const missing = [...visibleKeys].filter((k) => !difficultyByDateKey[k]);
    if (missing.length === 0) return;

    const MAX_CONCURRENCY = 3;
    const queue = missing.slice(0, 14); // bound per render; remaining will get picked up next render

    const worker = async () => {
      while (!cancelled) {
        const next = queue.shift();
        if (!next) return;
        if (inFlight.has(next)) continue;
        inFlight.add(next);
        try {
          const res = await loadDailyByDateKey(next);
          if (cancelled) return;
          if (res.ok) {
            setDifficultyByDateKey((prev) => {
              if (prev[next]) return prev;
              return { ...prev, [next]: res.payload.difficulty };
            });
          }
        } finally {
          inFlight.delete(next);
        }
      }
    };

    void Promise.allSettled(Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () => worker()));

    return () => {
      cancelled = true;
    };
  }, [availableKeySet, calendar, difficultyByDateKey, rolling7, todayKey]);

  const todayCompleted = Boolean(completionIndex?.byDateKey?.[todayKey]);
  const todayMeta = completionIndex?.byDateKey?.[todayKey] ?? null;
  const todayDifficulty = difficultyByDateKey[todayKey] ?? null;

  const bestTimeSeconds = React.useMemo(() => {
    const by = completionIndex?.byDateKey ?? null;
    if (!by) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (const v of Object.values(by)) {
      if (!v || typeof v !== 'object') continue;
      const raw = (v as { rawTimeMs?: unknown }).rawTimeMs;
      if (typeof raw !== 'number') continue;
      if (raw > 0 && raw < best) best = raw;
    }
    if (!Number.isFinite(best)) return 0;
    return Math.floor(best / 1000);
  }, [completionIndex]);
  const todayScore = typeof todayMeta?.scoreMs === 'number' ? Math.round(todayMeta.scoreMs / 1000) : 0;
  const todayMistakes = typeof todayMeta?.mistakesCount === 'number' ? todayMeta.mistakesCount : 0;
  const todayTimeSeconds = typeof todayMeta?.rawTimeMs === 'number' ? Math.floor(todayMeta.rawTimeMs / 1000) : 0;

  // Make: today tiles use `animate-pulse` (~3s). This is closer to an opacity pulse than a scale pulse.
  const pulseOpacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (reducedMotion) return;
    // Make `animate-pulse` is an opacity pulse; keep it subtle.
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulseOpacity, { toValue: 0.78, duration: 1500, useNativeDriver: false }),
      Animated.timing(pulseOpacity, { toValue: 1, duration: 1500, useNativeDriver: false }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [pulseOpacity, reducedMotion]);

  function CountdownTimer() {
    const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 });

    React.useEffect(() => {
      const update = () => {
        const now = new Date();
        const next = new Date(now);
        // Next UTC midnight (Make uses local midnight, but our daily keys are UTC).
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(0, 0, 0, 0);
        const diff = Math.max(0, next.getTime() - now.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      };
      update();
      const t = setInterval(update, 1000);
      return () => clearInterval(t);
    }, []);

    return (
      <View style={{ alignItems: 'center', gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Clock width={14} height={14} color={makeTheme.text.muted} />
          <MakeText tone="muted" style={{ fontSize: 12 }}>
            Next in
          </MakeText>
        </View>
        <MakeText tone="muted" style={{ fontSize: 12 }}>
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </MakeText>
      </View>
    );
  }

  return (
    <MakeScreen scroll={false} style={{ paddingVertical: isMd ? 24 : 16 }}>
      {/* Make: max-w-2xl (672), px-4 (16), py-4/md:py-6 */}
      <View style={{ flex: 1, width: '100%', maxWidth: 672, alignSelf: 'center', paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <MakeButton
            onPress={onBack}
            title=""
            accessibilityLabel="Back"
            variant="secondary"
            elevation="flat"
            radius={12}
            leftIcon={<ArrowLeft width={20} height={20} color={makeTheme.text.primary} />}
            contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
          />
          <View>
            <MakeText accessibilityRole="header" style={{ fontSize: isMd ? 30 : 24 }} weight="bold">
              Daily Challenge
            </MakeText>
          </View>
        </View>

        {/* Make: space-y-4 + pb-4 */}
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }} style={{ flex: 1 }}>
          {/* Stats Row (Make) */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(
              [
              { key: 'streak', icon: Flame, iconColor: '#f97316', value: String(currentStreak), label: 'Streak' },
              { key: 'month', icon: Calendar, iconColor: makeTheme.accent, value: `${completedThisMonth}/${daysInThisMonth}`, label: 'Month' },
              ...(zenModeEnabled ? [] : [{ key: 'best', icon: Clock, iconColor: makeTheme.accent, value: bestTimeSeconds > 0 ? formatTime(bestTimeSeconds) : '--', label: 'Best' }]),
              { key: 'total', icon: Trophy, iconColor: makeTheme.accent, value: String(completedKeys.size), label: 'Total' },
              ] as const
            ).map((s) => {
              const Icon = s.icon;
              return (
                <MakeCard key={s.key} style={{ borderRadius: 12, flex: 1 }}>
                  <View style={{ padding: 12, alignItems: 'center', gap: 4 }}>
                    <Icon width={20} height={20} color={s.iconColor} />
                    <MakeText style={{ fontSize: 20 }} weight="bold">
                      {s.value}
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      {s.label}
                    </MakeText>
                  </View>
                </MakeCard>
              );
            })}
          </View>

          {/* Today's Challenge Card (Make) */}
          <MakeCard style={{ borderRadius: 16, marginBottom: 16 }}>
            {todayCompleted ? (
              // Make completed state: p-8, space-y-6
              <View style={{ padding: 32, alignItems: 'center', gap: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle width={28} height={28} color="#22c55e" />
                  <MakeText style={{ fontSize: 24 }} weight="bold">
                    Challenge Complete!
                  </MakeText>
                </View>

                {zenModeEnabled ? null : (
                  // Make: inner rounded-xl p-5
                  <MakeCard style={{ borderRadius: 12, width: '100%' }}>
                    <View style={{ padding: 20 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 24 }}>
                        {[
                          { label: 'Time', value: todayTimeSeconds > 0 ? formatTime(todayTimeSeconds) : '--' },
                          { label: 'Score', value: todayScore > 0 ? String(todayScore) : '--' },
                          { label: 'Mistakes', value: todayTimeSeconds > 0 ? String(todayMistakes) : '--' },
                        ].map((x) => (
                          <View key={x.label} style={{ alignItems: 'center', flex: 1 }}>
                            <MakeText tone="muted" style={{ fontSize: 12 }}>
                              {x.label}
                            </MakeText>
                            <MakeText style={{ fontSize: 24 }} weight="bold">
                              {x.value}
                            </MakeText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </MakeCard>
                )}

                <MakeButton
                  title="Play Again"
                  accessibilityLabel="Play Again"
                  variant="secondary"
                  elevation="flat"
                  radius={12}
                  onPress={() => void onPlayDaily(todayKey)}
                  contentStyle={{ paddingVertical: 12, paddingHorizontal: 18 }}
                />

                <CountdownTimer />
              </View>
            ) : (
              // Make play-now state: p-4 md:p-6 md:px-8 lg:px-10
              <View
                style={{
                  paddingVertical: isMd ? 24 : 16,
                  paddingHorizontal: isLg ? 40 : isMd ? 32 : 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMd ? 24 : isSm ? 12 : 8 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <MakeText tone="muted" style={{ fontSize: isSm ? 12 : 10, letterSpacing: 1 }}>
                      Today
                    </MakeText>
                    <MakeText style={{ fontSize: isMd ? 30 : isSm ? 24 : 20 }} weight="bold">
                      {monthNames[todayDate.getUTCMonth()]} {todayDate.getUTCDate()}
                    </MakeText>
                    {todayDifficulty ? (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 10,
                          paddingVertical: 2,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: difficultyColors(todayDifficulty).border,
                          backgroundColor: difficultyColors(todayDifficulty).bg,
                        }}
                      >
                        <MakeText style={{ fontSize: isMd ? 14 : isSm ? 12 : 10, color: difficultyColors(todayDifficulty).text }}>
                          {difficultyLabel(todayDifficulty)}
                        </MakeText>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Play today"
                      onPress={() => void onPlayDaily(todayKey)}
                      style={(state) => {
                        const hovered =
                          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                        const showHover = Platform.OS === 'web' && hovered && !state.pressed;
                        return {
                          width: isMd ? 144 : isSm ? 112 : 96,
                          height: isMd ? 144 : isSm ? 112 : 96,
                          borderRadius: 999,
                          overflow: 'hidden',
                          opacity: state.pressed ? 0.92 : 1,
                          ...(Platform.OS === 'web'
                            ? ({
                                transform: showHover ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: showHover
                                  ? '0 0 34px rgba(139, 92, 246, 0.34), 0 10px 30px rgba(0, 0, 0, 0.32)'
                                  : '0 0 30px rgba(139, 92, 246, 0.30), 0 8px 25px rgba(0, 0, 0, 0.30)',
                                transition: reducedMotion ? 'none' : 'transform 250ms ease, box-shadow 250ms ease, opacity 150ms ease',
                              } as unknown as object)
                            : null),
                        };
                      }}
                    >
                      {(state) => {
                        const hovered =
                          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                        const showHover = Platform.OS === 'web' && hovered && !state.pressed;
                        return (
                          // Make: the big CTA does NOT pulse; it DOES hover (color + subtle scale/shadow).
                          <LinearGradient
                            colors={showHover ? makeTheme.button.primaryGradientHover : makeTheme.button.primaryGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Play
                              width={isMd ? 48 : isSm ? 40 : 32}
                              height={isMd ? 48 : isSm ? 40 : 32}
                              color={makeTheme.button.textOnPrimary}
                            />
                          </LinearGradient>
                        );
                      }}
                    </Pressable>
                    <CountdownTimer />
                  </View>
                </View>
              </View>
            )}
          </MakeCard>

          {/* This Week */}
          <MakeCard style={{ borderRadius: 16, marginBottom: 16, overflow: 'visible' }}>
            <View style={{ padding: isMd ? 20 : 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMd ? 16 : 12 }}>
                <MakeText style={{ fontSize: isMd ? 18 : 16 }} weight="bold">
                  This Week
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  Tap to play
                </MakeText>
              </View>

              <View style={{ flexDirection: 'row', gap: isMd ? 8 : 6 }}>
                {rolling7.map((d) => {
                  const disabled = d.dateKey > todayKey || !d.selectable;
                  const difficulty = difficultyByDateKey[d.dateKey] ?? null;
                  return (
                    <View key={d.dateKey} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <MakeText tone="muted" style={{ fontSize: isMd ? 12 : 10 }}>
                        {dayNames[d.dow]}
                      </MakeText>
                      <View style={{ width: '100%', aspectRatio: 1, position: 'relative' }}>
                        <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Day ${d.dayOfMonth}${d.isToday ? ', today' : ''}${d.completed ? ', completed' : ''}`}
                        disabled={disabled}
                        onPress={() => void onPlayDaily(d.dateKey)}
                        style={(state) => {
                          const hovered =
                            Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                          const showHover = Platform.OS === 'web' && hovered && !disabled;
                          const completedRing = d.completed && !d.isToday;
                          const ringShadow = completedRing ? '0 0 0 2px rgba(34,197,94,0.25)' : 'none';
                          const ringShadowHover = completedRing ? '0 0 0 3px rgba(34,197,94,0.35)' : ringShadow;
                          const todayShadow = d.isToday ? '0 12px 32px rgba(0,0,0,0.25)' : 'none';
                          const todayShadowHover = d.isToday ? '0 18px 44px rgba(0,0,0,0.28)' : todayShadow;
                          const bg =
                            !d.isToday && showHover
                              ? makeTheme.card.hoverBackground
                              : d.isToday
                                ? 'transparent'
                                : makeTheme.card.background;

                          return {
                            width: '100%',
                            height: '100%',
                          borderRadius: 12,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: makeTheme.card.border,
                          backgroundColor: bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: disabled ? 0.35 : state.pressed ? 0.92 : 1,
                          ...(Platform.OS === 'web'
                            ? ({
                                  // Make: today cells hover ~scale-105, others hover ~scale-105.
                                  transform: showHover ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: showHover ? `${ringShadowHover}${d.isToday ? `, ${todayShadowHover}` : ''}` : `${ringShadow}${d.isToday ? `, ${todayShadow}` : ''}`,
                                transition: reducedMotion
                                  ? 'none'
                                  : 'transform 200ms ease, opacity 150ms ease, box-shadow 200ms ease, background-color 200ms ease',
                              } as unknown as object)
                            : null),
                        };
                        }}
                      >
                        {(state) => {
                          const hovered =
                            Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                          const showHover = Platform.OS === 'web' && hovered && !disabled;
                          return (
                            <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                              {d.isToday ? (
                                <Animated.View style={{ position: 'absolute', inset: 0, opacity: pulseOpacity }}>
                                  <LinearGradient
                                    colors={makeTheme.button.primaryGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                  />
                                </Animated.View>
                              ) : null}
                              <MakeText
                                weight="semibold"
                                style={{ color: d.isToday ? makeTheme.button.textOnPrimary : makeTheme.text.primary, fontSize: 14 }}
                              >
                                {d.dayOfMonth}
                              </MakeText>
                              {d.isToday ? (
                                <MakeText
                                  style={{
                                    fontSize: 10,
                                    marginTop: 2,
                                    color: makeTheme.button.textOnPrimary,
                                    opacity: 0.75,
                                  }}
                                >
                                  Today
                                </MakeText>
                              ) : null}
                              {d.completed ? (
                                <View style={{ position: 'absolute', top: 4, right: 4 }}>
                                  <CheckCircle width={14} height={14} color={d.isToday ? makeTheme.button.textOnPrimary : '#22c55e'} />
                                </View>
                              ) : null}
                              {difficulty ? (
                                <>
                                  <View
                                    style={{
                                      position: 'absolute',
                                      bottom: 6,
                                      width: 6,
                                      height: 6,
                                      borderRadius: 999,
                                      backgroundColor: difficultyColors(difficulty).dot,
                                    }}
                                  />
                                  {showHover ? (
                                    <View
                                      pointerEvents="none"
                                      style={{
                                        position: 'absolute',
                                        bottom: -30,
                                        left: '50%',
                                        transform: [{ translateX: -1 }],
                                        ...(Platform.OS === 'web'
                                          ? ({ transform: 'translateX(-50%)' } as unknown as object)
                                          : null),
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.20)',
                                        backgroundColor: 'rgba(0,0,0,0.90)',
                                        zIndex: 10,
                                      }}
                                    >
                                      <MakeText style={{ fontSize: 11, color: '#ffffff' }}>{difficultyLabel(difficulty)}</MakeText>
                                    </View>
                                  ) : null}
                                </>
                              ) : null}
                            </View>
                          );
                        }}
                      </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </MakeCard>

          {/* Full Calendar (Make: always visible) */}
          <MakeCard style={{ borderRadius: 16, overflow: 'visible' }}>
            <View style={{ padding: isMd ? 20 : 16 }}>
              {/* Month header with navigation (Make) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                <MakeButton
                  title=""
                  accessibilityLabel="Previous month"
                  variant="secondary"
                  elevation="flat"
                  disabled={!calendar.canGoPrev}
                  onPress={calendar.canGoPrev ? () => setSelectedMonth((m) => addMonths(m, -1)) : undefined}
                  leftIcon={<ChevronLeft width={16} height={16} color={makeTheme.text.primary} />}
                  contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
                />

                <MakeText weight="bold">
                  {monthNames[calendar.month.month - 1]} {calendar.month.year}
                </MakeText>

                <MakeButton
                  title=""
                  accessibilityLabel="Next month"
                  variant="secondary"
                  elevation="flat"
                  disabled={!calendar.canGoNext}
                  onPress={calendar.canGoNext ? () => setSelectedMonth((m) => addMonths(m, +1)) : undefined}
                  leftIcon={<ChevronRight width={16} height={16} color={makeTheme.text.primary} />}
                  contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
                />
              </View>

              {/* Day headers */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {dayNames.map((d) => (
                  <View key={d} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 6 }}>
                    <MakeText tone="muted" style={{ fontSize: 11 }}>
                      {d}
                    </MakeText>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {calendar.cells.map((cell, idx) => {
                  if (cell.kind === 'empty')
                    return <View key={`b-${idx}`} style={{ width: '14.28%', aspectRatio: 1, padding: isMd ? 3 : 2 }} />;

                  const disabled = !cell.selectable;
                  const isToday = cell.dateKey === todayKey;
                  const completion = cell.completion;
                  const difficulty = cell.difficulty;

                  // Match Make variants: today pulses and has gradient; completed keeps card bg + green ring; missed keeps card bg.
                  const baseBg = isToday ? 'transparent' : makeTheme.card.background;

                  return (
                    <View key={cell.dateKey} style={{ width: '14.28%', aspectRatio: 1, padding: isMd ? 3 : 2 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Day ${cell.day}${isToday ? ', today' : ''}${completion === 'completed' ? ', completed' : ''}${
                          cell.status === 'future' ? ', locked' : ''
                        }`}
                        disabled={disabled}
                        onPress={() => void onPlayDaily(cell.dateKey)}
                        style={(state) => {
                          const hovered =
                            Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                          const showHover = Platform.OS === 'web' && hovered && !disabled;
                          const hoverScale = isToday ? 1.1 : 1.1;
                          const completedRing = completion === 'completed' && !isToday;
                          const todayRing = isToday;
                          const ringShadow = completedRing
                            ? '0 0 0 2px rgba(34,197,94,0.25)'
                            : todayRing
                              ? '0 0 0 2px rgba(255,255,255,0.20)'
                              : 'none';
                          const ringShadowHover = completedRing
                            ? '0 0 0 3px rgba(34,197,94,0.35)'
                            : todayRing
                              ? '0 0 0 3px rgba(255,255,255,0.26)'
                              : ringShadow;
                          const todayShadow = isToday ? '0 12px 32px rgba(0,0,0,0.25)' : 'none';
                          const todayShadowHover = isToday ? '0 18px 44px rgba(0,0,0,0.28)' : todayShadow;
                          const bg =
                            !isToday && showHover
                              ? makeTheme.card.hoverBackground
                              : baseBg;
                          return {
                            flex: 1,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: makeTheme.card.border,
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: bg,
                            opacity: disabled ? 0.3 : state.pressed ? 0.92 : 1,
                            ...(Platform.OS === 'web'
                              ? ({
                                  transform: showHover ? `scale(${hoverScale})` : 'scale(1)',
                                  boxShadow: showHover ? `${ringShadowHover}${isToday ? `, ${todayShadowHover}` : ''}` : `${ringShadow}${isToday ? `, ${todayShadow}` : ''}`,
                                  transition: reducedMotion ? 'none' : 'transform 200ms ease, opacity 150ms ease, box-shadow 200ms ease, background-color 200ms ease',
                                } as unknown as object)
                              : null),
                          };
                        }}
                      >
                        {(state) => {
                          const hovered =
                            Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                          const showHover = Platform.OS === 'web' && hovered && !disabled;

                          return (
                            <>
                              {isToday ? (
                                <Animated.View style={{ position: 'absolute', inset: 0, opacity: pulseOpacity }}>
                                  <LinearGradient
                                    colors={showHover ? makeTheme.button.primaryGradientHover : makeTheme.button.primaryGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                  />
                                </Animated.View>
                              ) : null}

                              <MakeText
                                weight="semibold"
                                style={{ color: isToday ? makeTheme.button.textOnPrimary : makeTheme.text.primary, fontSize: 13 }}
                              >
                                {cell.day}
                              </MakeText>

                              {completion === 'completed' ? (
                                <View style={{ position: 'absolute', top: 4, right: 4 }}>
                                  <CheckCircle width={14} height={14} color={isToday ? makeTheme.button.textOnPrimary : '#22c55e'} />
                                </View>
                              ) : null}

                              {cell.status === 'future' ? (
                                <View style={{ position: 'absolute', top: 4, right: 4 }}>
                                  <Lock width={14} height={14} color={makeTheme.text.muted} />
                                </View>
                              ) : null}

                              {difficulty ? (
                                <>
                                  <View
                                    style={{
                                      position: 'absolute',
                                      bottom: 6,
                                      width: 6,
                                      height: 6,
                                      borderRadius: 999,
                                      backgroundColor: difficultyColors(difficulty).dot,
                                    }}
                                  />
                                  {showHover ? (
                                    <View
                                      pointerEvents="none"
                                      style={{
                                        position: 'absolute',
                                        bottom: -30,
                                        left: '50%',
                                        ...(Platform.OS === 'web'
                                          ? ({ transform: 'translateX(-50%)' } as unknown as object)
                                          : null),
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.20)',
                                        backgroundColor: 'rgba(0,0,0,0.90)',
                                        zIndex: 10,
                                      }}
                                    >
                                      <MakeText style={{ fontSize: 11, color: '#ffffff' }}>{difficultyLabel(difficulty)}</MakeText>
                                    </View>
                                  ) : null}
                                </>
                              ) : null}
                            </>
                          );
                        }}
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              <MakeText tone="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                Tap past days to play as archive (won&apos;t affect streak)
              </MakeText>
            </View>
          </MakeCard>
        </ScrollView>
      </View>
    </MakeScreen>
  );
}