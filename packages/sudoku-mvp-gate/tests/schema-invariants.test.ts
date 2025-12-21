import fs from 'node:fs';
import path from 'node:path';

describe('Schema invariants (Epic 0)', () => {
  test('has a migration that introduces daily_runs with RLS enabled', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const contents = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n\n');

    expect(contents).toMatch(/create table if not exists public\.daily_runs/i);
    expect(contents).toMatch(/alter table public\.daily_runs enable row level security/i);
  });
});


