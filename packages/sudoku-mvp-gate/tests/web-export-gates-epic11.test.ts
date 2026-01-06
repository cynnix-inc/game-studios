import fs from 'node:fs';
import path from 'node:path';

function repoPath(...parts: string[]): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return path.join(repoRoot, ...parts);
}

function readJson(relPath: string): unknown {
  const raw = fs.readFileSync(repoPath(relPath), 'utf8');
  return JSON.parse(raw) as unknown;
}

describe('Epic 11: Web export invariants (Expo)', () => {
  test('Sudoku app export:web verifies EXPO_PUBLIC_* env before expo export and outputs to dist', () => {
    const pkg = readJson('apps/sudoku/package.json') as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    const cmd = scripts['export:web'];

    expect(typeof cmd).toBe('string');

    // Must validate env first (Netlify + CI parity).
    expect(cmd).toMatch(/node\s+\.\.\/\.\.\/scripts\/verify-expo-public-env\.mjs/);
    // Must export web static output into dist for Netlify publish.
    expect(cmd).toMatch(/expo\s+export\s+-p\s+web/);
    expect(cmd).toMatch(/--output-dir\s+dist/);
  });

  test('Expo web output is static', () => {
    const appJson = readJson('apps/sudoku/app.json') as {
      expo?: { web?: { output?: unknown } };
    };
    expect(appJson.expo?.web?.output).toBe('static');
  });
});


