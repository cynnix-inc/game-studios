import React from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';

import { makeThemes, type MakeTheme, type MakeThemeType } from '../../theme/makeTheme';
import { THEME_STORAGE_KEY, resolveThemeType, type SystemColorScheme } from '../../ultimate/theme/UltimateTheme';

type MakeThemeContextValue = {
  themeType: MakeThemeType;
  resolvedThemeType: Exclude<MakeThemeType, 'device'>;
  theme: MakeTheme;
  setThemeType: (t: MakeThemeType) => void;
  reducedMotion: boolean | null;
};

const MakeThemeContext = React.createContext<MakeThemeContextValue>({
  themeType: 'default',
  resolvedThemeType: 'default',
  theme: makeThemes.default,
  setThemeType: () => {},
  reducedMotion: null,
});

function readStoredThemeTypeWeb(): MakeThemeType | null {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    // Migration: 'vibrant' was removed; coerce to 'default' to avoid a broken/stuck theme.
    if (v === 'vibrant') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, 'default');
      } catch {
        // ignore
      }
      return 'default';
    }
    if (v === 'default' || v === 'light' || v === 'dark' || v === 'grayscale' || v === 'device') return v;
    return null;
  } catch {
    return null;
  }
}

function writeStoredThemeTypeWeb(t: MakeThemeType): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    // ignore
  }
}

export function MakeThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const system: SystemColorScheme = scheme === 'light' ? 'light' : 'dark';

  const [themeType, setThemeTypeState] = React.useState<MakeThemeType>('default');
  const [reducedMotion, setReducedMotion] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let cleanupWebMotion: (() => void) | null = null;

    // Reduced motion
    void (async () => {
      try {
        const v = await AccessibilityInfo.isReduceMotionEnabled();
        if (!cancelled) setReducedMotion(v);
      } catch {
        if (!cancelled) setReducedMotion(null);
      }
    })();

    // Web fallback for reduced motion: rely on prefers-reduced-motion media query.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => {
          if (!cancelled) setReducedMotion(Boolean(mq.matches));
        };
        sync();
        mq.addEventListener?.('change', sync);
        cleanupWebMotion = () => mq.removeEventListener?.('change', sync);
      } catch {
        // ignore; keep best-effort reducedMotion state
      }
    }

    // Theme persistence (web only; native persistence is a design gap for now)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const stored = readStoredThemeTypeWeb();
      if (stored) setThemeTypeState(stored);
    }

    return () => {
      cancelled = true;
      cleanupWebMotion?.();
    };
  }, []);

  const setThemeType = React.useCallback((t: MakeThemeType) => {
    setThemeTypeState(t);
    if (Platform.OS === 'web' && typeof window !== 'undefined') writeStoredThemeTypeWeb(t);
  }, []);

  const resolvedThemeType = resolveThemeType({ selected: themeType, system });
  const theme = makeThemes[resolvedThemeType];

  const value = React.useMemo<MakeThemeContextValue>(
    () => ({ themeType, resolvedThemeType, theme, setThemeType, reducedMotion }),
    [themeType, resolvedThemeType, theme, setThemeType, reducedMotion],
  );

  return <MakeThemeContext.Provider value={value}>{children}</MakeThemeContext.Provider>;
}

export function useMakeTheme() {
  return React.useContext(MakeThemeContext);
}


