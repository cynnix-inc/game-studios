import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relPath: string): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('Observability: external calls require timeouts + bounded retries (rule 11)', () => {
  test('Sudoku daily fetches use fetchWithTimeout + retries', () => {
    const src = readRepoFile('apps/sudoku/src/services/daily.ts');

    // Must use a wrapper (not bare fetch) so timeouts/retries are enforced consistently.
    expect(src).toMatch(/fetchWithTimeout/);

    // Retry policy should exist for idempotent GETs.
    expect(src).toMatch(/maxAttempts\s*:\s*3/);
    expect(src).toMatch(/timeoutMs\s*:\s*10_000|timeoutMs\s*:\s*10000/);
  });

  test('Sudoku leaderboard submit uses timeout and does not retry non-idempotent POSTs', () => {
    const src = readRepoFile('apps/sudoku/src/services/leaderboard.ts');

    expect(src).toMatch(/fetchWithTimeout/);
    expect(src).toMatch(/maxAttempts\s*:\s*1/);
    expect(src).toMatch(/timeoutMs\s*:\s*10_000|timeoutMs\s*:\s*10000/);
  });
});


