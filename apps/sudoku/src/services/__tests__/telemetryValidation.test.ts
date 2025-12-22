import { validateTrackEventInput } from '@cynnix-studios/game-foundation';

describe('validateTrackEventInput', () => {
  test('accepts a minimal valid event', () => {
    const res = validateTrackEventInput({
      name: 'app_open',
      platform: 'web',
      device_id: 'dev123',
      session_id: 'sess123',
      utc_ts_ms: 1730000000000,
      props: { foo: 'bar', n: 1, b: true, z: null },
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.name).toBe('app_open');
    expect(res.data.platform).toBe('web');
    expect(res.data.device_id).toBe('dev123');
  });

  test('rejects invalid props types', () => {
    const res = validateTrackEventInput({
      name: 'app_open',
      platform: 'web',
      device_id: 'dev123',
      session_id: 'sess123',
      utc_ts_ms: 1730000000000,
      props: { bad: { nested: true } },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('invalid_props');
  });
});


