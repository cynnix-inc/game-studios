import { fetchWithTimeout, validateTrackEventInput, type TelemetryEventName, type TelemetryProps, type TelemetryPlatform } from '@cynnix-studios/game-foundation';
import { getSupabasePublicEnv } from '@cynnix-studios/supabase';

import { getOrCreateDeviceId } from './deviceId';
import { getAccessToken } from './auth';

type TrackArgs = {
  name: TelemetryEventName;
  props?: TelemetryProps;
};

function functionsBaseUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return null;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function isReactNativeRuntime(): boolean {
  // RN sets navigator.product = 'ReactNative'. Web/Node do not.
  const nav = (globalThis as unknown as { navigator?: { product?: string } }).navigator;
  return nav?.product === 'ReactNative';
}

async function platform(): Promise<TelemetryPlatform> {
  if (!isReactNativeRuntime()) return 'web';
  // Avoid importing react-native in Node/Jest (it is ESM and breaks Jest parsing).
  const mod = await import('react-native');
  const os = mod.Platform.OS;
  if (os === 'android') return 'android';
  return 'ios';
}

function fallbackId(): string {
  const maybe = globalThis.crypto?.randomUUID?.();
  if (maybe) return maybe;
  const rnd = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

let sessionId: string | null = null;
async function getOrCreateSessionId(): Promise<string> {
  if (sessionId) return sessionId;
  sessionId = fallbackId();
  return sessionId;
}

let disabledForSession = false;

function isLocalDevFunctionsBase(base: string): boolean {
  return (
    base.includes('127.0.0.1:54321/functions/v1') ||
    base.includes('localhost:54321/functions/v1') ||
    base.includes('0.0.0.0:54321/functions/v1')
  );
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const { anonKey } = getSupabasePublicEnv();
  const token = await getAccessToken();
  // Edge Functions often require an Authorization header; for guests, use anon key.
  return {
    apikey: anonKey,
    authorization: `Bearer ${token ?? anonKey}`,
  };
}

export async function trackEvent(args: TrackArgs): Promise<void> {
  const base = functionsBaseUrl();
  if (!base) return;
  if (disabledForSession) return;

  const deviceId = await getOrCreateDeviceId();
  const sid = await getOrCreateSessionId();

  const payload = {
    name: args.name,
    props: args.props ?? {},
    platform: await platform(),
    device_id: deviceId,
    session_id: sid,
    utc_ts_ms: Date.now(),
  };

  const validated = validateTrackEventInput(payload);
  if (!validated.ok) return;

  try {
    await fetchWithTimeout(
      `${base}/track-event`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': fallbackId(),
          ...(await buildAuthHeaders()),
        },
        body: JSON.stringify(validated.data),
      },
      { timeoutMs: 10_000, maxAttempts: 1, idempotent: false },
    );
  } catch {
    // MVP: telemetry is best-effort; never crash the app.
    // Local dev: if Supabase isn't running, avoid repeatedly spamming failing requests.
    if (isLocalDevFunctionsBase(base)) disabledForSession = true;
    return;
  }
}


