export type RuntimeEnv = 'local' | 'staging' | 'prod';

function readPublicEnv(): RuntimeEnv | null {
  // IMPORTANT: Expo web only inlines statically-referenced EXPO_PUBLIC_* keys.
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'local' || raw === 'staging' || raw === 'prod') return raw;
  return null;
}

export function getRuntimeEnv(): RuntimeEnv {
  // Local dev builds (Metro) should always be treated as local.
  const dev = typeof __DEV__ !== 'undefined' && __DEV__ === true;
  if (dev) return 'local';

  // For release builds, prefer explicit env.
  const e = readPublicEnv();
  return e ?? 'prod';
}

export function isDevToolsAllowed(): boolean {
  const env = getRuntimeEnv();
  return env === 'local' || env === 'staging';
}


