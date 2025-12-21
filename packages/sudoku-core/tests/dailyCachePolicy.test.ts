import { computeDailyCacheKeysToEvict } from '../src/engine/dailyCachePolicy';

describe('daily cache policy', () => {
  test('evicts keys outside of the keep set', () => {
    const keep = ['2025-01-03', '2025-01-02', '2025-01-01'];
    const cached = ['2025-01-03', '2025-01-02', '2024-12-31', '2024-12-30'];
    expect(computeDailyCacheKeysToEvict({ cachedKeys: cached, keepKeys: keep })).toEqual(['2024-12-31', '2024-12-30']);
  });

  test('returns empty when all cached keys are within keep set', () => {
    const keep = ['2025-01-03', '2025-01-02', '2025-01-01'];
    const cached = ['2025-01-03', '2025-01-02'];
    expect(computeDailyCacheKeysToEvict({ cachedKeys: cached, keepKeys: keep })).toEqual([]);
  });
});



