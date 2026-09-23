import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHabitTheme, HabitHeatmap } from '@/components/habit-heatmap';
import { HabitIcon } from '@/components/habit-icon';
import { MonthlyHabitView } from '@/components/monthly-habit-view';
import { TaskManageItem } from '@/components/task-manage-item';
import { useTheme } from '@/context/theme-context';
import { getTodoInsights, Todo, useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';

type HabitsTab = 'heatmap' | 'monthly' | 'edit';

function HabitRow({ todo }: { todo: Todo }) {
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
          <View style={styles.streakWrap}>
            <Text style={[styles.streakText, { color: theme.solid }]}>
              🔥 {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
        ) : null}
      </View>

      <HabitHeatmap todo={todo} color={theme.solid} />
    </View>
  );
}

function HabitsTabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: HabitsTab;
  onChange: (tab: HabitsTab) => void;
}) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  return (
    <View style={styles.tabSwitcher}>
      <TouchableOpacity
        style={[styles.tabOption, activeTab === 'heatmap' && styles.tabOptionActive]}
        onPress={() => onChange('heatmap')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabOptionText, activeTab === 'heatmap' && styles.tabOptionTextActive]}>
          Heat Map View
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabOption, activeTab === 'monthly' && styles.tabOptionActive]}
        onPress={() => onChange('monthly')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabOptionText, activeTab === 'monthly' && styles.tabOptionTextActive]}>
          Monthly View
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabOption, activeTab === 'edit' && styles.tabOptionActive]}
        onPress={() => onChange('edit')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabOptionText, activeTab === 'edit' && styles.tabOptionTextActive]}>
          Edit
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HabitsScreen() {
  const { todos, isLoaded, deleteTodo, toggleTodoNotification } = useTodos();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue, resolvedScheme } = useTheme();
  const pageBg = resolvedScheme === 'dark' ? colors.background : colors.white;
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue, pageBg),
    [colors, fs, fontFamilyValue, pageBg]
  );
  const [activeTab, setActiveTab] = useState<HabitsTab>('heatmap');

  const activeCount = todos.length;

  const openEdit = useCallback(
    (todo: Todo) => {
      router.push({ pathname: '/add-or-edit-task', params: { id: todo.id } });
    },
    [router]
  );

  const subtitle =
    activeTab === 'heatmap'
      ? activeCount === 0
        ? 'No active habits'
        : `${activeCount} active habit${activeCount === 1 ? '' : 's'}`
      : activeTab === 'monthly'
        ? 'Month-by-month completion'
        : 'Edit reminders, priority & more';

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={resolvedScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={pageBg}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Habits</Text>
        <View style={styles.subRow}>
          <Text style={styles.subText}>{subtitle}</Text>
        </View>
      </View>

      <HabitsTabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          activeTab === 'edit' && styles.editScrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {!isLoaded ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first habit</Text>
          </View>
        ) : activeTab === 'monthly' ? (
          <MonthlyHabitView todos={todos} />
        ) : activeTab === 'edit' ? (
          todos.map((todo) => (
            <TaskManageItem
              key={todo.id}
              name={todo.name}
              icon={todo.icon}
              category={todo.category}
              timeMinutes={todo.timeMinutes}
              priority={todo.priority}
              notificationTime={todo.notificationTime}
              notificationEnabled={todo.notificationEnabled}
              onEdit={() => openEdit(todo)}
              onDelete={() => deleteTodo(todo.id)}
              onToggleNotification={() => toggleTodoNotification(todo.id)}
            />
          ))
        ) : (
          <View style={styles.listCard}>
            {todos.map((todo, index) => (
              <View key={todo.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <HabitRow todo={todo} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily: string | undefined,
  pageBg: string
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: pageBg,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 10,
      backgroundColor: pageBg,
    },
    title: {
      fontSize: fs(34),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.8,
      fontFamily,
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    subText: {
      fontSize: fs(14),
      fontWeight: '500',
      color: colors.textMuted,
      fontFamily,
    },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 3,
      borderRadius: 12,
    },
    tabOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 4,
      borderRadius: 10,
    },
    tabOptionActive: {
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    tabOptionText: {
      color: colors.textMuted,
      fontSize: fs(12),
      fontWeight: '600',
      textAlign: 'center',
      fontFamily,
    },
    tabOptionTextActive: {
      color: colors.text,
      fontWeight: '700',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
    },
    editScrollContent: {
      gap: 10,
    },
    listCard: {
      backgroundColor: pageBg,
      borderRadius: 22,
      overflow: 'hidden',
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
    iconEmoji: {
      fontSize: 20,
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
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 3,
    },
    streakWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 3,
    },
    streakText: {
      fontSize: fs(12),
      fontWeight: '600',
      fontFamily,
    },
    frequencyText: {
      fontSize: fs(12),
      fontWeight: '500',
      color: colors.textMuted,
      fontFamily,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyEmoji: {
      fontSize: 52,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: fs(18),
      fontWeight: '700',
      color: colors.text,
      fontFamily,
    },
    emptyText: {
      fontSize: fs(16),
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginTop: 40,
      fontFamily,
    },
    emptySub: {
      fontSize: fs(14),
      color: colors.textMuted,
      marginTop: 6,
      fontFamily,
    },
  });
}
