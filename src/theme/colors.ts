export type AccentColor = 'purple' | 'blue' | 'green';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScaleId = 'small' | 'default' | 'large';
export type FontFamilyId = 'system';

export interface ThemeColors {
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  background: string;
  card: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  /** App chrome headers — primary in light, pure black in dark (AMOLED). */
  headerBg: string;
  headerText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warningSoft: string;
  overlay: string;
  inputBg: string;
  inactive: string;
  white: string;
  black: string;
}

const ACCENT_LIGHT: Record<AccentColor, Pick<ThemeColors, 'primary' | 'primarySoft' | 'primaryMuted'>> = {
  purple: {
    primary: '#7246F6',
    primarySoft: '#eef0ff',
    primaryMuted: '#ede9fe',
  },
  blue: {
    primary: '#3F5CF5',
    primarySoft: '#dbeafe',
    primaryMuted: '#bfdbfe',
  },
  green: {
    primary: '#1DB162',
    primarySoft: '#d1fae5',
    primaryMuted: '#a7f3d0',
  },
};

const ACCENT_DARK: Record<AccentColor, Pick<ThemeColors, 'primary' | 'primarySoft' | 'primaryMuted'>> = {
  purple: {
    primary: '#8B5CF6',
    primarySoft: '#12121f',
    primaryMuted: '#1a1a2e',
  },
  blue: {
    primary: '#4F6FE8',
    primarySoft: '#0a1220',
    primaryMuted: '#0f1c2e',
  },
  green: {
    primary: '#34D399',
    primarySoft: '#06140f',
    primaryMuted: '#0a1f16',
  },
};

const LIGHT_BASE: Omit<ThemeColors, 'primary' | 'primarySoft' | 'primaryMuted' | 'headerBg'> = {
  background: '#f4f3fb',
  card: '#ffffff',
  surface: '#f8fafc',
  surfaceMuted: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  headerText: '#ffffff',
  danger: '#ef4444',
  dangerSoft: '#fef2f2',
  success: '#10b981',
  successSoft: '#ecfdf5',
  warningSoft: '#fffbeb',
  overlay: 'rgba(15, 23, 42, 0.45)',
  inputBg: '#f9fafb',
  inactive: '#94a3b8',
  white: '#ffffff',
  black: '#000000',
};

/** True black AMOLED palette — pure #000 background to save OLED power. */
const DARK_BASE: Omit<ThemeColors, 'primary' | 'primarySoft' | 'primaryMuted' | 'headerBg'> = {
  background: '#000000',
  card: '#0a0a0a',
  surface: '#111111',
  surfaceMuted: '#161616',
  text: '#f5f5f5',
  textSecondary: '#d4d4d4',
  textMuted: '#a3a3a3',
  border: '#1f1f1f',
  borderStrong: '#2a2a2a',
  headerText: '#ffffff',
  danger: '#f87171',
  dangerSoft: '#1a0808',
  success: '#34d399',
  successSoft: '#04140e',
  warningSoft: '#1a1408',
  overlay: 'rgba(0, 0, 0, 0.72)',
  inputBg: '#111111',
  inactive: '#737373',
  white: '#ffffff',
  black: '#000000',
};

export function buildThemeColors(accent: AccentColor, scheme: 'light' | 'dark'): ThemeColors {
  const accentColors = scheme === 'dark' ? ACCENT_DARK[accent] : ACCENT_LIGHT[accent];
  const base = scheme === 'dark' ? DARK_BASE : LIGHT_BASE;
  return {
    ...base,
    ...accentColors,
    // Light: branded header. Dark: pure black chrome for AMOLED.
    headerBg: scheme === 'dark' ? '#000000' : accentColors.primary,
  };
}

export const FONT_SCALE_VALUES: Record<FontScaleId, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
};

export const FONT_SCALE_LABELS: Record<FontScaleId, string> = {
  small: 'Small',
  default: 'Default',
  large: 'Large',
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  purple: 'Purple',
  blue: 'Blue',
  green: 'Green',
};

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export const FONT_FAMILY_LABELS: Record<FontFamilyId, string> = {
  system: 'System',
};

export function resolveFontFamily(id: FontFamilyId): string | undefined {
  if (id === 'system') return undefined;
  return undefined;
}
