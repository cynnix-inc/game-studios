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
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = 'http://127.0.0.1:54321/functions/v1';
  });

  test('posts to /track-event with anon headers for guests', async () => {
    const { fetchWithTimeout } = await import('@cynnix-studios/game-foundation');
    const spy = fetchWithTimeout as unknown as jest.Mock;

    await trackEvent({ name: 'app_open' });

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:54321/functions/v1/track-event');
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


