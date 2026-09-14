import { useRouter } from 'expo-router';
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Pencil, Trash2, X, Zap } from 'lucide-react-native';
import { Fragment, useState } from 'react';
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

import { formatDateKey, isTodoCompleted, Todo, useTodos } from '@/context/todos-context';

function getMonthDays(monthDate: Date): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return days;
}

function getTodoStartDateKey(todo: Todo): string {
  const firstTickKey = Object.keys(todo.completions || {})
    .filter((dateKey) => todo.completions?.[dateKey] === true)
    .filter((dateKey) => dateKey <= formatDateKey(new Date()))
    .sort()[0];

  return firstTickKey || formatDateKey(new Date());
}

function getMonthlyCompletionStats(todo: Todo, days: Date[], todayKey: string) {
  const startDateKey = getTodoStartDateKey(todo);
  const trackedDays = days.filter((day) => {
    const dateKey = formatDateKey(day);
    return dateKey >= startDateKey && dateKey <= todayKey;
  });
  const completedDays = trackedDays.filter((day) =>
    isTodoCompleted(todo, formatDateKey(day))
  ).length;

  return {
    startDateKey,
    trackedDays,
    completedDays,
    completionPercentage: trackedDays.length
      ? Math.round((completedDays / trackedDays.length) * 100)
      : 0,
  };
}

function MonthlyTable({
  todos,
  monthDate,
  sortBy,
  sortDirection,
  groupByCategory,
}: {
  todos: Todo[];
  monthDate: Date;
  sortBy: 'completion' | 'priority';
  sortDirection: 'asc' | 'desc';
  groupByCategory: boolean;
}) {
  const days = getMonthDays(monthDate);
  const todayKey = formatDateKey(new Date());
  const getCategoryLabel = (todo: Todo) => todo.category?.trim() || 'Uncategorized';
  const sortedTodos = [...todos].sort((firstTodo, secondTodo) => {
    if (groupByCategory) {
      const categoryOrder = getCategoryLabel(firstTodo).localeCompare(getCategoryLabel(secondTodo));
      if (categoryOrder !== 0) return categoryOrder;
    }

    const firstValue = sortBy === 'completion'
      ? getMonthlyCompletionStats(firstTodo, days, todayKey).completionPercentage
      : firstTodo.priority ?? 0;
    const secondValue = sortBy === 'completion'
      ? getMonthlyCompletionStats(secondTodo, days, todayKey).completionPercentage
      : secondTodo.priority ?? 0;

    return sortDirection === 'desc' ? secondValue - firstValue : firstValue - secondValue;
  });
  const monthlyStats = todos.map((todo) => getMonthlyCompletionStats(todo, days, todayKey));
  const monthlyCompletedTotal = monthlyStats.reduce((sum, stats) => sum + stats.completedDays, 0);
  const monthlyTrackedTotal = monthlyStats.reduce((sum, stats) => sum + stats.trackedDays.length, 0);
  const monthlyPercentage = monthlyTrackedTotal
    ? Math.round((monthlyCompletedTotal / monthlyTrackedTotal) * 100)
    : 0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.monthTable}>
        <View style={styles.monthHeaderRow}>
          <View style={[styles.monthTaskColumn, styles.monthHeaderCell]}>
            <Text style={styles.monthHeaderText}>Task</Text>
          </View>
          {days.map((day) => {
            const dateKey = formatDateKey(day);
            return (
              <View
                key={dateKey}
                style={[styles.monthDayColumn, dateKey === todayKey && styles.todayColumn]}
              >
                <Text style={styles.monthDayName}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                </Text>
                <Text style={styles.monthDayNumber}>{day.getDate()}</Text>
              </View>
            );
          })}
          <View style={[styles.monthSummaryColumn, styles.monthHeaderCell]}>
            <Text style={styles.monthHeaderText}>Summary</Text>
          </View>
        </View>

        {sortedTodos.map((todo, index) => {
          const { startDateKey, trackedDays, completedDays, completionPercentage } =
            getMonthlyCompletionStats(todo, days, todayKey);
          const priority = typeof todo.priority === 'number' && !isNaN(todo.priority)
            ? todo.priority
            : 0;
          const categoryLabel = getCategoryLabel(todo);
          const previousCategory = index > 0 ? getCategoryLabel(sortedTodos[index - 1]) : null;
          const showCategoryHeader = groupByCategory && categoryLabel !== previousCategory;

          return (
          <Fragment key={todo.id}>
            {showCategoryHeader && (
              <View style={styles.monthCategoryHeader}>
                <Text style={styles.monthCategoryHeaderText}>{categoryLabel}</Text>
              </View>
            )}
            <View style={styles.monthDataRow}>
              <View style={styles.monthTaskColumn}>
                <Text style={styles.monthTaskIcon}>{todo.icon}</Text>
                <Text style={styles.monthTaskName} numberOfLines={1}>{todo.name}</Text>
                <Text style={styles.monthTaskPriority}>P{priority}</Text>
              </View>
              {days.map((day) => {
                const dateKey = formatDateKey(day);
                const isBeforeStart = dateKey < startDateKey;
                const isFuture = dateKey > todayKey;
                const isDone = !isBeforeStart && !isFuture && isTodoCompleted(todo, dateKey);

                return (
                  <View
                    key={`${todo.id}-${dateKey}`}
                    style={[
                      styles.monthDayColumn,
                      styles.monthStatusCell,
                      dateKey === todayKey && styles.todayColumn,
                    ]}
                  >
                    {isDone ? (
                      <Check size={14} color="#059669" strokeWidth={3} />
                    ) : isBeforeStart || isFuture ? (
                      <Text style={styles.futureMark}>-</Text>
                    ) : (
                      <X size={13} color="#ef4444" strokeWidth={2.5} />
                    )}
                  </View>
                );
              })}
              <View style={styles.monthSummaryColumn}>
                <Text style={styles.monthSummaryText}>
                  {completedDays}/{trackedDays.length} ({completionPercentage}%)
                </Text>
              </View>
            </View>
          </Fragment>
          );
        })}
        <View style={styles.monthTotalsRow}>
          <View style={styles.monthTaskColumn}>
            <Text style={styles.monthTotalsLabel}>Totals</Text>
          </View>
          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const activeTodos = todos.filter((todo) => {
              const startDateKey = getTodoStartDateKey(todo);
              return dateKey >= startDateKey && dateKey <= todayKey;
            });
            const completedTodos = activeTodos.filter((todo) =>
              isTodoCompleted(todo, dateKey)
            ).length;

            return (
              <View
                key={`total-${dateKey}`}
                style={[
                  styles.monthDayColumn,
                  styles.monthTotalsCell,
                  dateKey === todayKey && styles.todayColumn,
                ]}
              >
                {activeTodos.length > 0 ? (
                  <Text style={styles.monthTotalsText}>
                    {completedTodos}/{activeTodos.length}
                  </Text>
                ) : (
                  <Text style={styles.futureMark}>-</Text>
                )}
              </View>
            );
          })}
          <View style={styles.monthSummaryColumn}>
            <Text style={styles.monthTotalsText}>
              {monthlyCompletedTotal}/{monthlyTrackedTotal} ({monthlyPercentage}%)
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function TaskManageItem({
  id,
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
  id: string;
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

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

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
        {/* Icon + name + time */}
        <View style={styles.taskLeft}>
          <Text style={styles.taskIcon}>{icon}</Text>
          <View style={styles.taskNameWrap}>
            <Text style={styles.taskName} numberOfLines={1}>
              {name}
            </Text>
            {category ? <Text style={styles.taskCategory}>{category}</Text> : null}
            <View style={styles.badgesRow}>
              {/* Priority badge */}
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
                  size={10}
                  color={
                    prioLevel >= 3 ? '#dc2626' : prioLevel >= 1 ? '#d97706' : '#64748b'
                  }
                  style={{ marginRight: 2 }}
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

              {notificationTime ? (
                <Text style={styles.timingSubtext}>⏰ {notificationTime}</Text>
              ) : null}
              <View style={styles.timeBadge}>
                <Clock size={11} color="#64748b" style={{ marginRight: 3 }} />
                <Text style={styles.timeBadgeText}>{timeMinutes ?? 30}m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.bellBtn,
              notificationEnabled && styles.bellBtnActive,
            ]}
            onPress={onToggleNotification}
            hitSlop={6}
          >
            <Bell size={16} color={notificationEnabled ? '#6366f1' : '#94a3b8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={8}
          >
            <Pencil size={16} color="#4f46e5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            hitSlop={8}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={isDeleteConfirmOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.confirmIcon}>🗑️</Text>
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
  const [sortBy, setSortBy] = useState<'completion' | 'priority'>('completion');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const total = todos.length;
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isCurrentMonth = monthDate.getTime() >= currentMonth.getTime();

  const changeMonth = (offset: number) => {
    setMonthDate((previousMonth) => {
      const nextMonth = new Date(previousMonth);
      nextMonth.setMonth(nextMonth.getMonth() + offset);
      return nextMonth;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Header */}
      <View style={styles.header}>
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
          <View style={styles.monthView}>
            <View style={styles.monthToolbar}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => changeMonth(-1)}
                accessibilityLabel="Previous month"
              >
                <ChevronLeft size={20} color={TEXT} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
                onPress={() => !isCurrentMonth && changeMonth(1)}
                disabled={isCurrentMonth}
                accessibilityLabel="Next month"
              >
                <ChevronRight size={20} color={isCurrentMonth ? '#cbd5e1' : TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.sortRow}>
              <View style={styles.sortCriteria}>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'completion' && styles.sortOptionActive]}
                  onPress={() => setSortBy('completion')}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'completion' && styles.sortOptionTextActive]}>
                    Done %
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === 'priority' && styles.sortOptionActive]}
                  onPress={() => setSortBy('priority')}
                >
                  <Text style={[styles.sortOptionText, sortBy === 'priority' && styles.sortOptionTextActive]}>
                    Priority
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.sortDirection}
                onPress={() => setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}
                accessibilityLabel="Change sort direction"
              >
                {sortDirection === 'desc' ? (
                  <ChevronDown size={15} color={PURPLE} />
                ) : (
                  <ChevronUp size={15} color={PURPLE} />
                )}
                <Text style={styles.sortDirectionText}>
                  {sortDirection === 'desc'
                    ? sortBy === 'completion' ? 'Highest % first' : 'Highest priority first'
                    : sortBy === 'completion' ? 'Lowest % first' : 'Lowest priority first'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.categoryToggle, groupByCategory && styles.categoryToggleActive]}
              onPress={() => setGroupByCategory((current) => !current)}
              accessibilityLabel="Toggle grouping by category"
            >
              <Text style={[styles.categoryToggleText, groupByCategory && styles.categoryToggleTextActive]}>
                {groupByCategory ? 'Grouped by category' : 'Group by category'}
              </Text>
            </TouchableOpacity>
            <View style={styles.legendRow}>
              <Text style={styles.legendText}><Check size={13} color="#059669" /> Done</Text>
              <Text style={styles.legendText}><X size={13} color="#cbd5e1" /> Not done</Text>
            </View>
            <MonthlyTable
              todos={todos}
              monthDate={monthDate}
              sortBy={sortBy}
              sortDirection={sortDirection}
              groupByCategory={groupByCategory}
            />
          </View>
        ) : (
          todos.map((todo) => (
            <TaskManageItem
              key={todo.id}
              id={todo.id}
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

const PURPLE = '#6366f1';
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
    paddingTop: 16,
    paddingBottom: 24,
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
  monthView: {
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  monthToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  monthArrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
  },
  monthArrowDisabled: {
    backgroundColor: '#f8fafc',
  },
  monthTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  sortCriteria: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  sortOption: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortOptionActive: {
    backgroundColor: CARD,
  },
  sortOptionText: {
    color: SUBTEXT,
    fontSize: 11,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: PURPLE,
    fontWeight: '800',
  },
  sortDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingLeft: 6,
  },
  sortDirectionText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryToggle: {
    alignSelf: 'flex-start',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryToggleActive: {
    backgroundColor: '#eef2ff',
  },
  categoryToggleText: {
    color: SUBTEXT,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryToggleTextActive: {
    color: PURPLE,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  legendText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    color: SUBTEXT,
    fontSize: 11,
    fontWeight: '600',
  },
  monthTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  monthDataRow: {
    flexDirection: 'row',
  },
  monthCategoryHeader: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#eef2ff',
    borderBottomWidth: 1,
    borderColor: '#c7d2fe',
  },
  monthCategoryHeaderText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthTotalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  monthTaskColumn: {
    width: 132,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthHeaderCell: {
    minHeight: 48,
  },
  monthHeaderText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },
  monthDayColumn: {
    width: 34,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthSummaryColumn: {
    width: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  todayColumn: {
    backgroundColor: '#fffbeb',
  },
  monthDayName: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  monthDayNumber: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  monthStatusCell: {
    minHeight: 46,
  },
  monthTotalsCell: {
    minHeight: 46,
  },
  monthTaskIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  monthTaskName: {
    flex: 1,
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
  },
  monthTotalsLabel: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },
  monthTaskPriority: {
    color: '#b45309',
    backgroundColor: '#fef3c7',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },
  futureMark: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  monthSummaryText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
  },
  monthTotalsText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: '800',
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
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  taskNameWrap: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  taskCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE,
    marginTop: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
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
    fontSize: 11,
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
  timingSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  confirmIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
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
