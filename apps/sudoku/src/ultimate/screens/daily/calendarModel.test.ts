import { buildUtcMonthCalendar } from './calendarModel';

describe('buildUtcMonthCalendar', () => {
  it('creates the correct number of day slots including leading blanks', () => {
    // 2025-02-01 is a Saturday (UTC day 6). February 2025 has 28 days.
    const m = buildUtcMonthCalendar({ year: 2025, month0: 1 });
    expect(m.daysInMonth).toBe(28);
    expect(m.leadingBlankCount).toBe(6);
    expect(m.slots.length).toBe(6 + 28);
  });

  it('returns stable YYYY-MM-DD keys', () => {
    const m = buildUtcMonthCalendar({ year: 2025, month0: 11 });
    const day1 = m.slots.find((s) => s.kind === 'day' && s.dayOfMonth === 1);
    expect(day1 && day1.kind === 'day' ? day1.dateKey : null).toBe('2025-12-01');
  });
});


