import fs from 'node:fs/promises';
import path from 'node:path';

// Note: this is a repo build script; we import directly from the workspace source to avoid
// depending on package install/linking at the repo root.
import { getDailyDifficultyForDateKey, type Difficulty } from '../packages/sudoku-core/src/index';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatUtcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
}

function addUtcDays(d: Date, deltaDays: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + deltaDays);
  return next;
}

function parseArgs(argv: string[]) {
  const out: { outDir: string | null; daysPast: number; daysFuture: number; policyVersion: string } = {
    outDir: null,
    daysPast: 30,
    daysFuture: 365,
    policyVersion: 'v1',
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '--outDir') {
      out.outDir = argv[++i] ?? null;
      continue;
    }
    if (a === '--daysPast') {
      out.daysPast = Number(argv[++i] ?? out.daysPast);
      continue;
    }
    if (a === '--daysFuture') {
      out.daysFuture = Number(argv[++i] ?? out.daysFuture);
      continue;
    }
    if (a === '--policyVersion') {
      out.policyVersion = String(argv[++i] ?? out.policyVersion);
      continue;
    }
  }
  return out;
}

// Deterministic example puzzle/solution (classic Sudoku).
// This remains a stopgap “daily content” source that keeps everything self-contained in the exported site.
const PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

function difficultyForDateKey(dateKey: string, policyVersion: string): Difficulty {
  return getDailyDifficultyForDateKey({ dateKey, policyVersion });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.outDir) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: tsx scripts/generate-daily-static.ts --out <dir> [--daysPast N] [--daysFuture N] [--policyVersion v1]',
    );
    process.exit(2);
  }

  const outDir = path.resolve(process.cwd(), args.outDir);
  const dailyDir = path.join(outDir, 'daily');
  await fs.mkdir(dailyDir, { recursive: true });

  const today = new Date();
  const todayKey = formatUtcDateKey(today);

  const past = Math.max(0, Math.floor(args.daysPast));
  const future = Math.max(0, Math.floor(args.daysFuture));

  const keys: string[] = [];
  for (let i = past; i >= 1; i--) keys.push(formatUtcDateKey(addUtcDays(today, -i)));
  keys.push(todayKey);
  for (let i = 1; i <= future; i++) keys.push(formatUtcDateKey(addUtcDays(today, i)));

  // Payloads
  await Promise.all(
    keys.map(async (dateKey) => {
      const payload = {
        schema_version: 1,
        date_key: dateKey,
        difficulty: difficultyForDateKey(dateKey, args.policyVersion),
        puzzle: PUZZLE,
        solution: SOLUTION,
      };
      await fs.writeFile(path.join(dailyDir, `${dateKey}.json`), JSON.stringify(payload));
    }),
  );

  const manifest = {
    schema_version: 1,
    entries: keys.map((k) => ({ date_key: k, url: `daily/${k}.json` })),
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));

  // eslint-disable-next-line no-console
  console.log(`[daily-static] wrote ${keys.length} payloads + manifest to ${outDir} (policy=${args.policyVersion})`);
}

void main();


