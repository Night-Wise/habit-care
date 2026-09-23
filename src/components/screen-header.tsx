import { useMemo } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: 24,
      paddingBottom: 14,
    },
    title: {
      fontSize: fs(22),
      fontWeight: '800',
      color: colors.headerText,
      letterSpacing: -0.5,
      fontFamily,
    },
    subtitle: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.75)',
      marginTop: 4,
      fontFamily,
    },
  });
}
