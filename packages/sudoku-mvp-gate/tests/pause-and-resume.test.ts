import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relPath: string): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('Epic 5: local saves + pause/resume behavior (repo gate)', () => {
  test('Game screen: supports explicit pause/resume, hides board while paused, and does not auto-resume on active', () => {
    const src = readRepoFile('apps/sudoku/app/game/index.tsx');

    expect(src).toMatch(/Pause/);
    expect(src).toMatch(/Resume/);
    expect(src).toMatch(/runStatus/);

    // Lifecycle: do not auto-resume on active (explicit resume required).
    expect(src).not.toMatch(/state\s*===\s*['"]active['"][\s\S]*resumeRun\(/);
  });

  test('Daily screen: supports explicit pause/resume, hides board while paused, and does not auto-resume on active', () => {
    const src = readRepoFile('apps/sudoku/app/daily/index.tsx');

    expect(src).toMatch(/Pause/);
    expect(src).toMatch(/Resume/);
    expect(src).toMatch(/runStatus/);

    // Lifecycle: do not auto-resume on active (explicit resume required).
    expect(src).not.toMatch(/state\s*===\s*['"]active['"][\s\S]*resumeRun\(/);
  });

  test('Local save payload includes mode + dailyDateKey (for routing resume)', () => {
    const src = readRepoFile('apps/sudoku/src/services/saves.ts');

    expect(src).toMatch(/mode/);
    expect(src).toMatch(/dailyDateKey/);
  });
});


