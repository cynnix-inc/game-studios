import { assertDailyManifest, assertDailyPayload } from '../src/engine/dailyValidation';

const VALID_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const VALID_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

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
      puzzle: VALID_PUZZLE,
      solution: VALID_SOLUTION,
    };
    expect(assertDailyPayload(payload)).toEqual(payload);
  });

  test('rejects a payload with wrong puzzle length', () => {
    const payload = {
      schema_version: 1,
      date_key: '2025-01-02',
      difficulty: 'novice',
      puzzle: [0, 0],
      solution: VALID_SOLUTION,
    };
    expect(() => assertDailyPayload(payload)).toThrow(/puzzle/i);
  });
});



