import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHabitTheme, HabitHeatmap } from '@/components/habit-heatmap';
import { HabitIcon } from '@/components/habit-icon';
import { HomeScreen } from '@/components/home-screen';
import { MonthlyHabitView } from '@/components/monthly-habit-view';
import { getTodoInsights, type Todo } from '@/context/todos-context';
import { useTheme } from '@/context/theme-context';
import { fetchFriendTodos } from '@/lib/friends';
import type { ThemeColors } from '@/theme/colors';

type FriendViewMode = 'daily' | 'heatmap' | 'month';

export default function FriendProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const params = useLocalSearchParams<{ userId?: string; email?: string; name?: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const friendName =
    (typeof params.name === 'string' && params.name.trim()) ||
    (typeof params.email === 'string' && params.email.trim()) ||
    'Friend';

  const [viewMode, setViewMode] = useState<FriendViewMode>('daily');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismissScreen = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/friends');
    }
  };

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
          <TouchableOpacity onPress={dismissScreen} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{friendName}</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const subtitle =
    viewMode === 'daily'
      ? 'Read-only progress'
      : viewMode === 'heatmap'
        ? 'Read-only heat map progress'
        : 'Read-only monthly progress';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={dismissScreen} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendName}</Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>

      <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

      {viewMode === 'daily' ? (
        <HomeScreen
          todosOverride={todos}
          isLoadedOverride={isLoaded}
          readOnly
          hideHeader
          emptySubtitle="They have no synced habits yet. Ask them to sync from Settings."
          listBottomPadding={insets.bottom + 24}
        />
      ) : (
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
          ) : viewMode === 'heatmap' ? (
            <View style={styles.listCard}>
              {todos.map((todo, index) => (
                <View key={todo.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <FriendHabitRow todo={todo} />
                </View>
              ))}
            </View>
          ) : (
            <MonthlyHabitView todos={todos} readOnly />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function FriendHabitRow({ todo }: { todo: Todo }) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const theme = useMemo(() => getHabitTheme(todo.name || todo.icon || todo.id), [todo]);
  const insights = useMemo(() => getTodoInsights(todo), [todo]);
  const streak = insights.currentStreak;

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: theme.soft }]}>
        <HabitIcon icon={todo.icon} size={20} color={theme.solid} strokeWidth={2.2} />
      </View>
      <View style={styles.info}>
        <Text style={styles.habitName} numberOfLines={1}>
          {todo.name}
        </Text>
        {streak > 0 ? (
          <Text style={[styles.streakText, { color: theme.solid }]}>
            🔥 {streak} {streak === 1 ? 'day' : 'days'}
          </Text>
        ) : null}
      </View>
      <HabitHeatmap todo={todo} color={theme.solid} />
    </View>
  );
}

function ViewSwitcher({
  viewMode,
  onChange,
}: {
  viewMode: FriendViewMode;
  onChange: (mode: FriendViewMode) => void;
}) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  const options: { key: FriendViewMode; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'heatmap', label: 'Heat Map' },
    { key: 'month', label: 'Monthly' },
  ];

  return (
    <View style={styles.viewSwitcher}>
      {options.map(({ key, label }) => {
        const isActive = viewMode === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.viewOption, isActive && styles.viewOptionActive]}
            onPress={() => onChange(key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewOptionText, isActive && styles.viewOptionTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    viewOptionActive: {
      backgroundColor: colors.card,
    },
    viewOptionText: {
      color: colors.textMuted,
      fontSize: fs(12),
      fontWeight: '600',
      fontFamily,
      textAlign: 'center',
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
    listCard: {
      backgroundColor: colors.card,
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderStrong,
      marginLeft: 68,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    info: {
      flex: 1,
      minWidth: 0,
      marginRight: 10,
    },
    habitName: {
      fontSize: fs(16),
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
      fontFamily,
    },
    streakText: {
      fontSize: fs(12),
      fontWeight: '600',
      marginTop: 3,
      fontFamily,
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
