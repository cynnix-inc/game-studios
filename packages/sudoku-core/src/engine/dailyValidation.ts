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

function assertCellValues(name: string, v: unknown[]): void {
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
  const schema_version = (input as any).schema_version;
  if (schema_version !== 1) throw new Error('manifest.schema_version must be 1');
  const entries = (input as any).entries;
  if (!Array.isArray(entries)) throw new Error('manifest.entries must be an array');

  const out: DailyManifestEntry[] = entries.map((e: any, idx: number) => {
    if (typeof e !== 'object' || e === null) throw new Error(`manifest.entries[${idx}] must be an object`);
    if (!isDateKey(e.date_key)) throw new Error(`manifest.entries[${idx}].date_key must be YYYY-MM-DD`);
    if (typeof e.url !== 'string' || e.url.length === 0) throw new Error(`manifest.entries[${idx}].url must be a string`);
    if (e.sha256 != null && typeof e.sha256 !== 'string') throw new Error(`manifest.entries[${idx}].sha256 must be a string`);
    return { date_key: e.date_key, url: e.url, sha256: e.sha256 };
  });

  return { schema_version: 1, entries: out };
}

/**
 * Runtime validation for remote JSON boundary (throws on invalid shape).
 */
export function assertDailyPayload(input: unknown): DailyPayloadV1 {
  if (typeof input !== 'object' || input === null) throw new Error('payload must be an object');
  const schema_version = (input as any).schema_version;
  if (schema_version !== 1) throw new Error('payload.schema_version must be 1');
  const date_key = (input as any).date_key;
  if (!isDateKey(date_key)) throw new Error('payload.date_key must be YYYY-MM-DD');
  const difficulty = (input as any).difficulty;
  if (!isDifficulty(difficulty)) throw new Error('payload.difficulty must be a valid difficulty');

  const puzzle = (input as any).puzzle;
  const solution = (input as any).solution;
  assertArrayLen('payload.puzzle', puzzle, 81);
  assertArrayLen('payload.solution', solution, 81);
  assertCellValues('payload.puzzle', puzzle);
  assertCellValues('payload.solution', solution);

  return {
    schema_version: 1,
    date_key,
    difficulty,
    puzzle: puzzle as number[],
    solution: solution as number[],
  };
}



