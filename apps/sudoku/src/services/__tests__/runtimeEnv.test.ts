import { getRuntimeEnv, isDevToolsAllowed } from '../runtimeEnv';

describe('runtimeEnv', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  test('defaults to prod when EXPO_PUBLIC_APP_ENV is missing (non-dev)', () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    expect(getRuntimeEnv()).toBe('prod');
    expect(isDevToolsAllowed()).toBe(false);
  });

  test('allows dev tools in staging when EXPO_PUBLIC_APP_ENV=staging', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'staging';
    expect(getRuntimeEnv()).toBe('staging');
    expect(isDevToolsAllowed()).toBe(true);
  });
});


