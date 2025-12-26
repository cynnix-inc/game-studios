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
   * Make semantics: percent scale applied to the whole grid stack (S/M/L = 85/100/115).
   */
  gridSizePct: number;
  /**
   * Make semantics: percent scale applied to the main digits (XS..XL = 80..120).
   */
  digitSizePct: number;
  /**
   * Make semantics: percent scale applied to notes (XS..XL = 100..300).
   */
  noteSizePct: number;
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
  // - Grid Size: 85/100/115 (S/M/L)
  // - Digit Size: 80..120 step 10 (XS..XL)
  // - Notes Size: 100..300 step 50 (XS..XL)
  gridSizePct: { min: 85, max: 115, step: 15, default: 100 },
  digitSizePct: { min: 80, max: 120, step: 10, default: 100 },
  noteSizePct: { min: 100, max: 300, step: 50, default: 200 },
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

  const gridSizePct = looksLegacyGrid
    ? // Map 28..56 to S/M/L buckets (85/100/115) with a simple midpoint heuristic.
      rawGrid <= 34
      ? 85
      : rawGrid <= 42
        ? 100
        : 115
    : snapToStep(
        clampFiniteNumber(rawGrid, UI_SIZING_LIMITS.gridSizePct.min, UI_SIZING_LIMITS.gridSizePct.max, UI_SIZING_LIMITS.gridSizePct.default),
        UI_SIZING_LIMITS.gridSizePct.min,
        UI_SIZING_LIMITS.gridSizePct.max,
        UI_SIZING_LIMITS.gridSizePct.step,
        UI_SIZING_LIMITS.gridSizePct.default,
      );

  const digitSizePct = looksLegacyDigit
    ? snapToStep(
        clampFiniteNumber(rawDigit * 100, UI_SIZING_LIMITS.digitSizePct.min, UI_SIZING_LIMITS.digitSizePct.max, UI_SIZING_LIMITS.digitSizePct.default),
        UI_SIZING_LIMITS.digitSizePct.min,
        UI_SIZING_LIMITS.digitSizePct.max,
        UI_SIZING_LIMITS.digitSizePct.step,
        UI_SIZING_LIMITS.digitSizePct.default,
      )
    : snapToStep(
        clampFiniteNumber(rawDigit, UI_SIZING_LIMITS.digitSizePct.min, UI_SIZING_LIMITS.digitSizePct.max, UI_SIZING_LIMITS.digitSizePct.default),
        UI_SIZING_LIMITS.digitSizePct.min,
        UI_SIZING_LIMITS.digitSizePct.max,
        UI_SIZING_LIMITS.digitSizePct.step,
        UI_SIZING_LIMITS.digitSizePct.default,
      );

  const noteSizePct = looksLegacyNote
    ? snapToStep(
        clampFiniteNumber(rawNote * 200, UI_SIZING_LIMITS.noteSizePct.min, UI_SIZING_LIMITS.noteSizePct.max, UI_SIZING_LIMITS.noteSizePct.default),
        UI_SIZING_LIMITS.noteSizePct.min,
        UI_SIZING_LIMITS.noteSizePct.max,
        UI_SIZING_LIMITS.noteSizePct.step,
        UI_SIZING_LIMITS.noteSizePct.default,
      )
    : snapToStep(
        clampFiniteNumber(rawNote, UI_SIZING_LIMITS.noteSizePct.min, UI_SIZING_LIMITS.noteSizePct.max, UI_SIZING_LIMITS.noteSizePct.default),
        UI_SIZING_LIMITS.noteSizePct.min,
        UI_SIZING_LIMITS.noteSizePct.max,
        UI_SIZING_LIMITS.noteSizePct.step,
        UI_SIZING_LIMITS.noteSizePct.default,
      );

  return {
    gridSizePct,
    digitSizePct,
    noteSizePct,
  };
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
  const next: UiSizingSettings = {
    gridSizePct: snapToStep(
      clampFiniteNumber(
        patch.gridSizePct ?? current.gridSizePct,
        UI_SIZING_LIMITS.gridSizePct.min,
        UI_SIZING_LIMITS.gridSizePct.max,
        UI_SIZING_LIMITS.gridSizePct.default,
      ),
      UI_SIZING_LIMITS.gridSizePct.min,
      UI_SIZING_LIMITS.gridSizePct.max,
      UI_SIZING_LIMITS.gridSizePct.step,
      UI_SIZING_LIMITS.gridSizePct.default,
    ),
    digitSizePct: snapToStep(
      clampFiniteNumber(
        patch.digitSizePct ?? current.digitSizePct,
        UI_SIZING_LIMITS.digitSizePct.min,
        UI_SIZING_LIMITS.digitSizePct.max,
        UI_SIZING_LIMITS.digitSizePct.default,
      ),
      UI_SIZING_LIMITS.digitSizePct.min,
      UI_SIZING_LIMITS.digitSizePct.max,
      UI_SIZING_LIMITS.digitSizePct.step,
      UI_SIZING_LIMITS.digitSizePct.default,
    ),
    noteSizePct: snapToStep(
      clampFiniteNumber(
        patch.noteSizePct ?? current.noteSizePct,
        UI_SIZING_LIMITS.noteSizePct.min,
        UI_SIZING_LIMITS.noteSizePct.max,
        UI_SIZING_LIMITS.noteSizePct.default,
      ),
      UI_SIZING_LIMITS.noteSizePct.min,
      UI_SIZING_LIMITS.noteSizePct.max,
      UI_SIZING_LIMITS.noteSizePct.step,
      UI_SIZING_LIMITS.noteSizePct.default,
    ),
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


