import { computeNextProfileFromSession } from '../authBootstrapLogic';

describe('computeNextProfileFromSession', () => {
  it('returns null when there is no session', () => {
    expect(computeNextProfileFromSession(null)).toEqual(null);
  });

  it('maps a session user to supabase profile', () => {
    expect(
      computeNextProfileFromSession({
        user: { id: 'user-123', email: 'a@example.com' },
      }),
    ).toEqual({
      mode: 'supabase',
      userId: 'user-123',
      email: 'a@example.com',
    });
  });
});


