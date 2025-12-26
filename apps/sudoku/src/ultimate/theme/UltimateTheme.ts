export type SystemColorScheme = 'light' | 'dark';

// Mirrors the Make file’s ThemeContext.tsx (note: Make uses 'default', not 'current').
export type UltimateThemeType = 'default' | 'light' | 'dark' | 'grayscale' | 'vibrant' | 'device';

export const THEME_STORAGE_KEY = 'ultimateSudoku.theme';

export function resolveThemeType(args: {
  selected: UltimateThemeType;
  system: SystemColorScheme;
}): Exclude<UltimateThemeType, 'device'> {
  if (args.selected === 'device') return args.system;
  return args.selected;
}


