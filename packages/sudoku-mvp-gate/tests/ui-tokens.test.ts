import fs from 'node:fs';
import path from 'node:path';

function repoPath(...parts: string[]): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return path.join(repoRoot, ...parts);
}

function read(relPath: string): string {
  return fs.readFileSync(repoPath(relPath), 'utf8');
}

describe('UI tokens (rule 10)', () => {
  test('packages/ui provides tokens entrypoint at packages/ui/src/tokens.ts', () => {
    const src = read('packages/ui/src/tokens.ts');
    expect(src).toMatch(/export/);
  });

  test('ui components import tokens via ../tokens (not ../theme)', () => {
    const files = [
      'packages/ui/src/components/AppButton.tsx',
      'packages/ui/src/components/AppCard.tsx',
      'packages/ui/src/components/AppText.tsx',
      'packages/ui/src/components/Screen.tsx',
    ];

    for (const f of files) {
      const src = read(f);
      expect(src).toMatch(/\.\.\/tokens/);
      expect(src).not.toMatch(/\.\.\/theme/);
    }
  });
});


