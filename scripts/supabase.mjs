import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

function candidateBinaries() {
  const out = [];
  const fromEnv = process.env.SUPABASE_CLI_PATH;
  if (fromEnv) out.push(fromEnv);

  // Common install locations.
  if (process.platform === 'darwin') {
    out.push('/opt/homebrew/bin/supabase');
    out.push('/usr/local/bin/supabase');
  }

  // Fallback to PATH lookup.
  out.push('supabase');
  return out;
}

function existsIfAbsolute(p) {
  return path.isAbsolute(p) ? fs.existsSync(p) : true;
}

function spawnOrThrow(bin, args) {
  return new Promise((resolve, reject) => {
    const basePath = process.env.PATH ?? '';
    const brewPath = process.platform === 'darwin' ? '/opt/homebrew/bin:/usr/local/bin' : '';
    const env = {
      ...process.env,
      PATH: brewPath ? `${brewPath}:${basePath}` : basePath,
    };
    const child = spawn(bin, args, { cwd: repoRoot, stdio: 'inherit', env });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => resolve(code ?? 1));
  });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/supabase.mjs <args...>');
  process.exit(1);
}

let lastErr = null;
for (const bin of candidateBinaries()) {
  if (!existsIfAbsolute(bin)) continue;
  try {
    const code = await spawnOrThrow(bin, args);
    process.exit(code);
  } catch (e) {
    // If not found, try next candidate. Otherwise, surface the error.
    const msg = e instanceof Error ? e.message : String(e);
    lastErr = e;
    if (msg.includes('ENOENT')) continue;
    // eslint-disable-next-line no-console
    console.error(msg);
    process.exit(1);
  }
}

// eslint-disable-next-line no-console
console.error(
  'Supabase CLI not found. Install it (macOS: `/opt/homebrew/bin/brew install supabase/tap/supabase`) or set SUPABASE_CLI_PATH.',
);
if (lastErr) process.exit(1);


