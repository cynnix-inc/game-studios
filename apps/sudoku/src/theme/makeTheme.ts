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

/**
 * Figma Make “current” theme (glassmorphism) port.
 *
 * Source: Make `ThemeContext.tsx` class intent + Make web styling.
 * NOTE: Make uses Tailwind color tokens (e.g., slate-900, purple-500). Here we
 * map them to hex using Tailwind's default palette. If the Make file is using
 * a customized Tailwind config, these values may differ (documented as a gap).
 */
export const makeThemeCurrent: MakeTheme = {
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


