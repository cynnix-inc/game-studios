import { resolveThemeType, THEME_STORAGE_KEY, type UltimateThemeType } from './UltimateTheme';

describe('UltimateTheme (Make theme selection rules)', () => {
  it('uses a stable storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('ultimateSudoku.theme');
  });

  it('resolves device theme to current system scheme', () => {
    expect(resolveThemeType({ selected: 'device', system: 'dark' })).toBe('dark');
    expect(resolveThemeType({ selected: 'device', system: 'light' })).toBe('light');
  });

  it('passes through non-device themes unchanged', () => {
    const cases: UltimateThemeType[] = ['default', 'light', 'dark', 'grayscale', 'vibrant'];
    for (const t of cases) {
      expect(resolveThemeType({ selected: t, system: 'dark' })).toBe(t);
      expect(resolveThemeType({ selected: t, system: 'light' })).toBe(t);
    }
  });
});


