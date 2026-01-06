import fs from 'node:fs';
import path from 'node:path';

function readEdgeFunctionSource(name: 'submit-score' | 'upsert-save'): string {
  const repoRoot = path.resolve(__dirname, '../../..');
  return fs.readFileSync(path.join(repoRoot, 'supabase', 'functions', name, 'index.ts'), 'utf8');
}

describe('Supabase Edge Function contract (rules 08/11)', () => {
  test('functions include requestId in stable envelopes', () => {
    const submitScore = readEdgeFunctionSource('submit-score');
    const upsertSave = readEdgeFunctionSource('upsert-save');

    // 08-supabase-edge-functions: `{ ok: true, data, requestId }` and `{ ok: false, error, requestId }`
    expect(submitScore).toMatch(/requestId/);
    expect(upsertSave).toMatch(/requestId/);
  });

  test('functions handle CORS + OPTIONS preflight', () => {
    const submitScore = readEdgeFunctionSource('submit-score');
    const upsertSave = readEdgeFunctionSource('upsert-save');

    // 08-supabase-edge-functions: must handle OPTIONS and return appropriate CORS headers
    expect(submitScore).toMatch(/OPTIONS/);
    expect(submitScore).toMatch(/Access-Control-Allow-Origin/i);
    expect(upsertSave).toMatch(/OPTIONS/);
    expect(upsertSave).toMatch(/Access-Control-Allow-Origin/i);
  });

  test('functions use required error code vocabulary (minimum set)', () => {
    const submitScore = readEdgeFunctionSource('submit-score');
    const upsertSave = readEdgeFunctionSource('upsert-save');

    // 08-supabase-edge-functions: at minimum, these codes must exist for mapping
    for (const src of [submitScore, upsertSave]) {
      expect(src).toMatch(/VALIDATION_ERROR/);
      expect(src).toMatch(/UNAUTHENTICATED/);
      expect(src).toMatch(/INTERNAL/);
    }
  });

  test('functions accept x-request-id when provided', () => {
    const submitScore = readEdgeFunctionSource('submit-score');
    const upsertSave = readEdgeFunctionSource('upsert-save');

    expect(submitScore).toMatch(/x-request-id/i);
    expect(upsertSave).toMatch(/x-request-id/i);
  });
});


