import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === 'node_modules') continue;
    if (e.name === 'sudoku-mvp-gate') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe('Secret safety (no service role in client code)', () => {
  test('apps/packages do not reference service-role keys', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const targets = [path.join(repoRoot, 'apps'), path.join(repoRoot, 'packages')];

    const forbidden = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'service_role',
      'SERVICE_ROLE',
      'SUPABASE_SERVICE_KEY',
      'supabaseServiceRole',
    ];

    const offenders: { file: string; needle: string }[] = [];

    for (const t of targets) {
      for (const f of walk(t)) {
        // Only scan text-ish sources
        if (!/\.(ts|tsx|js|jsx|md|json|sql|cjs|mjs)$/.test(f)) continue;
        const content = fs.readFileSync(f, 'utf8');
        for (const needle of forbidden) {
          if (content.includes(needle)) offenders.push({ file: f, needle });
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});


