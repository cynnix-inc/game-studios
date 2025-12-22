import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relPath: string): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('Epic 4: Daily leaderboards UI + service (PRD 8.3/8.4)', () => {
  test('leaderboard screen is Daily-focused and includes Score + Raw Time tabs', () => {
    const src = readRepoFile('apps/sudoku/app/leaderboard/index.tsx');

    // Epic 4: tabs
    expect(src).toMatch(/Score/);
    expect(src).toMatch(/Raw Time/);

    // Must not be mock placeholder.
    expect(src).not.toMatch(/replace mock data/i);
    expect(src).not.toMatch(/Fewest Mistakes/);
    expect(src).not.toMatch(/Fastest Times/);
  });

  test('leaderboard service is not mock and references daily runs fields', () => {
    const src = readRepoFile('apps/sudoku/src/services/leaderboard.ts');

    // Epic 4 is Daily-only; reads from ranked leaderboard views.
    expect(src).toMatch(/daily_leaderboard_score_v1/);
    expect(src).toMatch(/daily_leaderboard_raw_time_v1/);

    // Transparency fields.
    expect(src).toMatch(/score_ms/);
    expect(src).toMatch(/raw_time_ms/);
    expect(src).toMatch(/mistakes_count/);
    expect(src).toMatch(/hints_used_count/);

    // Must not be mock placeholder.
    expect(src).not.toMatch(/Placeholder/);
    expect(src).not.toMatch(/Player 1/);
  });
});


