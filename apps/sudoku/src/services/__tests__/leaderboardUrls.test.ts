import { buildSupabaseRestUrl } from '../leaderboardRestUrl';

describe('leaderboardRestUrl', () => {
  test('buildSupabaseRestUrl encodes array params as repeated query keys', () => {
    const url = buildSupabaseRestUrl('https://example.supabase.co', '/rest/v1/daily_leaderboard_score_v1', {
      select: 'id',
      rank: ['gte.1', 'lte.3'],
    });
    expect(url).toContain('/rest/v1/daily_leaderboard_score_v1?');
    expect(url).toContain('select=id');
    // Order is not guaranteed; assert both present.
    expect(url).toContain('rank=gte.1');
    expect(url).toContain('rank=lte.3');
  });

  test('buildSupabaseRestUrl normalizes baseUrl/path slashes', () => {
    expect(
      buildSupabaseRestUrl('https://example.supabase.co/', 'rest/v1/view', {
        limit: '1',
      }),
    ).toBe('https://example.supabase.co/rest/v1/view?limit=1');
  });
});


