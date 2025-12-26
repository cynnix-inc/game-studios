import { assertDailyManifest, assertDailyPayload } from '../src/engine/dailyValidation';

describe('daily payload validation', () => {
  test('accepts a valid manifest', () => {
    const manifest = {
      schema_version: 1,
      entries: [
        {
          date_key: '2025-01-02',
          url: 'https://example.com/daily/2025-01-02.json',
          sha256: 'deadbeef',
        },
      ],
    };

    expect(assertDailyManifest(manifest)).toEqual(manifest);
  });

  test('rejects a manifest with invalid date_key', () => {
    const bad = { schema_version: 1, entries: [{ date_key: '2025-1-2', url: 'x' }] };
    expect(() => assertDailyManifest(bad)).toThrow(/date_key/i);
  });

  test('accepts a valid payload', () => {
    const payload = {
      schema_version: 1,
      date_key: '2025-01-02',
      difficulty: 'novice',
      puzzle: Array.from({ length: 81 }, () => 0),
      solution: Array.from({ length: 81 }, () => 1),
    };
    expect(assertDailyPayload(payload)).toEqual(payload);
  });

  test('rejects a payload with wrong puzzle length', () => {
    const payload = {
      schema_version: 1,
      date_key: '2025-01-02',
      difficulty: 'novice',
      puzzle: [0, 0],
      solution: Array.from({ length: 81 }, () => 1),
    };
    expect(() => assertDailyPayload(payload)).toThrow(/puzzle/i);
  });
});



