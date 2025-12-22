import { DIFFICULTIES, type Difficulty } from './difficulty';

export type FreePlayManifestPackEntryV1 = {
  version: string;
  url: string;
  sha256?: string;
};

export type FreePlayManifestV1 = {
  schema_version: 1;
  packs: Partial<Record<Difficulty, FreePlayManifestPackEntryV1>>;
};

export type FreePlayPackPuzzleV1 = {
  puzzle_id: string;
  puzzle: number[]; // length 81, 0..9
  solution: number[]; // length 81, 1..9
  rating?: number;
};

export type FreePlayPackV1 = {
  schema_version: 1;
  difficulty: Difficulty;
  version: string;
  puzzles: FreePlayPackPuzzleV1[];
};

function isDifficulty(x: unknown): x is Difficulty {
  return typeof x === 'string' && (DIFFICULTIES as readonly string[]).includes(x);
}

function assertNonEmptyString(name: string, v: unknown): asserts v is string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function assertArrayLen(name: string, v: unknown, len: number): asserts v is unknown[] {
  if (!Array.isArray(v) || v.length !== len) {
    throw new Error(`${name} must be an array of length ${len}`);
  }
}

function assertIntInRange(name: string, n: unknown, min: number, max: number): asserts n is number {
  if (typeof n !== 'number' || !Number.isFinite(n) || Math.floor(n) !== n || n < min || n > max) {
    throw new Error(`${name} must be an int in range ${min}..${max}`);
  }
}

function assertCellValues(name: string, v: unknown[], min: number, max: number): asserts v is number[] {
  for (let i = 0; i < v.length; i++) {
    assertIntInRange(`${name}[${i}]`, v[i], min, max);
  }
}

/**
 * Runtime validation for remote JSON boundary (throws on invalid shape).
 */
export function assertFreePlayManifest(input: unknown): FreePlayManifestV1 {
  if (typeof input !== 'object' || input === null) throw new Error('manifest must be an object');
  const obj = input as Record<string, unknown>;
  if (obj.schema_version !== 1) throw new Error('manifest.schema_version must be 1');

  const packsRaw = obj.packs;
  if (typeof packsRaw !== 'object' || packsRaw === null || Array.isArray(packsRaw)) {
    throw new Error('manifest.packs must be an object');
  }
  const packsObj = packsRaw as Record<string, unknown>;

  const packs: Partial<Record<Difficulty, FreePlayManifestPackEntryV1>> = {};
  let count = 0;
  for (const [k, v] of Object.entries(packsObj)) {
    if (!isDifficulty(k)) throw new Error(`manifest.packs has invalid difficulty key: ${k}`);
    if (typeof v !== 'object' || v === null) throw new Error(`manifest.packs.${k} must be an object`);
    const entry = v as Record<string, unknown>;
    assertNonEmptyString(`manifest.packs.${k}.version`, entry.version);
    assertNonEmptyString(`manifest.packs.${k}.url`, entry.url);
    if (entry.sha256 != null && typeof entry.sha256 !== 'string') {
      throw new Error(`manifest.packs.${k}.sha256 must be a string`);
    }
    packs[k] = { version: entry.version, url: entry.url, sha256: entry.sha256 as string | undefined };
    count++;
  }

  if (count === 0) throw new Error('manifest.packs must include at least one difficulty');
  return { schema_version: 1, packs };
}

/**
 * Runtime validation for remote JSON boundary (throws on invalid shape).
 */
export function assertFreePlayPack(input: unknown): FreePlayPackV1 {
  if (typeof input !== 'object' || input === null) throw new Error('pack must be an object');
  const obj = input as Record<string, unknown>;
  if (obj.schema_version !== 1) throw new Error('pack.schema_version must be 1');

  const difficulty = obj.difficulty;
  if (!isDifficulty(difficulty)) throw new Error('pack.difficulty must be a valid difficulty');
  assertNonEmptyString('pack.version', obj.version);

  const puzzlesRaw = obj.puzzles;
  if (!Array.isArray(puzzlesRaw) || puzzlesRaw.length === 0) throw new Error('pack.puzzles must be a non-empty array');

  const puzzles: FreePlayPackPuzzleV1[] = puzzlesRaw.map((p, idx) => {
    if (typeof p !== 'object' || p === null) throw new Error(`pack.puzzles[${idx}] must be an object`);
    const po = p as Record<string, unknown>;
    assertNonEmptyString(`pack.puzzles[${idx}].puzzle_id`, po.puzzle_id);
    assertArrayLen(`pack.puzzles[${idx}].puzzle`, po.puzzle, 81);
    assertArrayLen(`pack.puzzles[${idx}].solution`, po.solution, 81);
    assertCellValues(`pack.puzzles[${idx}].puzzle`, po.puzzle, 0, 9);
    assertCellValues(`pack.puzzles[${idx}].solution`, po.solution, 1, 9);
    const rating = po.rating;
    if (rating != null && (typeof rating !== 'number' || !Number.isFinite(rating))) {
      throw new Error(`pack.puzzles[${idx}].rating must be a number`);
    }
    return {
      puzzle_id: po.puzzle_id,
      puzzle: po.puzzle as number[],
      solution: po.solution as number[],
      rating: rating as number | undefined,
    };
  });

  return {
    schema_version: 1,
    difficulty,
    version: obj.version,
    puzzles,
  };
}


