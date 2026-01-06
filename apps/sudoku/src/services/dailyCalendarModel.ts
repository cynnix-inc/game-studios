import type { Difficulty } from '@cynnix-studios/sudoku-core';

export type CalendarMonth = {
  year: number; // UTC year
  month: number; // 1-12 (UTC)
};

export type CalendarDayStatus = 'available' | 'out_of_window' | 'future';
export type CalendarCompletionStatus = 'none' | 'completed' | 'missed';

export type CalendarCell =
  | { kind: 'empty' }
  | {
      kind: 'day';
      day: number; // 1..31
      dateKey: string; // YYYY-MM-DD (UTC)
      status: CalendarDayStatus;
      completion: CalendarCompletionStatus;
      selectable: boolean;
      difficulty: Difficulty | null;
    };

type MonthBounds = {
  minMonth: CalendarMonth;
  maxMonth: CalendarMonth;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function monthFromUtcDateKey(dateKey: string): CalendarMonth {
  const [y, m] = dateKey.split('-');
  return { year: Number(y), month: Number(m) };
}

export function monthKey(m: CalendarMonth): string {
  return `${m.year}-${pad2(m.month)}`;
}

export function addMonths(m: CalendarMonth, delta: number): CalendarMonth {
  const d = new Date(Date.UTC(m.year, m.month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function compareMonth(a: CalendarMonth, b: CalendarMonth): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

function daysInMonthUtc(year: number, month: number): number {
  // month is 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dateKeyForUtc(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function boundsFromAvailableKeys(args: { availableDateKeys: readonly string[]; todayKey: string }): MonthBounds {
  const { availableDateKeys, todayKey } = args;
  const max = monthFromUtcDateKey(todayKey);
  if (availableDateKeys.length === 0) return { minMonth: max, maxMonth: max };
  const minKey = availableDateKeys[availableDateKeys.length - 1]; // getLastNUtcDateKeys is most-recent first
  if (!minKey) return { minMonth: max, maxMonth: max };
  return { minMonth: monthFromUtcDateKey(minKey), maxMonth: max };
}

export function buildDailyCalendarMonth(args: {
  month: CalendarMonth;
  todayKey: string;
  availableDateKeys: readonly string[]; // last-30-days window (UTC keys)
  completedDateKeys: ReadonlySet<string>;
  difficultyByDateKey: Readonly<Record<string, Difficulty | undefined>>;
}): {
  month: CalendarMonth;
  canGoPrev: boolean;
  canGoNext: boolean;
  cells: CalendarCell[]; // length 42 (6 weeks x 7 days), Sunday-first
} {
  const bounds = boundsFromAvailableKeys({ availableDateKeys: args.availableDateKeys, todayKey: args.todayKey });
  const canGoPrev = compareMonth(args.month, bounds.minMonth) > 0;
  const canGoNext = compareMonth(args.month, bounds.maxMonth) < 0;

  const available = new Set(args.availableDateKeys);
  const days = daysInMonthUtc(args.month.year, args.month.month);
  const firstDow = new Date(Date.UTC(args.month.year, args.month.month - 1, 1)).getUTCDay(); // 0=Sun

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ kind: 'empty' });

  for (let day = 1; day <= days; day++) {
    const dateKey = dateKeyForUtc(args.month.year, args.month.month, day);
    const isFuture = dateKey > args.todayKey;
    const inWindow = available.has(dateKey);
    const status: CalendarDayStatus = isFuture ? 'future' : inWindow ? 'available' : 'out_of_window';
    const selectable = status === 'available';

    const completion: CalendarCompletionStatus = args.completedDateKeys.has(dateKey)
      ? 'completed'
      : status === 'available' && dateKey < args.todayKey
        ? 'missed'
        : 'none';

    // Make parity: difficulty can be shown for past/today/future days (even when locked),
    // but never for out-of-window days (older than the visible archive window).
    const difficulty = status === 'out_of_window' ? null : (args.difficultyByDateKey[dateKey] ?? null);

    cells.push({ kind: 'day', day, dateKey, status, selectable, completion, difficulty });
  }

  while (cells.length < 42) cells.push({ kind: 'empty' });
  return { month: args.month, canGoPrev, canGoNext, cells };
}


