import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relPath: string): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('Sudoku web accessibility: keyboard + focus (rule 10)', () => {
  test('SudokuGrid implements keyboard controls (arrows, digits, clear)', () => {
    const src = readRepoFile('apps/sudoku/src/components/SudokuGrid.tsx');

    // Keyboard support must exist on web; this is a repo-gate static check.
    expect(src).toMatch(/onKeyDown/);
    expect(src).toMatch(/ArrowUp/);
    expect(src).toMatch(/ArrowDown/);
    expect(src).toMatch(/ArrowLeft/);
    expect(src).toMatch(/ArrowRight/);
    expect(src).toMatch(/Backspace/);
    expect(src).toMatch(/Delete/);
  });

  test('SudokuGrid provides non-color selection affordance + screen reader hint', () => {
    const src = readRepoFile('apps/sudoku/src/components/SudokuGrid.tsx');

    // Rule: color is not enough + provide usable labels.
    expect(src).toMatch(/selected/);
    expect(src).toMatch(/accessibilityHint/);
  });
});


