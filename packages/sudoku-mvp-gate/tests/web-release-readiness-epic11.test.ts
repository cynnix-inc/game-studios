import fs from 'node:fs';
import path from 'node:path';

function repoPath(...parts: string[]): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return path.join(repoRoot, ...parts);
}

function read(relPath: string): string {
  return fs.readFileSync(repoPath(relPath), 'utf8');
}

describe('Epic 11: Web release readiness (Netlify + SPA)', () => {
  test('Netlify build uses repo web export script and publishes apps/sudoku/dist', () => {
    const toml = read('apps/sudoku/netlify.toml');

    expect(toml).toMatch(/command\s*=\s*"pnpm -w export:web:sudoku"/);
    expect(toml).toMatch(/publish\s*=\s*"apps\/sudoku\/dist"/);
  });

  test('Netlify SPA redirect is present', () => {
    const redirects = read('apps/sudoku/public/_redirects');
    expect(redirects).toMatch(/\/\*\s+\/index\.html\s+200/);
  });
});


