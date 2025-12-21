import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';
import { getLastNUtcDateKeys, msUntilNextUtcMidnight, nowUtcDateKey } from '@cynnix-studios/sudoku-core';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { NumberPad } from '../../src/components/NumberPad';
import { SudokuGrid } from '../../src/components/SudokuGrid';

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

export default function DailyScreen() {
  const mode = usePlayerStore((s) => s.mode);
  const dailyDateKey = usePlayerStore((s) => s.dailyDateKey);
  const dailyLoad = usePlayerStore((s) => s.dailyLoad);
  const dailySource = usePlayerStore((s) => s.dailySource);

  const puzzle = usePlayerStore((s) => s.puzzle);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);

  const loadTodayDaily = usePlayerStore((s) => s.loadTodayDaily);
  const loadDaily = usePlayerStore((s) => s.loadDaily);
  const exitDailyToFreePlay = usePlayerStore((s) => s.exitDailyToFreePlay);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);

  const todayKey = nowUtcDateKey(Date.now());
  const archive = useMemo(() => getLastNUtcDateKeys(Date.now(), 30), []);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const countdown = formatCountdown(msUntilNextUtcMidnight(nowMs));

  useEffect(() => {
    void loadTodayDaily();
  }, [loadTodayDaily]);

  return (
    <Screen scroll>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Daily Sudoku
      </AppText>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText tone="muted">UTC rollover in: {countdown}</AppText>
        <AppText tone="muted">Today: {todayKey}</AppText>
        {mode === 'daily' && dailyDateKey ? <AppText tone="muted">Loaded: {dailyDateKey}</AppText> : null}
        {dailySource ? <AppText tone="muted">Source: {dailySource}</AppText> : null}
      </AppCard>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <AppButton title="Load Today" onPress={() => void loadDaily(todayKey)} />
        <AppButton title="Back to Free Play" variant="secondary" onPress={exitDailyToFreePlay} />
      </View>

      {dailyLoad.status === 'unavailable' ? (
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppText weight="semibold">Daily unavailable</AppText>
          <AppText tone="muted">
            {dailyLoad.reason === 'not_cached_offline'
              ? 'Offline and this date is not cached yet.'
              : dailyLoad.reason === 'missing_base_url'
                ? 'Missing EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL.'
                : 'Remote payload was invalid.'}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText weight="semibold">Archive (last 30 days)</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {archive.map((k) => {
            const active = mode === 'daily' && dailyDateKey === k;
            return (
              <Pressable
                key={k}
                onPress={() => void loadDaily(k)}
                accessibilityRole="button"
                accessibilityLabel={`Load Daily ${k}`}
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
                  {k.slice(5)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={{ flex: 1, marginBottom: theme.spacing.md }}>
        <AppText tone="muted">Mistakes: {mistakes}</AppText>
      </AppCard>

      <View style={{ marginBottom: theme.spacing.lg }}>
        <SudokuGrid puzzle={puzzle} givensMask={givensMask} selectedIndex={selectedIndex} onSelectCell={selectCell} />
      </View>

      <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />
    </Screen>
  );
}


