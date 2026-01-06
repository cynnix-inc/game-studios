import fs from 'node:fs';
import path from 'node:path';

function repoRoot(): string {
  return path.resolve(__dirname, '../../..');
}

function readText(relPath: string): string {
  return fs.readFileSync(path.join(repoRoot(), relPath), 'utf8');
}

function readJson<T = unknown>(relPath: string): T {
  return JSON.parse(readText(relPath)) as T;
}

describe('Supabase local dev wiring (TDD gate)', () => {
  test('root package.json contains supabase:* scripts', () => {
    const pkg = readJson<{ scripts?: Record<string, string> }>('package.json');
    const scripts = pkg.scripts ?? {};

    expect(Object.keys(scripts)).toEqual(
      expect.arrayContaining([
        'supabase:start',
        'supabase:stop',
        'supabase:status',
        'supabase:reset',
        'supabase:gen:types',
      ]),
    );
  });

  test('docs/env.example documents localhost defaults and how to get the anon key', () => {
    const envExample = readText('docs/env.example');
    expect(envExample).toContain('EXPO_PUBLIC_SUPABASE_URL=');
    expect(envExample).toContain('EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=');

    // Local defaults we require for local dev.
    expect(envExample).toContain('http://localhost:54321');
    expect(envExample).toContain('/functions/v1');

    // Instruction should mention where to fetch local anon key.
    expect(envExample.toLowerCase()).toContain('supabase status');
  });

  test('supabase/config.toml is a real Supabase CLI config (not placeholder)', () => {
    const cfg = readText('supabase/config.toml');
    // Placeholder file currently only contains comments; a real one will include sections.
    expect(cfg).toContain('[api]');
    expect(cfg).toContain('[db]');
  });

  test('docs/supabase-local-dev.md exists', () => {
    const p = path.join(repoRoot(), 'docs/supabase-local-dev.md');
    expect(fs.existsSync(p)).toBe(true);
  });

  test('.gitignore includes .env', () => {
    const gitignore = readText('.gitignore');
    expect(gitignore).toMatch(/^\s*\.env\s*$/m);
  });
});


