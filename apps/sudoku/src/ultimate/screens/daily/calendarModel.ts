export type CalendarSlot =
  | { kind: 'blank' }
  | { kind: 'day'; dayOfMonth: number; dateKey: string };

export function buildUtcMonthCalendar(args: {
  year: number;
  month0: number; // 0-11
}): {
  year: number;
  month0: number;
  daysInMonth: number;
  leadingBlankCount: number;
  slots: CalendarSlot[];
} {
  const first = new Date(Date.UTC(args.year, args.month0, 1));
  const leadingBlankCount = first.getUTCDay(); // 0=Sun..6=Sat
  const last = new Date(Date.UTC(args.year, args.month0 + 1, 0));
  const daysInMonth = last.getUTCDate();

  const slots: CalendarSlot[] = [];
  for (let i = 0; i < leadingBlankCount; i++) slots.push({ kind: 'blank' });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = new Date(Date.UTC(args.year, args.month0, d)).toISOString().slice(0, 10);
    slots.push({ kind: 'day', dayOfMonth: d, dateKey });
  }

  return { year: args.year, month0: args.month0, daysInMonth, leadingBlankCount, slots };
}


