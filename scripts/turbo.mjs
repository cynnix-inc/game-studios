import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length === 0) {
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/turbo.mjs <turbo-task> [...args]');
  process.exit(2);
}

const env = { ...process.env };

// Ensure the repo root is on PATH so Turbo can locate our local `pnpm` shim (cross-platform).
const delimiter = path.delimiter;
const currentPath = env.PATH ?? env.Path ?? '';
const nextPath = `${repoRoot}${delimiter}${currentPath}`;
env.PATH = nextPath;
env.Path = nextPath;

const turboBin =
  process.platform === 'win32'
    ? path.join(repoRoot, 'node_modules', '.bin', 'turbo.cmd')
    : path.join(repoRoot, 'node_modules', '.bin', 'turbo');

const result = spawnSync(turboBin, args, {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);


