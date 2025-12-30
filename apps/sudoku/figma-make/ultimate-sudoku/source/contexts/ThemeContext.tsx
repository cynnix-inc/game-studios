import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'default' | 'light' | 'dark' | 'grayscale' | 'device';

export interface Theme {
  name: string;
  background: string;
  particles: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  card: {
    background: string;
    border: string;
    hover: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  button: {
    primary: {
      background: string;
      hover: string;
      text: string;
    };
    secondary: {
      background: string;
      hover: string;
      text: string;
    };
  };
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
  };
  sudoku: {
    selected: string;
    rowColumn: string;
    box: string;
    sameNumber: string;
    userFilled: string; // Color for user-filled numbers (distinct from pre-filled)
  };
  accent: string;
}

const themes: Record<Exclude<ThemeType, 'device'>, Theme> = {
  default: {
    name: 'Default',
    background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    particles: {
      primary: 'bg-purple-500/20',
      secondary: 'bg-blue-500/20',
      tertiary: 'bg-pink-500/20',
    },
    card: {
      background: 'bg-white/10 backdrop-blur-xl',
      border: 'border-white/20',
      hover: 'hover:bg-white/20',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-white/80',
      muted: 'text-white/60',
    },
    button: {
      primary: {
        background: 'bg-gradient-to-r from-purple-500 to-pink-500',
        hover: 'hover:from-purple-600 hover:to-pink-600',
        text: 'text-white',
      },
      secondary: {
        background: 'bg-white/10',
        hover: 'hover:bg-white/20',
        text: 'text-white',
      },
    },
    input: {
      background: 'bg-white/10',
      border: 'border-white/20',
      text: 'text-white',
      placeholder: 'placeholder:text-white/50',
    },
    sudoku: {
      selected: 'bg-white/20',
      rowColumn: 'bg-white/10',
      box: 'bg-white/5',
      sameNumber: 'bg-white/15',
      userFilled: 'text-cyan-300', // Brighter cyan for better contrast on dark purple background
    },
    accent: 'text-purple-400',
  },
  light: {
    name: 'Light',
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50',
    particles: {
      primary: 'bg-purple-300/30',
      secondary: 'bg-blue-300/30',
      tertiary: 'bg-pink-300/30',
    },
    card: {
      background: 'bg-white/80 backdrop-blur-xl',
      border: 'border-slate-200',
      hover: 'hover:bg-white/90',
    },
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      muted: 'text-slate-500',
    },
    button: {
      primary: {
        background: 'bg-gradient-to-r from-purple-600 to-pink-600',
        hover: 'hover:from-purple-700 hover:to-pink-700',
        text: 'text-white',
      },
      secondary: {
        background: 'bg-slate-200',
        hover: 'hover:bg-slate-300',
        text: 'text-slate-900',
      },
    },
    input: {
      background: 'bg-white/60',
      border: 'border-slate-300',
      text: 'text-slate-900',
      placeholder: 'placeholder:text-slate-400',
    },
    sudoku: {
      selected: 'bg-slate-900/20',
      rowColumn: 'bg-slate-900/10',
      box: 'bg-slate-900/5',
      sameNumber: 'bg-slate-900/15',
      userFilled: 'text-purple-600', // Color for user-filled numbers (distinct from pre-filled)
    },
    accent: 'text-purple-600',
  },
  dark: {
    name: 'Dark',
    background: 'bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-950',
    particles: {
      primary: 'bg-slate-700/20',
      secondary: 'bg-zinc-700/20',
      tertiary: 'bg-gray-700/20',
    },
    card: {
      background: 'bg-white/5 backdrop-blur-xl',
      border: 'border-white/10',
      hover: 'hover:bg-white/10',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      muted: 'text-slate-400',
    },
    button: {
      primary: {
        background: 'bg-white',
        hover: 'hover:bg-slate-100',
        text: 'text-slate-950',
      },
      secondary: {
        background: 'bg-white/10',
        hover: 'hover:bg-white/20',
        text: 'text-white',
      },
    },
    input: {
      background: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-white',
      placeholder: 'placeholder:text-slate-500',
    },
    sudoku: {
      selected: 'bg-white/20',
      rowColumn: 'bg-white/10',
      box: 'bg-white/5',
      sameNumber: 'bg-white/15',
      userFilled: 'text-cyan-400', // Color for user-filled numbers (distinct from pre-filled)
    },
    accent: 'text-slate-300',
  },
  grayscale: {
    name: 'Grayscale',
    background: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    particles: {
      primary: 'bg-gray-600/20',
      secondary: 'bg-gray-500/20',
      tertiary: 'bg-gray-700/20',
    },
    card: {
      background: 'bg-white/10 backdrop-blur-xl',
      border: 'border-white/20',
      hover: 'hover:bg-white/15',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      muted: 'text-gray-400',
    },
    button: {
      primary: {
        background: 'bg-white',
        hover: 'hover:bg-gray-200',
        text: 'text-gray-950',
      },
      secondary: {
        background: 'bg-white/10',
        hover: 'hover:bg-white/20',
        text: 'text-white',
      },
    },
    input: {
      background: 'bg-white/10',
      border: 'border-white/20',
      text: 'text-white',
      placeholder: 'placeholder:text-gray-400',
    },
    sudoku: {
      selected: 'bg-white/20',
      rowColumn: 'bg-white/10',
      box: 'bg-white/5',
      sameNumber: 'bg-white/15',
      userFilled: 'text-gray-300', // Color for user-filled numbers (subtle in grayscale)
    },
    accent: 'text-gray-300',
  },
};

interface ThemeContextType {
  themeType: ThemeType;
  theme: Theme;
  setThemeType: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeType, setThemeTypeState] = useState<ThemeType>('default');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gameTheme') as ThemeType | null;
    if (saved) {
      // Validate the saved theme - if it's invalid, reset to default
      const validThemes: ThemeType[] = ['default', 'light', 'dark', 'grayscale', 'device'];
      if (validThemes.includes(saved)) {
        setThemeTypeState(saved);
      } else {
        // Invalid theme saved (e.g., 'vibrant' which was removed)
        setThemeTypeState('default');
        localStorage.setItem('gameTheme', 'default');
      }
    }
  }, []);

  const setThemeType = (type: ThemeType) => {
    setThemeTypeState(type);
    localStorage.setItem('gameTheme', type);
  };

  // Get the actual theme to use
  const getActiveTheme = (): Theme => {
    if (themeType === 'device') {
      return themes[systemTheme];
    }
    // Fallback to default if theme type is somehow invalid
    return themes[themeType] || themes.default;
  };

  return (
    <ThemeContext.Provider value={{ themeType, theme: getActiveTheme(), setThemeType }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}