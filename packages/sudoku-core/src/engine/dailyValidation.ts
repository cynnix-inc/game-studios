import { DIFFICULTIES, type Difficulty } from './difficulty';

export type DailyManifestEntry = {
  date_key: string; // YYYY-MM-DD (UTC)
  url: string;
  sha256?: string;
};

export type DailyManifestV1 = {
  schema_version: 1;
  entries: DailyManifestEntry[];
};

export type DailyPayloadV1 = {
  schema_version: 1;
  date_key: string; // YYYY-MM-DD (UTC)
  difficulty: Difficulty;
  puzzle: number[]; // length 81, 0..9
  solution: number[]; // length 81, 0..9
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateKey(x: unknown): x is string {
  return typeof x === 'string' && DATE_KEY_RE.test(x);
}

function isDifficulty(x: unknown): x is Difficulty {
  return typeof x === 'string' && (DIFFICULTIES as readonly string[]).includes(x);
}

function assertArrayLen(name: string, v: unknown, len: number): asserts v is unknown[] {
  if (!Array.isArray(v) || v.length !== len) {
    throw new Error(`${name} must be an array of length ${len}`);
  }
}

function assertCellValues(name: string, v: unknown[]): asserts v is number[] {
  for (let i = 0; i < v.length; i++) {
    const n = v[i];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 9 || Math.floor(n) !== n) {
      throw new Error(`${name} has invalid cell value at index ${i}`);
    }
  }
}

/**
 * Runtime validation for remote JSON boundary (throws on invalid shape).
 */
export function assertDailyManifest(input: unknown): DailyManifestV1 {
  if (typeof input !== 'object' || input === null) throw new Error('manifest must be an object');
  const obj = input as Record<string, unknown>;
  const schema_version = obj.schema_version;
  if (schema_version !== 1) throw new Error('manifest.schema_version must be 1');
  const entries = obj.entries;
  if (!Array.isArray(entries)) throw new Error('manifest.entries must be an array');

  const out: DailyManifestEntry[] = entries.map((entry: unknown, idx: number) => {
    if (typeof entry !== 'object' || entry === null) throw new Error(`manifest.entries[${idx}] must be an object`);
    const e = entry as Record<string, unknown>;
    const date_key = e.date_key;
    const url = e.url;
    const sha256Raw = e.sha256;

    if (!isDateKey(date_key)) throw new Error(`manifest.entries[${idx}].date_key must be YYYY-MM-DD`);
    if (typeof url !== 'string' || url.length === 0) throw new Error(`manifest.entries[${idx}].url must be a string`);
    if (sha256Raw != null && typeof sha256Raw !== 'string') {
      throw new Error(`manifest.entries[${idx}].sha256 must be a string`);
    }
    const sha256 = sha256Raw === null ? undefined : sha256Raw;
    return { date_key, url, sha256 };
  });

  return { schema_version: 1, entries: out };
}

/**
 * Runtime validation for remote JSON boundary (throws on invalid shape).
 */
export function assertDailyPayload(input: unknown): DailyPayloadV1 {
  if (typeof input !== 'object' || input === null) throw new Error('payload must be an object');
  const obj = input as Record<string, unknown>;
  const schema_version = obj.schema_version;
  if (schema_version !== 1) throw new Error('payload.schema_version must be 1');
  const date_key = obj.date_key;
  if (!isDateKey(date_key)) throw new Error('payload.date_key must be YYYY-MM-DD');
  const difficulty = obj.difficulty;
  if (!isDifficulty(difficulty)) throw new Error('payload.difficulty must be a valid difficulty');

  const puzzle = obj.puzzle;
  const solution = obj.solution;
  assertArrayLen('payload.puzzle', puzzle, 81);
  assertArrayLen('payload.solution', solution, 81);
  assertCellValues('payload.puzzle', puzzle);
  assertCellValues('payload.solution', solution);

  return {
    schema_version: 1,
    date_key,
    difficulty,
    puzzle,
    solution,
  };
}



