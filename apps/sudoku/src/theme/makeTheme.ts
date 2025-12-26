export type MakeTheme = {
  backgroundGradient: [string, string, string];
  particles: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  card: {
    background: string;
    border: string;
  };
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  button: {
    primaryGradient: [string, string];
    secondaryBackground: string;
    border: string;
    textOnPrimary: string;
    textOnSecondary: string;
  };
  accent: string;
};

export type MakeThemeType = 'default' | 'light' | 'dark' | 'grayscale' | 'vibrant' | 'device';

/**
 * Figma Make “current” theme (glassmorphism) port.
 *
 * Source: Make `ThemeContext.tsx` class intent + Make web styling.
 * NOTE: Make uses Tailwind color tokens (e.g., slate-900, purple-500). Here we
 * map them to hex using Tailwind's default palette. If the Make file is using
 * a customized Tailwind config, these values may differ (documented as a gap).
 */
const makeThemeDefault: MakeTheme = {
  // bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
  backgroundGradient: ['#0f172a', '#581c87', '#0f172a'],

  // bg-*-500/20
  particles: {
    primary: 'rgba(168, 85, 247, 0.20)', // purple-500
    secondary: 'rgba(59, 130, 246, 0.20)', // blue-500
    tertiary: 'rgba(236, 72, 153, 0.20)', // pink-500
  },

  // bg-white/10, border-white/20
  card: {
    background: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
  },

  // Make: theme.input.*
  input: {
    background: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
    text: '#ffffff',
    placeholder: 'rgba(255, 255, 255, 0.60)',
  },

  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.80)',
    muted: 'rgba(255, 255, 255, 0.60)',
  },

  button: {
    // bg-gradient-to-r from-purple-500 to-pink-500
    primaryGradient: ['#a855f7', '#ec4899'],
    secondaryBackground: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
    textOnPrimary: '#ffffff',
    textOnSecondary: '#ffffff',
  },

  // text-purple-400
  accent: '#c084fc',
};

const makeThemeLight: MakeTheme = {
  // bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50
  backgroundGradient: ['#f8fafc', '#eff6ff', '#faf5ff'],
  particles: {
    primary: 'rgba(196, 181, 253, 0.30)', // purple-300/30
    secondary: 'rgba(147, 197, 253, 0.30)', // blue-300/30
    tertiary: 'rgba(249, 168, 212, 0.30)', // pink-300/30
  },
  card: {
    background: 'rgba(255, 255, 255, 0.80)',
    border: '#e2e8f0',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.60)',
    border: '#e2e8f0',
    text: '#0f172a',
    placeholder: '#64748b',
  },
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    muted: '#64748b',
  },
  button: {
    primaryGradient: ['#9333ea', '#db2777'], // purple-600 -> pink-600
    secondaryBackground: '#e2e8f0',
    border: '#cbd5e1',
    textOnPrimary: '#ffffff',
    textOnSecondary: '#0f172a',
  },
  accent: '#9333ea',
};

const makeThemeDark: MakeTheme = {
  // bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-950
  backgroundGradient: ['#09090b', '#020617', '#09090b'],
  particles: {
    primary: 'rgba(51, 65, 85, 0.20)', // slate-700/20
    secondary: 'rgba(63, 63, 70, 0.20)', // zinc-700/20
    tertiary: 'rgba(55, 65, 81, 0.20)', // gray-700/20
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.10)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.10)',
    text: '#ffffff',
    placeholder: '#94a3b8',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
  },
  button: {
    primaryGradient: ['#ffffff', '#ffffff'],
    secondaryBackground: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.10)',
    textOnPrimary: '#020617',
    textOnSecondary: '#ffffff',
  },
  accent: '#cbd5e1',
};

const makeThemeGrayscale: MakeTheme = {
  // bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
  backgroundGradient: ['#111827', '#1f2937', '#111827'],
  particles: {
    primary: 'rgba(75, 85, 99, 0.20)', // gray-600/20
    secondary: 'rgba(107, 114, 128, 0.20)', // gray-500/20
    tertiary: 'rgba(55, 65, 81, 0.20)', // gray-700/20
  },
  card: {
    background: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
    text: '#ffffff',
    placeholder: '#9ca3af',
  },
  text: {
    primary: '#ffffff',
    secondary: '#d1d5db',
    muted: '#9ca3af',
  },
  button: {
    primaryGradient: ['#ffffff', '#ffffff'],
    secondaryBackground: 'rgba(255, 255, 255, 0.10)',
    border: 'rgba(255, 255, 255, 0.20)',
    textOnPrimary: '#111827',
    textOnSecondary: '#ffffff',
  },
  accent: '#d1d5db',
};

const makeThemeVibrant: MakeTheme = {
  // Vibrant (Make docs): bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600
  backgroundGradient: ['#c026d3', '#9333ea', '#4f46e5'],
  // Particles: Yellow, cyan, pink (30% opacity)
  particles: {
    primary: 'rgba(250, 204, 21, 0.30)', // yellow-400/30
    secondary: 'rgba(34, 211, 238, 0.30)', // cyan-400/30
    tertiary: 'rgba(236, 72, 153, 0.30)', // pink-500/30
  },
  // Cards: white/15 with blur
  card: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.20)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.20)',
    text: '#ffffff',
    placeholder: 'rgba(255, 255, 255, 0.70)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    muted: 'rgba(255, 255, 255, 0.70)',
  },
  button: {
    // Primary button: yellow-to-orange gradient, dark text (Make docs)
    primaryGradient: ['#facc15', '#f97316'], // yellow-400 -> orange-500
    secondaryBackground: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.20)',
    textOnPrimary: '#111827', // gray-900-ish
    textOnSecondary: '#ffffff',
  },
  // Accent: yellow-300
  accent: '#fde047',
};

export const makeThemes: Record<Exclude<MakeThemeType, 'device'>, MakeTheme> = {
  default: makeThemeDefault,
  light: makeThemeLight,
  dark: makeThemeDark,
  grayscale: makeThemeGrayscale,
  vibrant: makeThemeVibrant,
};

// Back-compat alias (existing imports). Prefer `useMakeTheme()` moving forward.
export const makeThemeCurrent: MakeTheme = makeThemes.default;


