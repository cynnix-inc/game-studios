import type { Difficulty } from './difficulty';

export type DailyDifficultySchedulePolicyV1 = {
  version: 'v1';
  /**
   * Percent targets per month (0..1). These are converted into integer counts per month.
   * Targets should sum to 1.0 (tolerate small floating error).
   */
  monthlyTargets: Readonly<Record<Difficulty, number>>;
  /**
   * Whether to include the optional Fiendish 3-day block when there is at least
   * one Fiendish day in the month.
   */
  enableFiendishBlock: boolean;
};

export type DailyDifficultyScheduleMonth = {
  year: number; // e.g. 2026
  month1: number; // 1..12
};

export type DailyDifficultyScheduleEntry = {
  dateKey: string; // YYYY-MM-DD (UTC)
  difficulty: Difficulty;
};

const DIFFICULTY_ORDER: readonly Difficulty[] = ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'] as const;
const DIFFICULTY_INDEX: Readonly<Record<Difficulty, number>> = {
  novice: 0,
  skilled: 1,
  advanced: 2,
  expert: 3,
  fiendish: 4,
  ultimate: 5,
} as const;

function assertMonth(input: DailyDifficultyScheduleMonth): void {
  if (!Number.isFinite(input.year) || Math.floor(input.year) !== input.year) throw new Error('year must be an integer');
  if (!Number.isFinite(input.month1) || Math.floor(input.month1) !== input.month1) throw new Error('month1 must be an integer');
  if (input.month1 < 1 || input.month1 > 12) throw new Error('month1 must be in range 1..12');
}

function daysInMonthUtc(year: number, month1: number): number {
  // month1: 1..12; JS Date month is 0..11
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function makeUtcDateKey(year: number, month1: number, day1: number): string {
  return `${year}-${pad2(month1)}-${pad2(day1)}`;
}

function utcWeekdayIndex(dateKey: string): number {
  // 0 = Sunday ... 6 = Saturday
  const year = Number(dateKey.slice(0, 4));
  const month1 = Number(dateKey.slice(5, 7));
  const day1 = Number(dateKey.slice(8, 10));
  const d = new Date(Date.UTC(year, month1 - 1, day1, 0, 0, 0, 0));
  return d.getUTCDay();
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function policySeedBase(args: { policyVersion: string; year: number; month1: number }): string {
  return `${args.policyVersion}:${args.year}-${pad2(args.month1)}`;
}

/**
 * Small deterministic PRNG (xorshift32). Not cryptographic.
 */
class XorShift32 {
  private state: number;
  constructor(seed: number) {
    // Avoid a zero state.
    this.state = seed >>> 0 || 0x12345678;
  }
  nextU32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }
  next01(): number {
    // [0, 1)
    return this.nextU32() / 0x1_0000_0000;
  }
}

function fnv1a32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function roundMonthlyCounts(days: number, targets: Readonly<Record<Difficulty, number>>): Record<Difficulty, number> {
  // Deterministic largest-remainder method.
  const raw: Array<{ d: Difficulty; exact: number; base: number; rem: number }> = DIFFICULTY_ORDER.map((d) => {
    const exact = clamp01(targets[d]) * days;
    const base = Math.floor(exact);
    return { d, exact, base, rem: exact - base };
  });

  let used = raw.reduce((sum, r) => sum + r.base, 0);
  const need = Math.max(0, days - used);

  // Sort by remainder desc; stable tie-break by difficulty order.
  raw.sort((a, b) => {
    if (b.rem !== a.rem) return b.rem - a.rem;
    return DIFFICULTY_INDEX[a.d] - DIFFICULTY_INDEX[b.d];
  });

  for (let i = 0; i < need; i++) raw[i % raw.length]!.base += 1;

  // Restore original order for output.
  const out = {} as Record<Difficulty, number>;
  for (const d of DIFFICULTY_ORDER) {
    const r = raw.find((x) => x.d === d);
    out[d] = r ? r.base : 0;
  }

  // Fix any rounding drift by adjusting Skilled (broad-appeal baseline) deterministically.
  const total = DIFFICULTY_ORDER.reduce((sum, d) => sum + out[d], 0);
  if (total !== days) out.skilled += days - total;
  return out;
}

function difficultyDeltaOk(prev: Difficulty | null, next: Difficulty): boolean {
  if (!prev) return true;
  return Math.abs(DIFFICULTY_INDEX[prev] - DIFFICULTY_INDEX[next]) <= 1;
}

function isMonThu(weekday: number): boolean {
  // 1..4 are Mon..Thu
  return weekday >= 1 && weekday <= 4;
}

function isFriSun(weekday: number): boolean {
  // 5..6..0 are Fri..Sat..Sun
  return weekday === 5 || weekday === 6 || weekday === 0;
}

function weekdayPreferenceScore(weekday: number, d: Difficulty): number {
  // Higher is better (soft bias).
  // Mon–Thu: prefer skilled/advanced, discourage expert+, avoid novice unless needed.
  if (isMonThu(weekday)) {
    if (d === 'advanced') return 5;
    if (d === 'skilled') return 4;
    if (d === 'expert') return 2;
    if (d === 'novice') return 1;
    if (d === 'fiendish') return 0;
    return 0; // ultimate
  }

  // Fri–Sun: allow more advanced/expert.
  if (isFriSun(weekday)) {
    if (d === 'advanced') return 5;
    if (d === 'expert') return 4;
    if (d === 'skilled') return 3;
    if (d === 'novice') return 1;
    if (d === 'fiendish') return 0;
    return 0;
  }

  return 0;
}

function weightedPick<T>(rng: XorShift32, items: Array<{ item: T; weight: number }>): T | null {
  let total = 0;
  for (const it of items) total += Math.max(0, it.weight);
  if (total <= 0) return null;
  const r = rng.next01() * total;
  let acc = 0;
  for (const it of items) {
    acc += Math.max(0, it.weight);
    if (r < acc) return it.item;
  }
  return items[items.length - 1]?.item ?? null;
}

function makeDefaultPolicyV1(): DailyDifficultySchedulePolicyV1 {
  return {
    version: 'v1',
    monthlyTargets: {
      novice: 0.13,
      skilled: 0.4,
      advanced: 0.34,
      expert: 0.1,
      fiendish: 0.03,
      ultimate: 0,
    },
    enableFiendishBlock: true,
  };
}

function withinRange(dayIdx0: number, startIdx0: number, endIdx0: number): boolean {
  return dayIdx0 >= startIdx0 && dayIdx0 <= endIdx0;
}

type MonthBuildState = {
  days: number;
  difficulties: Array<Difficulty | null>; // length=days
  remaining: Record<Difficulty, number>;
  expertBlocked: boolean[]; // length=days; true means cannot place expert on that day
};

function applyFiendishBlockIfPossible(state: MonthBuildState, rng: XorShift32): boolean {
  // Needs E,F,E available.
  if (state.remaining.fiendish < 1 || state.remaining.expert < 2) return false;
  const days = state.days;
  if (days < 3) return false;

  // Candidate centers for the block (fiendish day) are 1..days-2 (0-based).
  const centers: number[] = [];
  for (let c = 1; c <= days - 2; c++) {
    // Ensure the 3 slots are empty.
    if (state.difficulties[c - 1] || state.difficulties[c] || state.difficulties[c + 1]) continue;
    // Ensure we can place expert on the adjacent slots (not blocked).
    if (state.expertBlocked[c - 1] || state.expertBlocked[c + 1]) continue;
    centers.push(c);
  }
  if (centers.length === 0) return false;

  // Deterministic pick among centers.
  const picked = centers[Math.floor(rng.next01() * centers.length)]!;

  // Place E F E.
  state.difficulties[picked - 1] = 'expert';
  state.difficulties[picked] = 'fiendish';
  state.difficulties[picked + 1] = 'expert';
  state.remaining.expert -= 2;
  state.remaining.fiendish -= 1;

  // Isolation: no other expert within ±2 days of the block.
  for (let i = 0; i < days; i++) {
    if (withinRange(i, picked - 3, picked + 3) && i !== picked - 1 && i !== picked + 1) {
      // +/-2 around block edges means center +/-3 in 0-based indices for day slots.
      // Block edges are (picked-1) and (picked+1). Excluding those, block expert placement.
      state.expertBlocked[i] = true;
    }
  }

  // Also prevent consecutive expert by blocking expert on immediate neighbors of the expert days (except the fiendish center).
  // picked-1 expert blocks picked-2; picked+1 expert blocks picked+2.
  if (picked - 2 >= 0) state.expertBlocked[picked - 2] = true;
  if (picked + 2 < days) state.expertBlocked[picked + 2] = true;
  return true;
}

function canPlace(state: MonthBuildState, dayIdx0: number, d: Difficulty): boolean {
  if (state.difficulties[dayIdx0]) return false;
  if (state.remaining[d] <= 0) return false;

  const prev = dayIdx0 - 1 >= 0 ? state.difficulties[dayIdx0 - 1] : null;
  const next = dayIdx0 + 1 < state.days ? state.difficulties[dayIdx0 + 1] : null;
  if (!difficultyDeltaOk(prev, d)) return false;
  // If the next day is pre-filled (for example by the Fiendish block), ensure we don't
  // introduce a future adjacency jump.
  if (next && !difficultyDeltaOk(d, next)) return false;

  // Expert spacing: no consecutive expert.
  if (d === 'expert') {
    if (state.expertBlocked[dayIdx0]) return false;
    const prevD = prev;
    if (prevD === 'expert') return false;
    if (next === 'expert') return false;
  }

  // Fiendish should never be adjacent to another hard day (guardrail-ish):
  // It will usually be in the E-F-E block; outside that, keep it tame.
  if (d === 'fiendish') {
    if (prev && DIFFICULTY_INDEX[prev] >= DIFFICULTY_INDEX.expert) return false;
    if (next && DIFFICULTY_INDEX[next] >= DIFFICULTY_INDEX.expert) return false;
  }

  return true;
}

function place(state: MonthBuildState, dayIdx0: number, d: Difficulty): void {
  state.difficulties[dayIdx0] = d;
  state.remaining[d] -= 1;

  // Enforce expert spacing by blocking the next day from expert when an expert is placed.
  if (d === 'expert') {
    if (dayIdx0 + 1 < state.days) state.expertBlocked[dayIdx0 + 1] = true;
  }
}

function buildMonthAttempt(args: {
  year: number;
  month1: number;
  policyVersion: string;
  policy: DailyDifficultySchedulePolicyV1;
  seedOffset: number;
}): DailyDifficultyScheduleEntry[] | null {
  const { year, month1, policyVersion, policy, seedOffset } = args;
  const days = daysInMonthUtc(year, month1);
  const seedStr = `${policySeedBase({ policyVersion, year, month1 })}:${seedOffset}`;
  const rng = new XorShift32(fnv1a32(seedStr));

  const remaining = roundMonthlyCounts(days, policy.monthlyTargets);
  const state: MonthBuildState = {
    days,
    difficulties: Array.from({ length: days }, () => null),
    remaining,
    expertBlocked: Array.from({ length: days }, () => false),
  };

  if (policy.enableFiendishBlock) {
    // Best-effort; if it fails, fall back to filling without it.
    applyFiendishBlockIfPossible(state, rng);
  }

  // Fill left-to-right.
  for (let dayIdx0 = 0; dayIdx0 < days; dayIdx0++) {
    if (state.difficulties[dayIdx0]) continue;
    const dateKey = makeUtcDateKey(year, month1, dayIdx0 + 1);
    const wd = utcWeekdayIndex(dateKey);

    const candidates: Array<{ item: Difficulty; weight: number }> = [];
    for (const d of DIFFICULTY_ORDER) {
      if (!canPlace(state, dayIdx0, d)) continue;

      // Base weight proportional to remaining share.
      const base = state.remaining[d];
      const bias = weekdayPreferenceScore(wd, d);
      // Keep novice from flooding when other options exist by slightly down-weighting it.
      const novicePenalty = d === 'novice' ? 0.85 : 1;
      const w = base * (1 + bias * 0.15) * novicePenalty;
      candidates.push({ item: d, weight: w });
    }

    const picked = weightedPick(rng, candidates);
    if (!picked) return null;
    place(state, dayIdx0, picked);
  }

  // Validate fully filled and counts used exactly.
  for (const v of state.difficulties) if (!v) return null;
  for (const d of DIFFICULTY_ORDER) if (state.remaining[d] !== 0) return null;

  const out: DailyDifficultyScheduleEntry[] = [];
  for (let dayIdx0 = 0; dayIdx0 < days; dayIdx0++) {
    const difficulty = state.difficulties[dayIdx0] as Difficulty;
    out.push({ dateKey: makeUtcDateKey(year, month1, dayIdx0 + 1), difficulty });
  }
  return out;
}

export type BuildDailyDifficultyScheduleForMonthInput = {
  month: DailyDifficultyScheduleMonth;
  /**
   * Policy version. Change this when the policy or algorithm changes to avoid silent drift.
   */
  policyVersion?: string;
  /**
   * Optional override policy (defaults to v1 broad-appeal targets + guardrails).
   */
  policy?: DailyDifficultySchedulePolicyV1;
};

/**
 * Build a deterministic difficulty schedule for a UTC calendar month.
 */
export function buildDailyDifficultyScheduleForMonth(
  input: BuildDailyDifficultyScheduleForMonthInput,
): ReadonlyArray<DailyDifficultyScheduleEntry> {
  assertMonth(input.month);
  const policyVersion = input.policyVersion ?? 'v1';
  const policy = input.policy ?? makeDefaultPolicyV1();

  if (policy.version !== 'v1') throw new Error('Unsupported policy version');

  // Bounded deterministic retries (seed offset) to avoid rare greedy dead-ends.
  for (let attempt = 0; attempt < 32; attempt++) {
    const res = buildMonthAttempt({
      year: input.month.year,
      month1: input.month.month1,
      policyVersion,
      policy,
      seedOffset: attempt,
    });
    if (res) return res;
  }

  throw new Error('Failed to build schedule for month (exhausted attempts)');
}

export type GetDailyDifficultyForDateKeyInput = {
  dateKey: string; // YYYY-MM-DD (UTC)
  policyVersion?: string;
  policy?: DailyDifficultySchedulePolicyV1;
};

/**
 * Convenience: compute the scheduled difficulty for a given UTC day key.
 */
export function getDailyDifficultyForDateKey(input: GetDailyDifficultyForDateKeyInput): Difficulty {
  const year = Number(input.dateKey.slice(0, 4));
  const month1 = Number(input.dateKey.slice(5, 7));
  const day1 = Number(input.dateKey.slice(8, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day1)) {
    throw new Error('dateKey must be YYYY-MM-DD');
  }
  const month = { year, month1 };
  const schedule = buildDailyDifficultyScheduleForMonth({ month, policyVersion: input.policyVersion, policy: input.policy });
  const idx0 = day1 - 1;
  const entry = schedule[idx0];
  if (!entry) throw new Error('dateKey day is out of range for month');
  return entry.difficulty;
}


