import fs from 'node:fs';
import path from 'node:path';

function readJson(relPath: string): unknown {
  const repoRoot = path.resolve(__dirname, '../../..');
  const raw = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
  return JSON.parse(raw) as unknown;
}

describe('Repo scripts are cross-platform (rule 09)', () => {
  test('root scripts do not rely on shell-specific PATH assignments', () => {
    const pkg = readJson('package.json') as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};

    for (const cmd of Object.values(scripts)) {
      // Example of non-portable syntax: `PATH=$(pwd):$PATH ...`
      expect(cmd).not.toMatch(/\bPATH=\$\(\s*pwd\s*\):\$PATH\b/);
      // Avoid POSIX-only expansions in top-level scripts.
      expect(cmd).not.toMatch(/\$\(\s*pwd\s*\)/);
    }
  });
});


