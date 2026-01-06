export type SudokuSettingsV1 = {
  schemaVersion: 1;
  kind: 'sudoku_settings';
  /**
   * Client-side monotonic-ish timestamp. Used for LWW merge.
   */
  updatedAtMs: number;
  /**
   * Stable per-install device id; used as a deterministic tiebreaker when timestamps match.
   */
  updatedByDeviceId: string;
  /**
   * Extensible payload. We keep known namespaces optional for MVP plumbing.
   */
  ui?: {
    gridSize?: unknown;
    numberFontScale?: unknown;
    noteFontScale?: unknown;
    highlightContrast?: unknown;
    highlightAssistance?: unknown;
  };
  toggles?: {
    sound?: unknown;
    haptics?: unknown;
    music?: unknown;
    notifications?: unknown;
    autoCandidates?: unknown;
    autoAdvance?: unknown;
    zenMode?: unknown;
  };
  extra?: Record<string, unknown>;
};

export type UiSizingSettings = {
  /**
   * Make semantics: percent scale applied to the whole grid stack (S/M/L/XL = 80/100/120/140).
   */
  gridSizePct: number;
  /**
   * Make semantics: percent scale applied to the main digits (XS/S/M/L/XL = 70/85/100/130/170).
   */
  digitSizePct: number;
  /**
   * Make semantics: percent scale applied to notes (XS/S/M/L/XL = 120/160/200/250/300).
   */
  noteSizePct: number;
};

export type GridHighlightSettings = {
  /**
   * Make semantics: 0=Off, 100=Normal, 150=High, 200=Max
   */
  highlightContrast: number;
  /**
   * When false, row/col/box/same-number highlights are disabled (selection still shows).
   */
  highlightAssistance: boolean;
};

export type SettingsToggles = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  autoCandidates: boolean;
  autoAdvance: boolean;
  zenMode: boolean;
};

export const UI_SIZING_LIMITS = {
  // Figma Make (Ultimate Sudoku) slider semantics:
  // - Grid Size: 80/100/120/140 (S/M/L/XL)
  // - Digit Size: 70/85/100/130/170 (XS/S/M/L/XL)
  // - Notes Size: 120/160/200/250/300 (XS/S/M/L/XL)
  gridSizePct: { allowed: [80, 100, 120, 140] as const, default: 100 },
  digitSizePct: { allowed: [70, 85, 100, 130, 170] as const, default: 100 },
  noteSizePct: { allowed: [120, 160, 200, 250, 300] as const, default: 200 },
} as const;

export const HIGHLIGHT_LIMITS = {
  contrast: { min: 0, max: 200, step: 50, default: 100 },
} as const;

const TOGGLES_DEFAULTS: SettingsToggles = {
  soundEnabled: true,
  hapticsEnabled: true,
  musicEnabled: true,
  notificationsEnabled: false,
  // Make reference defaults this to Off (less visual noise).
  autoCandidates: false,
  autoAdvance: false,
  zenMode: false,
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function clampFiniteNumber(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function snapToStep(v: number, min: number, max: number, step: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback;
  const clamped = Math.max(min, Math.min(max, v));
  const snapped = Math.round((clamped - min) / step) * step + min;
  // Re-clamp after snapping to avoid rounding drift
  return Math.max(min, Math.min(max, snapped));
}

function snapToAllowed(v: number, allowed: readonly number[], fallback: number): number {
  if (!Number.isFinite(v)) return fallback;
  let best = allowed[0] ?? fallback;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const a of allowed) {
    const d = Math.abs(v - a);
    if (d < bestDist) {
      bestDist = d;
      best = a;
      continue;
    }
    // tie-breaker: prefer the larger (feels better when dragging right)
    if (d === bestDist && a > best) best = a;
  }
  return best;
}

function allowedMin(allowed: readonly number[], fallback: number): number {
  let m = Number.POSITIVE_INFINITY;
  for (const a of allowed) m = Math.min(m, a);
  return Number.isFinite(m) ? m : fallback;
}

function allowedMax(allowed: readonly number[], fallback: number): number {
  let m = Number.NEGATIVE_INFINITY;
  for (const a of allowed) m = Math.max(m, a);
  return Number.isFinite(m) ? m : fallback;
}

function readBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export const AUDIO_LIMITS = {
  volume: { min: 0, max: 100, step: 1, default: 70 },
  musicVolume: { min: 0, max: 100, step: 1, default: 40 },
} as const;

export type AudioSettings = {
  soundVolume: number; // 0..100
  musicVolume: number; // 0..100
};

export type HintMode = 'direct' | 'logic' | 'assist' | 'escalate';

export type GameplaySettings = {
  hintMode: HintMode;
  livesLimit: number; // 0..11 (11 = infinity)
};

const GAMEPLAY_DEFAULTS: GameplaySettings = {
  hintMode: 'direct',
  livesLimit: 11,
};

function readHintMode(v: unknown, fallback: HintMode): HintMode {
  if (v === 'direct' || v === 'logic' || v === 'assist' || v === 'escalate') return v;
  return fallback;
}

export function isSudokuSettingsV1(v: unknown): v is SudokuSettingsV1 {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.kind !== 'sudoku_settings') return false;
  if (typeof v.updatedAtMs !== 'number' || !Number.isFinite(v.updatedAtMs)) return false;
  if (typeof v.updatedByDeviceId !== 'string' || v.updatedByDeviceId.length === 0) return false;
  return true;
}

export function getUiSizingSettings(settings: SudokuSettingsV1): UiSizingSettings {
  const ui = settings.ui;
  const rawGrid = ui?.gridSize;
  const rawDigit = ui?.numberFontScale;
  const rawNote = ui?.noteFontScale;

  // Backward-compatible migration:
  // - legacy gridSize was a px-ish cell size (28..56). Convert to Make's S/M/L percent scale.
  // - legacy numberFontScale was a multiplier (~0.85..1.35). Convert to percent 80..120.
  // - legacy noteFontScale was a multiplier (~0.7..1.25). Convert to percent 100..300 (mapped via 1.0 -> 200).
  const looksLegacyGrid = typeof rawGrid === 'number' && Number.isFinite(rawGrid) && rawGrid <= 60;
  const looksLegacyDigit = typeof rawDigit === 'number' && Number.isFinite(rawDigit) && rawDigit <= 2.5;
  const looksLegacyNote = typeof rawNote === 'number' && Number.isFinite(rawNote) && rawNote <= 3;

  const gridAllowed = UI_SIZING_LIMITS.gridSizePct.allowed as readonly number[];
  const gridMin = allowedMin(gridAllowed, UI_SIZING_LIMITS.gridSizePct.default);
  const gridMax = allowedMax(gridAllowed, UI_SIZING_LIMITS.gridSizePct.default);
  const gridSizePct = looksLegacyGrid
    ? // Map 28..56 to S/M/L buckets (80/100/120); legacy never reached XL.
      rawGrid <= 34
      ? 80
      : rawGrid <= 42
        ? 100
        : 120
    : snapToAllowed(clampFiniteNumber(rawGrid, gridMin, gridMax, UI_SIZING_LIMITS.gridSizePct.default), gridAllowed, UI_SIZING_LIMITS.gridSizePct.default);

  const digitAllowed = UI_SIZING_LIMITS.digitSizePct.allowed as readonly number[];
  const digitMin = allowedMin(digitAllowed, UI_SIZING_LIMITS.digitSizePct.default);
  const digitMax = allowedMax(digitAllowed, UI_SIZING_LIMITS.digitSizePct.default);
  const digitSizePct = looksLegacyDigit
    ? snapToAllowed(clampFiniteNumber(rawDigit * 100, digitMin, digitMax, UI_SIZING_LIMITS.digitSizePct.default), digitAllowed, UI_SIZING_LIMITS.digitSizePct.default)
    : snapToAllowed(clampFiniteNumber(rawDigit, digitMin, digitMax, UI_SIZING_LIMITS.digitSizePct.default), digitAllowed, UI_SIZING_LIMITS.digitSizePct.default);

  const noteAllowed = UI_SIZING_LIMITS.noteSizePct.allowed as readonly number[];
  const noteMin = allowedMin(noteAllowed, UI_SIZING_LIMITS.noteSizePct.default);
  const noteMax = allowedMax(noteAllowed, UI_SIZING_LIMITS.noteSizePct.default);
  const noteSizePct = looksLegacyNote
    ? snapToAllowed(clampFiniteNumber(rawNote * 200, noteMin, noteMax, UI_SIZING_LIMITS.noteSizePct.default), noteAllowed, UI_SIZING_LIMITS.noteSizePct.default)
    : snapToAllowed(clampFiniteNumber(rawNote, noteMin, noteMax, UI_SIZING_LIMITS.noteSizePct.default), noteAllowed, UI_SIZING_LIMITS.noteSizePct.default);

  return {
    gridSizePct,
    digitSizePct,
    noteSizePct,
  };
}

export function getGridHighlightSettings(settings: SudokuSettingsV1): GridHighlightSettings {
  const ui = settings.ui;
  const rawContrast = ui?.highlightContrast;
  const rawAssist = ui?.highlightAssistance;

  const highlightContrast = snapToStep(
    clampFiniteNumber(rawContrast, HIGHLIGHT_LIMITS.contrast.min, HIGHLIGHT_LIMITS.contrast.max, HIGHLIGHT_LIMITS.contrast.default),
    HIGHLIGHT_LIMITS.contrast.min,
    HIGHLIGHT_LIMITS.contrast.max,
    HIGHLIGHT_LIMITS.contrast.step,
    HIGHLIGHT_LIMITS.contrast.default,
  );

  const highlightAssistance = readBool(rawAssist, highlightContrast > 0);

  return { highlightContrast, highlightAssistance };
}

export function getSettingsToggles(settings: SudokuSettingsV1): SettingsToggles {
  const t = settings.toggles;
  return {
    soundEnabled: readBool(t?.sound, TOGGLES_DEFAULTS.soundEnabled),
    hapticsEnabled: readBool(t?.haptics, TOGGLES_DEFAULTS.hapticsEnabled),
    musicEnabled: readBool(t?.music, TOGGLES_DEFAULTS.musicEnabled),
    notificationsEnabled: readBool(t?.notifications, TOGGLES_DEFAULTS.notificationsEnabled),
    autoCandidates: readBool(t?.autoCandidates, TOGGLES_DEFAULTS.autoCandidates),
    autoAdvance: readBool(t?.autoAdvance, TOGGLES_DEFAULTS.autoAdvance),
    zenMode: readBool(t?.zenMode, TOGGLES_DEFAULTS.zenMode),
  };
}

export function getAudioSettings(settings: SudokuSettingsV1): AudioSettings {
  const a = isObject(settings.extra) ? settings.extra.audio : undefined;
  const audio = isObject(a) ? a : undefined;
  return {
    soundVolume: clampFiniteNumber(audio?.soundVolume, AUDIO_LIMITS.volume.min, AUDIO_LIMITS.volume.max, AUDIO_LIMITS.volume.default),
    musicVolume: clampFiniteNumber(audio?.musicVolume, AUDIO_LIMITS.musicVolume.min, AUDIO_LIMITS.musicVolume.max, AUDIO_LIMITS.musicVolume.default),
  };
}

export function setAudioSettings(
  settings: SudokuSettingsV1,
  patch: Partial<AudioSettings>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const current = getAudioSettings(settings);
  const next: AudioSettings = {
    soundVolume: clampFiniteNumber(
      patch.soundVolume ?? current.soundVolume,
      AUDIO_LIMITS.volume.min,
      AUDIO_LIMITS.volume.max,
      AUDIO_LIMITS.volume.default,
    ),
    musicVolume: clampFiniteNumber(
      patch.musicVolume ?? current.musicVolume,
      AUDIO_LIMITS.musicVolume.min,
      AUDIO_LIMITS.musicVolume.max,
      AUDIO_LIMITS.musicVolume.default,
    ),
  };

  const extra = isObject(settings.extra) ? settings.extra : {};
  const audio = isObject(extra.audio) ? extra.audio : {};

  return {
    ...settings,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    extra: {
      ...extra,
      audio: {
        ...audio,
        soundVolume: next.soundVolume,
        musicVolume: next.musicVolume,
      },
    },
  };
}

export function getGameplaySettings(settings: SudokuSettingsV1): GameplaySettings {
  const g = isObject(settings.extra) ? settings.extra.gameplay : undefined;
  const gameplay = isObject(g) ? g : undefined;
  return {
    hintMode: readHintMode(gameplay?.hintMode, GAMEPLAY_DEFAULTS.hintMode),
    livesLimit: clampFiniteNumber(gameplay?.livesLimit, 0, 11, GAMEPLAY_DEFAULTS.livesLimit),
  };
}

export function setGameplaySettings(
  settings: SudokuSettingsV1,
  patch: Partial<GameplaySettings>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const current = getGameplaySettings(settings);
  const next: GameplaySettings = {
    hintMode: readHintMode(patch.hintMode ?? current.hintMode, GAMEPLAY_DEFAULTS.hintMode),
    livesLimit: clampFiniteNumber(patch.livesLimit ?? current.livesLimit, 0, 11, GAMEPLAY_DEFAULTS.livesLimit),
  };

  const extra = isObject(settings.extra) ? settings.extra : {};
  const gameplay = isObject(extra.gameplay) ? extra.gameplay : {};

  return {
    ...settings,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    extra: {
      ...extra,
      gameplay: {
        ...gameplay,
        hintMode: next.hintMode,
        livesLimit: next.livesLimit,
      },
    },
  };
}

export function setUiSizingSettings(
  settings: SudokuSettingsV1,
  patch: Partial<UiSizingSettings>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const current = getUiSizingSettings(settings);
  const gridAllowed = UI_SIZING_LIMITS.gridSizePct.allowed as readonly number[];
  const digitAllowed = UI_SIZING_LIMITS.digitSizePct.allowed as readonly number[];
  const noteAllowed = UI_SIZING_LIMITS.noteSizePct.allowed as readonly number[];
  const next: UiSizingSettings = {
    gridSizePct: snapToAllowed(patch.gridSizePct ?? current.gridSizePct, gridAllowed, UI_SIZING_LIMITS.gridSizePct.default),
    digitSizePct: snapToAllowed(patch.digitSizePct ?? current.digitSizePct, digitAllowed, UI_SIZING_LIMITS.digitSizePct.default),
    noteSizePct: snapToAllowed(patch.noteSizePct ?? current.noteSizePct, noteAllowed, UI_SIZING_LIMITS.noteSizePct.default),
  };

  return {
    ...settings,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    ui: {
      ...(isObject(settings.ui) ? settings.ui : undefined),
      // Persist Make units into the existing keys to avoid schema bump.
      gridSize: next.gridSizePct,
      numberFontScale: next.digitSizePct,
      noteFontScale: next.noteSizePct,
    },
  };
}

export function setGridCustomizationSettings(
  settings: SudokuSettingsV1,
  patch: Partial<UiSizingSettings & GridHighlightSettings>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const nextSizing = setUiSizingSettings(
    settings,
    { gridSizePct: patch.gridSizePct, digitSizePct: patch.digitSizePct, noteSizePct: patch.noteSizePct },
    args,
  );

  const currentHighlights = getGridHighlightSettings(nextSizing);
  const nextHighlightContrast = snapToStep(
    clampFiniteNumber(
      patch.highlightContrast ?? currentHighlights.highlightContrast,
      HIGHLIGHT_LIMITS.contrast.min,
      HIGHLIGHT_LIMITS.contrast.max,
      HIGHLIGHT_LIMITS.contrast.default,
    ),
    HIGHLIGHT_LIMITS.contrast.min,
    HIGHLIGHT_LIMITS.contrast.max,
    HIGHLIGHT_LIMITS.contrast.step,
    HIGHLIGHT_LIMITS.contrast.default,
  );
  const nextHighlightAssistance =
    typeof patch.highlightAssistance === 'boolean' ? patch.highlightAssistance : nextHighlightContrast > 0;

  return {
    ...nextSizing,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    ui: {
      ...(isObject(nextSizing.ui) ? nextSizing.ui : undefined),
      highlightContrast: nextHighlightContrast,
      highlightAssistance: nextHighlightAssistance,
    },
  };
}

export function setSettingsToggles(
  settings: SudokuSettingsV1,
  patch: Partial<SettingsToggles>,
  args: { updatedByDeviceId: string; updatedAtMs: number },
): SudokuSettingsV1 {
  const current = getSettingsToggles(settings);
  const next: SettingsToggles = {
    soundEnabled: patch.soundEnabled ?? current.soundEnabled,
    hapticsEnabled: patch.hapticsEnabled ?? current.hapticsEnabled,
    musicEnabled: patch.musicEnabled ?? current.musicEnabled,
    notificationsEnabled: patch.notificationsEnabled ?? current.notificationsEnabled,
    autoCandidates: patch.autoCandidates ?? current.autoCandidates,
    autoAdvance: patch.autoAdvance ?? current.autoAdvance,
    zenMode: patch.zenMode ?? current.zenMode,
  };

  return {
    ...settings,
    updatedAtMs: args.updatedAtMs,
    updatedByDeviceId: args.updatedByDeviceId,
    toggles: {
      ...(isObject(settings.toggles) ? settings.toggles : undefined),
      sound: next.soundEnabled,
      haptics: next.hapticsEnabled,
      music: next.musicEnabled,
      notifications: next.notificationsEnabled,
      autoCandidates: next.autoCandidates,
      autoAdvance: next.autoAdvance,
      zenMode: next.zenMode,
    },
  };
}

export function mergeSettingsLww(local: SudokuSettingsV1, remote: SudokuSettingsV1): SudokuSettingsV1 {
  if (remote.updatedAtMs > local.updatedAtMs) return remote;
  if (remote.updatedAtMs < local.updatedAtMs) return local;
  // Deterministic tie-breaker: higher device id wins.
  return remote.updatedByDeviceId > local.updatedByDeviceId ? remote : local;
}


