import React from 'react';
import { Pressable, View } from 'react-native';

import type { Difficulty } from '@cynnix-studios/sudoku-core';
import { AppText, theme } from '@cynnix-studios/ui';

import { readCachedDaily } from '../services/daily';
import { readDailyCompletionIndex } from '../services/dailyCompletion';
import { addMonths, buildDailyCalendarMonth, monthFromUtcDateKey, monthKey, type CalendarCell, type CalendarMonth } from '../services/dailyCalendarModel';

function monthLabel(m: CalendarMonth): string {
  const d = new Date(Date.UTC(m.year, m.month - 1, 1));
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function difficultyLabel(d: Difficulty | null): string {
  if (!d) return '';
  if (d === 'novice') return 'N';
  if (d === 'skilled') return 'S';
  if (d === 'advanced') return 'A';
  if (d === 'expert') return 'E';
  if (d === 'fiendish') return 'F';
  return 'U';
}

function CellView({
  cell,
  selectedDateKey,
  onSelect,
}: {
  cell: CalendarCell;
  selectedDateKey: string | null;
  onSelect: (dateKey: string) => void;
}) {
  if (cell.kind === 'empty') return <View style={{ width: '14.28%', aspectRatio: 1, padding: 2 }} />;

  const selected = selectedDateKey === cell.dateKey;
  const disabled = !cell.selectable;
  const bg =
    cell.status === 'future' || cell.status === 'out_of_window'
      ? theme.colors.surface2
      : selected
        ? theme.colors.accent
        : theme.colors.surface;
  const borderColor = selected ? theme.colors.accent : theme.colors.border;
  const textTone = disabled ? 'muted' : selected ? 'default' : 'default';
  const completionDot =
    cell.completion === 'completed' ? theme.colors.accent : cell.completion === 'missed' ? theme.colors.danger : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Daily ${cell.dateKey}${cell.status === 'future' ? ', future' : ''}${
        cell.completion === 'completed' ? ', completed' : cell.completion === 'missed' ? ', missed' : ''
      }`}
      disabled={disabled}
      onPress={() => onSelect(cell.dateKey)}
      style={{
        width: '14.28%',
        aspectRatio: 1,
        padding: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor,
          borderRadius: theme.radius.md,
          backgroundColor: bg,
          padding: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText tone={textTone} weight="semibold">
            {cell.day}
          </AppText>
          {completionDot ? <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: completionDot }} /> : null}
        </View>
        <View style={{ flex: 1 }} />
        {cell.status === 'available' ? (
          <AppText tone={disabled ? 'muted' : 'muted'} style={{ fontSize: 12 }}>
            {difficultyLabel(cell.difficulty)}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DailyCalendar({
  todayKey,
  selectedDateKey,
  availableDateKeys,
  onSelectDate,
  refreshToken,
}: {
  todayKey: string;
  selectedDateKey: string | null;
  availableDateKeys: string[]; // last-30-days, most-recent first
  onSelectDate: (dateKey: string) => void;
  refreshToken?: number;
}) {
  const [month, setMonth] = React.useState<CalendarMonth>(() => monthFromUtcDateKey(selectedDateKey ?? todayKey));
  const [completedDateKeys, setCompletedDateKeys] = React.useState<Set<string>>(() => new Set());
  const [difficultyByDateKey, setDifficultyByDateKey] = React.useState<Record<string, Difficulty | undefined>>({});

  // Keep visible month aligned with selection when selection jumps across months.
  React.useEffect(() => {
    setMonth(monthFromUtcDateKey(selectedDateKey ?? todayKey));
  }, [selectedDateKey, todayKey]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const idx = await readDailyCompletionIndex();
      if (cancelled) return;
      setCompletedDateKeys(new Set(Object.keys(idx.byDateKey)));
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        availableDateKeys.map(async (k) => {
          const payload = await readCachedDaily(k);
          return payload ? ([k, payload.difficulty] as const) : null;
        }),
      );
      if (cancelled) return;
      const next: Record<string, Difficulty | undefined> = {};
      for (const e of entries) {
        if (!e) continue;
        next[e[0]] = e[1];
      }
      setDifficultyByDateKey(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [availableDateKeys]);

  const grid = React.useMemo(
    () =>
      buildDailyCalendarMonth({
        month,
        todayKey,
        availableDateKeys,
        completedDateKeys,
        difficultyByDateKey,
      }),
    [availableDateKeys, completedDateKeys, difficultyByDateKey, month, todayKey],
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={!grid.canGoPrev}
          onPress={() => setMonth((m) => addMonths(m, -1))}
          style={{ paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, opacity: grid.canGoPrev ? 1 : 0.4 }}
        >
          <AppText weight="semibold">{'‹'}</AppText>
        </Pressable>

        <AppText weight="semibold">{monthLabel(month)}</AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={!grid.canGoNext}
          onPress={() => setMonth((m) => addMonths(m, 1))}
          style={{ paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, opacity: grid.canGoNext ? 1 : 0.4 }}
        >
          <AppText weight="semibold">{'›'}</AppText>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <View key={d} style={{ width: '14.28%', paddingHorizontal: 2 }}>
            <AppText tone="muted" style={{ fontSize: 12, textAlign: 'center' }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} key={monthKey(month)}>
        {grid.cells.map((cell, idx) => (
          <CellView key={cell.kind === 'day' ? cell.dateKey : `empty-${idx}`} cell={cell} selectedDateKey={selectedDateKey} onSelect={onSelectDate} />
        ))}
      </View>
    </View>
  );
}


