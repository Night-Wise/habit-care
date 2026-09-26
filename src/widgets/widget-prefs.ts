import AsyncStorage from '@react-native-async-storage/async-storage';

export const WIDGET_ENABLED_KEY = '@habit-app/monthly-heatmap-widget-enabled';
export const WIDGET_THEME_KEY = '@habit-app/monthly-heatmap-widget-theme';

export type WidgetThemeMode = 'system' | 'light' | 'dark';

let cachedEnabled: boolean | null = null;
let cachedTheme: WidgetThemeMode | null = null;

function parseTheme(raw: string | null): WidgetThemeMode {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export async function getMonthlyHeatmapWidgetEnabled(): Promise<boolean> {
  if (cachedEnabled !== null) return cachedEnabled;
  try {
    const raw = await AsyncStorage.getItem(WIDGET_ENABLED_KEY);
    // Default on when unset
    cachedEnabled = raw !== '0' && raw !== 'false';
  } catch {
    cachedEnabled = true;
  }
  return cachedEnabled;
}

export async function setMonthlyHeatmapWidgetEnabled(
  enabled: boolean
): Promise<void> {
  cachedEnabled = enabled;
  await AsyncStorage.setItem(WIDGET_ENABLED_KEY, enabled ? '1' : '0');
}

export async function getMonthlyHeatmapWidgetTheme(): Promise<WidgetThemeMode> {
  if (cachedTheme !== null) return cachedTheme;
  try {
    const raw = await AsyncStorage.getItem(WIDGET_THEME_KEY);
    cachedTheme = parseTheme(raw);
  } catch {
    cachedTheme = 'system';
  }
  return cachedTheme;
}

export async function setMonthlyHeatmapWidgetTheme(
  theme: WidgetThemeMode
): Promise<void> {
  cachedTheme = theme;
  await AsyncStorage.setItem(WIDGET_THEME_KEY, theme);
}

export async function getMonthlyHeatmapWidgetPrefs(): Promise<{
  enabled: boolean;
  theme: WidgetThemeMode;
}> {
  const [enabled, theme] = await Promise.all([
    getMonthlyHeatmapWidgetEnabled(),
    getMonthlyHeatmapWidgetTheme(),
  ]);
  return { enabled, theme };
}
