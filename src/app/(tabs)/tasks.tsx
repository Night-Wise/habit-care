import { useRouter } from 'expo-router';
import { Bell, Clock, Pencil, Trash2, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthlyHabitView } from '@/components/monthly-habit-view';
import { getCategoryStyle, getIconBg } from '@/components/todo-item';
import { useTodos } from '@/context/todos-context';

function TaskManageItem({
  name,
  icon,
  category,
  timeMinutes,
  priority = 0,
  notificationTime,
  notificationEnabled,
  onEdit,
  onDelete,
  onToggleNotification,
}: {
  name: string;
  icon: string;
  category?: string;
  timeMinutes?: number;
  priority?: number;
  notificationTime?: string;
  notificationEnabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleNotification: () => void;
}) {
  const prioLevel = typeof priority === 'number' && !isNaN(priority) ? priority : 0;
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const categoryStyle = useMemo(() => getCategoryStyle(category), [category]);
  const iconBg = useMemo(() => getIconBg(name || icon), [name, icon]);

  const confirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    onDelete();
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.98, duration: 60, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.taskCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.taskRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Text style={styles.taskIcon}>{icon}</Text>
        </View>

        <View style={styles.taskInfoWrap}>
          <View style={styles.taskMain}>
            <Text style={styles.taskName} numberOfLines={1}>
              {name}
            </Text>

            <View style={styles.metaRow}>
              {notificationTime ? (
                <View style={styles.timingRow}>
                  <Clock size={10} color="#6264FD" />
                  <Text style={styles.timingSubtext}>{notificationTime}</Text>
                </View>
              ) : null}
              {category ? (
                <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
                  <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
                    {category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.badgesCol}>
            {prioLevel > 0 ? (
              <View
                style={[
                  styles.priorityBadge,
                  prioLevel >= 3
                    ? styles.priorityBadgeHigh
                    : prioLevel >= 1
                    ? styles.priorityBadgeMed
                    : styles.priorityBadgeNormal,
                ]}
              >
                <Zap
                  size={9}
                  color={prioLevel >= 3 ? '#dc2626' : prioLevel >= 1 ? '#d97706' : '#64748b'}
                />
                <Text
                  style={[
                    styles.priorityBadgeText,
                    prioLevel >= 3
                      ? styles.priorityBadgeTextHigh
                      : prioLevel >= 1
                      ? styles.priorityBadgeTextMed
                      : styles.priorityBadgeTextNormal,
                  ]}
                >
                  P{prioLevel}
                </Text>
              </View>
            ) : null}

            <View style={styles.timeBadge}>
              <Clock size={10} color="#64748b" />
              <Text style={styles.timeBadgeText}>{timeMinutes ?? 30}m</Text>
            </View>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.bellBtn, notificationEnabled && styles.bellBtnActive]}
            onPress={onToggleNotification}
            hitSlop={6}
          >
            <Bell size={14} color={notificationEnabled ? '#6264FD' : '#94a3b8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={8}
          >
            <Pencil size={14} color="#4f46e5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setIsDeleteConfirmOpen(true)}
            hitSlop={8}
          >
            <Trash2 size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isDeleteConfirmOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={22} color="#dc2626" />
            </View>
            <Text style={styles.confirmTitle}>Delete Task</Text>
            <Text style={styles.confirmSub}>
              Are you sure you want to delete &quot;{name}&quot;?
            </Text>

            <View style={styles.deleteChoiceRow}>
              <TouchableOpacity
                style={styles.cancelChoiceBtn}
                onPress={() => setIsDeleteConfirmOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelChoiceText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { todos, isLoaded, deleteTodo, toggleTodoNotification } = useTodos();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'manage' | 'month'>('manage');

  const total = todos.length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Manage Tasks</Text>
        <Text style={styles.headerSub}>
          {total === 0 ? 'No tasks yet' : `${total} task${total !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={styles.viewSwitcher}>
        <TouchableOpacity
          style={[styles.viewOption, viewMode === 'manage' && styles.viewOptionActive]}
          onPress={() => setViewMode('manage')}
        >
          <Text style={[styles.viewOptionText, viewMode === 'manage' && styles.viewOptionTextActive]}>
            Manage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewOption, viewMode === 'month' && styles.viewOptionActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.viewOptionText, viewMode === 'month' && styles.viewOptionTextActive]}>
            Monthly view
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isLoaded ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Go to Home and tap + to add tasks</Text>
          </View>
        ) : viewMode === 'month' ? (
          <MonthlyHabitView todos={todos} />
        ) : (
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
              onEdit={() =>
                router.push({ pathname: '/edit-todo', params: { id: todo.id } })
              }
              onDelete={() => deleteTodo(todo.id)}
              onToggleNotification={() => toggleTodoNotification(todo.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const PURPLE = '#6264FD';
const BG = '#f8f7ff';
const CARD = '#ffffff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    marginHorizontal: 16,
    marginTop: 14,
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
    backgroundColor: CARD,
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  viewOptionText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  viewOptionTextActive: {
    color: PURPLE,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 6,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(98,100,253,0.04)',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 17,
  },
  taskInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
    minWidth: 0,
  },
  taskMain: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timingSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6264FD',
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  priorityBadgeNormal: {
    backgroundColor: '#f1f5f9',
  },
  priorityBadgeMed: {
    backgroundColor: '#fef3c7',
  },
  priorityBadgeHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadgeTextNormal: {
    color: '#64748b',
  },
  priorityBadgeTextMed: {
    color: '#b45309',
  },
  priorityBadgeTextHigh: {
    color: '#b91c1c',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnActive: {
    backgroundColor: '#eef0ff',
    borderWidth: 1,
    borderColor: '#c7c9fe',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 13,
    color: SUBTEXT,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  deleteChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelChoiceBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelChoiceText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
