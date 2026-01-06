import { fetchWithTimeout } from '@cynnix-studios/game-foundation';

import { trackEvent } from '../telemetry';

jest.mock('@cynnix-studios/supabase', () => ({
  getSupabasePublicEnv: () => ({ url: 'http://example.local', anonKey: 'anon_key_test' }),
}));

jest.mock('@cynnix-studios/game-foundation', () => {
  return {
    fetchWithTimeout: jest.fn(async () => new Response(null, { status: 204 })),
    validateTrackEventInput: (v: unknown) => ({ ok: true, data: v }),
  };
});

jest.mock('../deviceId', () => ({
  getOrCreateDeviceId: async () => 'device_123',
}));

jest.mock('../auth', () => ({
  getAccessToken: async () => null,
}));

describe('telemetry.trackEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = undefined;
  });

  test('no-ops on web when functions URL points at local Supabase (avoids noisy connection errors)', async () => {
    const spy = fetchWithTimeout as unknown as jest.Mock;

    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = 'http://127.0.0.1:54321/functions/v1';
    await trackEvent({ name: 'app_open' });

    expect(spy).toHaveBeenCalledTimes(0);
  });

  test('posts to /track-event with anon headers for guests when using a non-local functions base', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = 'https://example.supabase.co/functions/v1';

    const spy = fetchWithTimeout as unknown as jest.Mock;

    await trackEvent({ name: 'app_open' });

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.supabase.co/functions/v1/track-event');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({
        apikey: 'anon_key_test',
        authorization: 'Bearer anon_key_test',
        'content-type': 'application/json',
      }),
    );
  });
});


