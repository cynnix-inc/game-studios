import fs from 'node:fs';
import path from 'node:path';

describe('Edge function boundary conventions (Epic 0)', () => {
  test('Edge functions use stable ok/data/error response shape', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const submitScore = fs.readFileSync(
      path.join(repoRoot, 'supabase', 'functions', 'submit-score', 'index.ts'),
      'utf8',
    );
    const upsertSave = fs.readFileSync(
      path.join(repoRoot, 'supabase', 'functions', 'upsert-save', 'index.ts'),
      'utf8',
    );

    // Minimal static checks: ensure the function file contains `"ok":` and `"error":` in JSON responses.
    // We validate deeper behavior in backend-focused tests later, but Epic 0 requires stable shapes.
    expect(submitScore).toMatch(/ok\s*:/);
    expect(submitScore).toMatch(/error\s*:/);
    expect(upsertSave).toMatch(/ok\s*:/);
    expect(upsertSave).toMatch(/error\s*:/);
  });
});


