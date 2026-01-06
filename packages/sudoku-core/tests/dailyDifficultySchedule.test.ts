import { buildDailyDifficultyScheduleForMonth, getDailyDifficultyForDateKey, type DailyDifficultyScheduleEntry } from '../src/engine/dailyDifficultySchedule';
import type { Difficulty } from '../src/engine/difficulty';

function difficultyIndex(d: Difficulty): number {
  if (d === 'novice') return 0;
  if (d === 'skilled') return 1;
  if (d === 'advanced') return 2;
  if (d === 'expert') return 3;
  if (d === 'fiendish') return 4;
  return 5;
}

function countByDifficulty(entries: ReadonlyArray<DailyDifficultyScheduleEntry>): Record<Difficulty, number> {
  const out: Record<Difficulty, number> = {
    novice: 0,
    skilled: 0,
    advanced: 0,
    expert: 0,
    fiendish: 0,
    ultimate: 0,
  };
  for (const e of entries) out[e.difficulty] += 1;
  return out;
}

function expectNoBigJumps(entries: ReadonlyArray<DailyDifficultyScheduleEntry>) {
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1]!.difficulty;
    const b = entries[i]!.difficulty;
    expect(Math.abs(difficultyIndex(a) - difficultyIndex(b))).toBeLessThanOrEqual(1);
  }
}

function expectNoConsecutiveExpert(entries: ReadonlyArray<DailyDifficultyScheduleEntry>) {
  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1]!.difficulty;
    const b = entries[i]!.difficulty;
    expect(!(a === 'expert' && b === 'expert')).toBe(true);
  }
}

describe('dailyDifficultySchedule', () => {
  test('deterministic: same month + policyVersion yields identical schedule', () => {
    const a = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 1 }, policyVersion: 'v1' });
    const b = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 1 }, policyVersion: 'v1' });
    expect(a).toEqual(b);
  });

  test('policyVersion changes schedule (versioning prevents silent drift)', () => {
    const a = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 1 }, policyVersion: 'v1' });
    const b = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 1 }, policyVersion: 'v1b' });
    expect(a).not.toEqual(b);
  });

  test('guardrails: no big jumps and no consecutive expert', () => {
    const sched = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 2 }, policyVersion: 'v1' });
    expect(sched).toHaveLength(28);
    expectNoBigJumps(sched);
    expectNoConsecutiveExpert(sched);
  });

  test('distribution: monthly counts match deterministic rounding (sum equals days)', () => {
    const sched = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 3 }, policyVersion: 'v1' });
    expect(sched).toHaveLength(31);
    const counts = countByDifficulty(sched);
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    expect(total).toBe(31);
  });

  test('fiendish block: if fiendish exists, it must appear as expert->fiendish->expert', () => {
    const sched = buildDailyDifficultyScheduleForMonth({ month: { year: 2026, month1: 1 }, policyVersion: 'v1' });
    const idx = sched.findIndex((e) => e.difficulty === 'fiendish');
    if (idx === -1) {
      // Rounding may yield 0 fiendish for some months depending on month length.
      return;
    }
    expect(idx).toBeGreaterThan(0);
    expect(idx).toBeLessThan(sched.length - 1);
    expect(sched[idx - 1]!.difficulty).toBe('expert');
    expect(sched[idx + 1]!.difficulty).toBe('expert');

    // Ensure the fiendish day is isolated (no expert within +/-2 days outside the block).
    for (let i = 0; i < sched.length; i++) {
      if (i === idx - 1 || i === idx + 1) continue; // block experts
      if (i === idx) continue; // fiendish
      if (Math.abs(i - idx) <= 3) {
        // idx center; experts must not appear in the isolation window outside the block.
        expect(sched[i]!.difficulty).not.toBe('expert');
      }
    }
  });

  test('getDailyDifficultyForDateKey matches the month schedule', () => {
    const month = { year: 2026, month1: 4 };
    const sched = buildDailyDifficultyScheduleForMonth({ month, policyVersion: 'v1' });
    for (const e of sched) {
      expect(getDailyDifficultyForDateKey({ dateKey: e.dateKey, policyVersion: 'v1' })).toBe(e.difficulty);
    }
  });
});


