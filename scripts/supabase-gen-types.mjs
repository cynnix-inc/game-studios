import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const outFile = path.join(repoRoot, 'packages/supabase/src/types/database.types.ts');

function runSupabaseGenTypesLocal() {
  return new Promise((resolve, reject) => {
    const basePath = process.env.PATH ?? '';
    const brewPath = process.platform === 'darwin' ? '/opt/homebrew/bin:/usr/local/bin' : '';
    const env = {
      ...process.env,
      PATH: brewPath ? `${brewPath}:${basePath}` : basePath,
    };
    const child = spawn('supabase', ['gen', 'types', 'typescript', '--local'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      const e = new Error(`supabase gen types failed (exit ${code}).\n${stderr}`.trim());
      reject(e);
    });
  });
}

try {
  const { stdout } = await runSupabaseGenTypesLocal();
  if (!stdout || stdout.trim().length === 0) {
    throw new Error('supabase gen types returned empty output; is `supabase start` running?');
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, stdout, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(repoRoot, outFile)}`);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
}


