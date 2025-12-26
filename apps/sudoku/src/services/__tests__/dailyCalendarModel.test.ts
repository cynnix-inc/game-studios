import { buildDailyCalendarMonth, type CalendarMonth } from '../dailyCalendarModel';

describe('dailyCalendarModel', () => {
  const dec2025: CalendarMonth = { year: 2025, month: 12 };
  const nov2025: CalendarMonth = { year: 2025, month: 11 };

  test('future days are marked future and not selectable', () => {
    const todayKey = '2025-12-22';
    const availableDateKeys = ['2025-12-22', '2025-12-21', '2025-12-20', '2025-12-19', '2025-12-18'];
    const grid = buildDailyCalendarMonth({
      month: dec2025,
      todayKey,
      availableDateKeys,
      completedDateKeys: new Set<string>(),
      difficultyByDateKey: {},
    });

    const cell23 = grid.cells.find((c) => c.kind === 'day' && c.dateKey === '2025-12-23');
    expect(cell23).toBeDefined();
    if (cell23?.kind === 'day') {
      expect(cell23.status).toBe('future');
      expect(cell23.selectable).toBe(false);
    }
  });

  test('past available days are completed or missed', () => {
    const todayKey = '2025-12-22';
    const availableDateKeys = ['2025-12-22', '2025-12-21', '2025-12-20', '2025-12-19', '2025-12-18'];
    const completed = new Set<string>(['2025-12-20']);
    const grid = buildDailyCalendarMonth({
      month: dec2025,
      todayKey,
      availableDateKeys,
      completedDateKeys: completed,
      difficultyByDateKey: {},
    });

    const completedCell = grid.cells.find((c) => c.kind === 'day' && c.dateKey === '2025-12-20');
    const missedCell = grid.cells.find((c) => c.kind === 'day' && c.dateKey === '2025-12-19');

    expect(completedCell && completedCell.kind === 'day' ? completedCell.completion : null).toBe('completed');
    expect(missedCell && missedCell.kind === 'day' ? missedCell.completion : null).toBe('missed');
  });

  test('available days surface difficulty when cached', () => {
    const todayKey = '2025-12-22';
    const availableDateKeys = ['2025-12-22', '2025-12-21'];
    const grid = buildDailyCalendarMonth({
      month: dec2025,
      todayKey,
      availableDateKeys,
      completedDateKeys: new Set<string>(),
      difficultyByDateKey: { '2025-12-22': 'advanced' },
    });

    const cell = grid.cells.find((c) => c.kind === 'day' && c.dateKey === '2025-12-22');
    expect(cell).toBeDefined();
    if (cell?.kind === 'day') {
      expect(cell.status).toBe('available');
      expect(cell.difficulty).toBe('advanced');
    }
  });

  test('month navigation is bounded by the available window months', () => {
    const todayKey = '2025-12-22';
    // Window spans Nov -> Dec
    const availableDateKeys = ['2025-12-22', '2025-12-01', '2025-11-30'];

    const dec = buildDailyCalendarMonth({
      month: dec2025,
      todayKey,
      availableDateKeys,
      completedDateKeys: new Set<string>(),
      difficultyByDateKey: {},
    });
    expect(dec.canGoNext).toBe(false);
    expect(dec.canGoPrev).toBe(true);

    const nov = buildDailyCalendarMonth({
      month: nov2025,
      todayKey,
      availableDateKeys,
      completedDateKeys: new Set<string>(),
      difficultyByDateKey: {},
    });
    expect(nov.canGoPrev).toBe(false);
    expect(nov.canGoNext).toBe(true);
  });
});


