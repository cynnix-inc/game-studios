export type TelemetryPlatform = 'web' | 'android' | 'ios';

export type TelemetryEventName =
  | 'app_open'
  | 'start_freeplay'
  | 'start_daily'
  | 'complete_puzzle'
  | 'abandon_puzzle'
  | 'hint_used'
  | 'sign_in_success'
  | 'convert_guest_to_account'
  | 'leaderboard_view'
  | 'daily_rank_resolved';

export type TelemetryPropValue = string | number | boolean | null;
export type TelemetryProps = Record<string, TelemetryPropValue>;

export type TrackEventInput = {
  name: TelemetryEventName;
  platform: TelemetryPlatform;
  device_id: string;
  session_id: string;
  utc_ts_ms: number;
  props?: TelemetryProps;
  app_version?: string | null;
};

export type TrackEventValidationErrorCode =
  | 'invalid_name'
  | 'invalid_platform'
  | 'invalid_device_id'
  | 'invalid_session_id'
  | 'invalid_utc_ts_ms'
  | 'invalid_props'
  | 'invalid_app_version';

export type TrackEventValidationError = {
  code: TrackEventValidationErrorCode;
  message: string;
};

const allowedNames: Record<TelemetryEventName, true> = {
  app_open: true,
  start_freeplay: true,
  start_daily: true,
  complete_puzzle: true,
  abandon_puzzle: true,
  hint_used: true,
  sign_in_success: true,
  convert_guest_to_account: true,
  leaderboard_view: true,
  daily_rank_resolved: true,
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPlatform(v: unknown): v is TelemetryPlatform {
  return v === 'web' || v === 'android' || v === 'ios';
}

function isAllowedName(v: unknown): v is TelemetryEventName {
  return typeof v === 'string' && (allowedNames as Record<string, true | undefined>)[v] === true;
}

export function validateTrackEventInput(input: unknown): { ok: true; data: TrackEventInput } | { ok: false; error: TrackEventValidationError } {
  if (!isObject(input)) {
    return { ok: false, error: { code: 'invalid_name', message: 'Invalid event payload' } };
  }
  const name = input.name;
  if (!isAllowedName(name)) return { ok: false, error: { code: 'invalid_name', message: 'Invalid name' } };

  const platform = input.platform;
  if (!isPlatform(platform)) return { ok: false, error: { code: 'invalid_platform', message: 'Invalid platform' } };

  const deviceId = input.device_id;
  if (!isNonEmptyString(deviceId)) return { ok: false, error: { code: 'invalid_device_id', message: 'Invalid device_id' } };

  const sessionId = input.session_id;
  if (!isNonEmptyString(sessionId)) return { ok: false, error: { code: 'invalid_session_id', message: 'Invalid session_id' } };

  const utcTs = input.utc_ts_ms;
  if (typeof utcTs !== 'number' || !Number.isFinite(utcTs) || utcTs <= 0) {
    return { ok: false, error: { code: 'invalid_utc_ts_ms', message: 'Invalid utc_ts_ms' } };
  }

  const appVersion = input.app_version;
  if (!(appVersion == null || typeof appVersion === 'string')) {
    return { ok: false, error: { code: 'invalid_app_version', message: 'Invalid app_version' } };
  }

  const props = input.props;
  if (!(props == null || isObject(props))) return { ok: false, error: { code: 'invalid_props', message: 'Invalid props' } };
  if (props != null) {
    for (const [k, v] of Object.entries(props)) {
      if (k.length === 0) return { ok: false, error: { code: 'invalid_props', message: 'Invalid props' } };
      if (v === null) continue;
      const t = typeof v;
      if (t === 'string' || t === 'number' || t === 'boolean') continue;
      return { ok: false, error: { code: 'invalid_props', message: 'Invalid props' } };
    }
  }

  return {
    ok: true,
    data: {
      name,
      platform,
      device_id: deviceId.trim(),
      session_id: sessionId.trim(),
      utc_ts_ms: utcTs,
      props: (props as TelemetryProps | undefined) ?? undefined,
      app_version: (appVersion as string | null | undefined) ?? undefined,
    },
  };
}


