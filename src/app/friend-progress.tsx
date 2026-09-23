import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '@/components/home-screen';
import { MonthlyHabitView } from '@/components/monthly-habit-view';
import type { Todo } from '@/context/todos-context';
import { useTheme } from '@/context/theme-context';
import { fetchFriendTodos } from '@/lib/friends';
import type { ThemeColors } from '@/theme/colors';

export default function FriendProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const email = typeof params.email === 'string' ? params.email : 'Friend';

  const [viewMode, setViewMode] = useState<'daily' | 'month'>('daily');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Missing friend account.');
      setIsLoaded(true);
      return;
    }
    let cancelled = false;
    fetchFriendTodos(userId)
      .then((nextTodos) => {
        if (!cancelled) {
          setTodos(nextTodos);
          setError(null);
        }
      })
      .catch((nextError: any) => {
        if (!cancelled) {
          setError(nextError?.message || "Unable to load this friend's habits.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{email}</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (viewMode === 'daily') {
    return (
      <View style={styles.root}>
        <HomeScreen
          todosOverride={todos}
          isLoadedOverride={isLoaded}
          readOnly
          headerTitle={email}
          headerSubtitle="Read-only progress"
          onBack={() => router.back()}
          emptySubtitle="They have no synced habits yet. Ask them to sync from Settings."
          listBottomPadding={insets.bottom + 88}
        />
        <View style={[styles.switcherDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{email}</Text>
        <Text style={styles.headerSub}>Read-only monthly progress</Text>
      </View>
      <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
      <ScrollView
        style={styles.monthScroll}
        contentContainerStyle={[
          styles.monthWrap,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {!isLoaded ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : todos.length === 0 ? (
          <Text style={styles.loadingText}>No synced habits to show yet.</Text>
        ) : (
          <MonthlyHabitView todos={todos} readOnly />
        )}
      </ScrollView>
    </View>
  );
}

function ViewSwitcher({
  viewMode,
  onChange,
}: {
  viewMode: 'daily' | 'month';
  onChange: (mode: 'daily' | 'month') => void;
}) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  return (
    <View style={styles.viewSwitcher}>
      <TouchableOpacity
        style={[styles.viewOption, viewMode === 'daily' && styles.viewOptionActive]}
        onPress={() => onChange('daily')}
      >
        <Text style={[styles.viewOptionText, viewMode === 'daily' && styles.viewOptionTextActive]}>Daily</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewOption, viewMode === 'month' && styles.viewOptionActive]}
        onPress={() => onChange('month')}
      >
        <Text style={[styles.viewOptionText, viewMode === 'month' && styles.viewOptionTextActive]}>Monthly</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    switcherDock: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    backBtn: {
      marginBottom: 8,
    },
    backText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: fs(16),
      fontWeight: '700',
      fontFamily,
    },
    headerTitle: {
      fontSize: fs(22),
      fontWeight: '800',
      color: colors.headerText,
      fontFamily,
    },
    headerSub: {
      fontSize: fs(13),
      color: 'rgba(255,255,255,0.75)',
      marginTop: 4,
      fontFamily,
    },
    viewSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.primarySoft,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 3,
      borderRadius: 10,
    },
    viewOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 8,
    },
    viewOptionActive: {
      backgroundColor: colors.card,
    },
    viewOptionText: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontWeight: '600',
      fontFamily,
    },
    viewOptionTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    monthScroll: {
      flex: 1,
    },
    monthWrap: {
      padding: 16,
      flexGrow: 1,
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: fs(14),
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 24,
      fontFamily,
    },
    errorText: {
      color: colors.danger,
      fontSize: fs(14),
      padding: 20,
      fontFamily,
    },
  });
}
