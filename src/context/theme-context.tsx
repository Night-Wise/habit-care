import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  AccentColor,
  buildThemeColors,
  FONT_SCALE_VALUES,
  FontFamilyId,
  FontScaleId,
  resolveFontFamily,
  ThemeColors,
  ThemeMode,
} from '@/theme/colors';

const STORAGE_KEY = '@habit_app_appearance';

export interface AppearancePrefs {
  themeMode: ThemeMode;
  accent: AccentColor;
  fontScale: FontScaleId;
  fontFamily: FontFamilyId;
}

interface ThemeContextValue extends AppearancePrefs {
  colors: ThemeColors;
  resolvedScheme: 'light' | 'dark';
  fontScaleValue: number;
  fontFamilyValue: string | undefined;
  fs: (size: number) => number;
  setThemeMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setFontScale: (scale: FontScaleId) => void;
  setFontFamily: (family: FontFamilyId) => void;
  resetAppearance: () => void;
  isReady: boolean;
}

const DEFAULT_PREFS: AppearancePrefs = {
  themeMode: 'system',
  accent: 'blue',
  fontScale: 'default',
  fontFamily: 'system',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parsePrefs(raw: string | null): AppearancePrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    const themeMode =
      parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system'
        ? parsed.themeMode
        : DEFAULT_PREFS.themeMode;
    const accent =
      parsed.accent === 'purple' || parsed.accent === 'blue' || parsed.accent === 'green'
        ? parsed.accent
        : DEFAULT_PREFS.accent;
    const fontScale =
      parsed.fontScale === 'small' ||
      parsed.fontScale === 'default' ||
      parsed.fontScale === 'large'
        ? parsed.fontScale
        : parsed.fontScale === 'xlarge'
          ? 'large'
          : DEFAULT_PREFS.fontScale;
    const fontFamily = parsed.fontFamily === 'system' ? 'system' : DEFAULT_PREFS.fontFamily;
    return { themeMode, accent, fontScale, fontFamily };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_PREFS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) setPrefs(parsePrefs(raw));
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePrefs = useCallback((patch: Partial<AppearancePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setThemeMode = useCallback(
    (themeMode: ThemeMode) => updatePrefs({ themeMode }),
    [updatePrefs]
  );

  const setAccent = useCallback(
    (accent: AccentColor) => updatePrefs({ accent }),
    [updatePrefs]
  );

  const setFontScale = useCallback(
    (fontScale: FontScaleId) => updatePrefs({ fontScale }),
    [updatePrefs]
  );

  const setFontFamily = useCallback(
    (fontFamily: FontFamilyId) => updatePrefs({ fontFamily }),
    [updatePrefs]
  );

  const resetAppearance = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS)).catch(() => {});
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    prefs.themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : prefs.themeMode;

  const colors = useMemo(
    () => buildThemeColors(prefs.accent, resolvedScheme),
    [prefs.accent, resolvedScheme]
  );

  const fontScaleValue = FONT_SCALE_VALUES[prefs.fontScale];
  const fontFamilyValue = resolveFontFamily(prefs.fontFamily);

  const fs = useCallback((size: number) => Math.round(size * fontScaleValue * 10) / 10, [fontScaleValue]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...prefs,
      colors,
      resolvedScheme,
      fontScaleValue,
      fontFamilyValue,
      fs,
      setThemeMode,
      setAccent,
      setFontScale,
      setFontFamily,
      resetAppearance,
      isReady,
    }),
    [
      prefs,
      colors,
      resolvedScheme,
      fontScaleValue,
      fontFamilyValue,
      fs,
      setThemeMode,
      setAccent,
      setFontScale,
      setFontFamily,
      resetAppearance,
      isReady,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
