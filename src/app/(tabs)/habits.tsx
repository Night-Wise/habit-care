import { useRouter } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHabitTheme, HabitHeatmap } from '@/components/habit-heatmap';
import { MonthlyHabitView } from '@/components/monthly-habit-view';
import { TaskManageItem } from '@/components/task-manage-item';
import { getTodoInsights, Todo, useTodos } from '@/context/todos-context';

type HabitsTab = 'heatmap' | 'monthly' | 'edit';

function HabitRow({
  todo,
  onLongPress,
}: {
  todo: Todo;
  onLongPress: () => void;
}) {
  const theme = useMemo(() => getHabitTheme(todo.name || todo.icon || todo.id), [todo]);
  const insights = useMemo(() => getTodoInsights(todo), [todo]);
  const streak = insights.currentStreak;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.soft }]}>
        <Text style={styles.iconEmoji}>{todo.icon}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.habitName} numberOfLines={1}>
          {todo.name}
        </Text>
        <View style={styles.metaRow}>
          {streak > 0 ? (
            <View style={styles.streakWrap}>
              <RefreshCw size={11} color={theme.solid} strokeWidth={2.5} />
              <Text style={[styles.streakText, { color: theme.solid }]}>
                {streak} {streak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          ) : null}
          <Text style={styles.frequencyText}>Every day</Text>
        </View>
      </View>

      <HabitHeatmap todo={todo} color={theme.solid} />
    </Pressable>
  );
}

function HabitsTabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: HabitsTab;
  onChange: (tab: HabitsTab) => void;
}) {
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
  const [activeTab, setActiveTab] = useState<HabitsTab>('heatmap');
  const [actionTodo, setActionTodo] = useState<Todo | null>(null);

  const activeCount = todos.length;

  const openEdit = useCallback(
    (todo: Todo) => {
      router.push({ pathname: '/add-or-edit-task', params: { id: todo.id } });
    },
    [router]
  );

  const confirmDelete = useCallback(
    (todo: Todo) => {
      Alert.alert('Delete habit', `Are you sure you want to delete "${todo.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTodo(todo.id),
        },
      ]);
    },
    [deleteTodo]
  );

  const showActions = useCallback(
    (todo: Todo) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Edit', 'Delete'],
            destructiveButtonIndex: 2,
            cancelButtonIndex: 0,
            title: todo.name,
          },
          (index) => {
            if (index === 1) openEdit(todo);
            if (index === 2) confirmDelete(todo);
          }
        );
        return;
      }
      setActionTodo(todo);
    },
    [confirmDelete, openEdit]
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
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Habits</Text>
        <View style={styles.subRow}>
          <Text style={styles.subText}>{subtitle}</Text>
          {activeTab === 'heatmap' && activeCount > 0 ? (
            <Text style={styles.subText}>Hold for actions</Text>
          ) : null}
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
                <HabitRow
                  todo={todo}
                  onLongPress={() => showActions(todo)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!actionTodo}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTodo(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setActionTodo(null)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {actionTodo?.name}
            </Text>
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                const todo = actionTodo;
                setActionTodo(null);
                if (todo) openEdit(todo);
              }}
            >
              <Text style={styles.sheetBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                const todo = actionTodo;
                setActionTodo(null);
                if (todo) confirmDelete(todo);
              }}
            >
              <Text style={[styles.sheetBtnText, styles.sheetBtnDanger]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetCancel]}
              onPress={() => setActionTodo(null)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const BG = '#ffffff';
const CARD = '#f4f4f5';
const TEXT = '#111111';
const SUBTEXT = '#9ca3af';
const ACCENT = '#2563eb';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: BG,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    fontWeight: '500',
    color: SUBTEXT,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: CARD,
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
    backgroundColor: BG,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  tabOptionText: {
    color: SUBTEXT,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabOptionTextActive: {
    color: TEXT,
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
    backgroundColor: CARD,
    borderRadius: 22,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e4e7',
    marginLeft: 68,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowPressed: {
    backgroundColor: '#ececee',
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
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.2,
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
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: SUBTEXT,
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
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    marginTop: 40,
  },
  emptySub: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 6,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sheetBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  sheetBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
  },
  sheetBtnDanger: {
    color: '#dc2626',
  },
  sheetCancel: {
    marginTop: 4,
    backgroundColor: CARD,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
});
