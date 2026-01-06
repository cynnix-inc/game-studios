import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { generateContractGated, type Difficulty, type FreePlayPackV1 } from '@cynnix-studios/sudoku-core';

type Args = {
  outDir: string;
  count: number;
  version: string;
  prefix: string;
  maxAttempts: number;
  seedBase: number;
  difficulties: Difficulty[] | null;
};

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  const x = Math.floor(n);
  return Math.max(min, Math.min(max, x));
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    outDir: 'apps/sudoku/src/freeplayPacks/bundled',
    count: 20,
    version: 'bundled-v1',
    prefix: 'bundled',
    maxAttempts: 200,
    seedBase: 20250101,
    difficulties: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '--outDir') {
      out.outDir = argv[++i] ?? out.outDir;
      continue;
    }
    if (a === '--count') {
      out.count = clampInt(Number(argv[++i]), 1, 500);
      continue;
    }
    if (a === '--version') {
      out.version = argv[++i] ?? out.version;
      continue;
    }
    if (a === '--prefix') {
      out.prefix = argv[++i] ?? out.prefix;
      continue;
    }
    if (a === '--maxAttempts') {
      out.maxAttempts = clampInt(Number(argv[++i]), 1, 50_000);
      continue;
    }
    if (a === '--seedBase') {
      out.seedBase = clampInt(Number(argv[++i]), 0, 0xffffffff);
      continue;
    }
    if (a === '--difficulty') {
      const raw = argv[++i];
      if (raw) {
        const d = raw as Difficulty;
        // Runtime validation is intentionally light; the generator will throw if difficulty is invalid.
        out.difficulties = [...(out.difficulties ?? []), d];
      }
      continue;
    }
  }

  return out;
}

function allDifficulties(): Difficulty[] {
  return ['novice', 'skilled', 'advanced', 'expert', 'fiendish', 'ultimate'];
}

function puzzleId(prefix: string, difficulty: Difficulty, seed: number): string {
  // Keep bundled ids short and stable for storage/telemetry/debugging.
  // Note: padding does not change larger seed values (e.g. 20250101).
  const seedPart = String(seed).padStart(4, '0');
  return `${prefix}:${difficulty}:${seedPart}`;
}

async function writePackFile(args: { outDirAbs: string; pack: FreePlayPackV1 }) {
  const p = path.join(args.outDirAbs, `${args.pack.difficulty}.json`);
  await fs.writeFile(p, JSON.stringify(args.pack));
}

async function main() {
  const args = parseArgs(process.argv);
  const outDirAbs = path.resolve(process.cwd(), args.outDir);
  await fs.mkdir(outDirAbs, { recursive: true });

  const diffs = args.difficulties ?? allDifficulties();

  for (const d of diffs) {
    const puzzles: FreePlayPackV1['puzzles'] = [];
    let seed = args.seedBase;

    while (puzzles.length < args.count) {
      const gen = generateContractGated(d, { seed, maxAttempts: args.maxAttempts });
      puzzles.push({
        puzzle_id: puzzleId(args.prefix, d, seed),
        puzzle: gen.puzzle as unknown as number[],
        solution: gen.solution as unknown as number[],
      });
      seed++;
    }

    const pack: FreePlayPackV1 = {
      schema_version: 1,
      difficulty: d,
      version: args.version,
      puzzles,
    };

    await writePackFile({ outDirAbs, pack });
  }

  // eslint-disable-next-line no-console
  console.log(`[freeplay-packs] wrote ${diffs.length} pack(s) to ${outDirAbs}`);
}

void main();


