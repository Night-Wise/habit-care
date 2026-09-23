import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  RotateCcw,
  Save,
  X,
} from 'lucide-react-native';
import { Fragment, createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getHabitTheme } from '@/components/habit-heatmap';
import { HabitIcon } from '@/components/habit-icon';
import { useTheme } from '@/context/theme-context';
import { formatDateKey, isTodoCompleted, Todo, useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';

const MONTHLY_VIEW_PREFS_KEY = '@habit-app/monthly-view-prefs';

type MonthlySortBy = 'completion' | 'priority';
type MonthlySortDirection = 'asc' | 'desc';

type MonthlyViewPrefs = {
  sortBy: MonthlySortBy;
  sortDirection: MonthlySortDirection;
  groupByCategory: boolean;
};

const DEFAULT_MONTHLY_VIEW_PREFS: MonthlyViewPrefs = {
  sortBy: 'completion',
  sortDirection: 'desc',
  groupByCategory: false,
};

function parseMonthlyViewPrefs(raw: string | null): MonthlyViewPrefs {
  if (!raw) return DEFAULT_MONTHLY_VIEW_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<MonthlyViewPrefs>;
    return {
      sortBy: parsed.sortBy === 'priority' ? 'priority' : 'completion',
      sortDirection: parsed.sortDirection === 'asc' ? 'asc' : 'desc',
      groupByCategory: parsed.groupByCategory === true,
    };
  } catch {
    return DEFAULT_MONTHLY_VIEW_PREFS;
  }
}

type MonthlyViewStyles = ReturnType<typeof createStyles>;
const MonthlyViewStylesContext = createContext<MonthlyViewStyles | null>(null);

function useMonthlyViewStyles() {
  const ctx = useContext(MonthlyViewStylesContext);
  if (!ctx) {
    throw new Error('useMonthlyViewStyles must be used within MonthlyHabitView');
  }
  return ctx;
}

function draftKey(todoId: string, dateKey: string) {
  return `${todoId}::${dateKey}`;
}

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

function getCompletionTone(percentage: number, hasTracked: boolean) {
  if (!hasTracked) {
    return { bg: '#f1f5f9', text: '#64748b', fill: '#cbd5e1' };
  }
  if (percentage >= 90) {
    return { bg: '#d1fae5', text: '#047857', fill: '#10b981' };
  }
  if (percentage >= 75) {
    return { bg: '#dcfce7', text: '#15803d', fill: '#22c55e' };
  }
  if (percentage >= 60) {
    return { bg: '#ecfccb', text: '#4d7c0f', fill: '#84cc16' };
  }
  if (percentage >= 45) {
    return { bg: '#fef9c3', text: '#a16207', fill: '#eab308' };
  }
  if (percentage >= 30) {
    return { bg: '#ffedd5', text: '#c2410c', fill: '#f97316' };
  }
  if (percentage >= 15) {
    return { bg: '#fee2e2', text: '#b91c1c', fill: '#ef4444' };
  }
  return { bg: '#fecaca', text: '#991b1b', fill: '#dc2626' };
}

function getPriorityTone(priority: number) {
  if (priority >= 5) {
    return { bg: '#dc2626', text: '#ffffff' }; // dark-red
  }
  if (priority >= 3) {
    return { bg: '#fee2e2', text: '#b91c1c' }; // red
  }
  if (priority >= 2) {
    return { bg: '#ffedd5', text: '#c2410c' }; // orange
  }
  return { bg: '#fef9c3', text: '#a16207' }; // yellow
}

function sortTodos(
  todos: Todo[],
  days: Date[],
  todayKey: string,
  sortBy: 'completion' | 'priority',
  sortDirection: 'asc' | 'desc',
  groupByCategory: boolean
) {
  const getCategoryLabel = (todo: Todo) => todo.category?.trim() || 'Uncategorized';
  return [...todos].sort((firstTodo, secondTodo) => {
    if (groupByCategory) {
      const categoryOrder = getCategoryLabel(firstTodo).localeCompare(getCategoryLabel(secondTodo));
      if (categoryOrder !== 0) return categoryOrder;
    }

    const firstValue =
      sortBy === 'completion'
        ? getMonthlyCompletionStats(firstTodo, days, todayKey).completionPercentage
        : firstTodo.priority ?? 0;
    const secondValue =
      sortBy === 'completion'
        ? getMonthlyCompletionStats(secondTodo, days, todayKey).completionPercentage
        : secondTodo.priority ?? 0;

    return sortDirection === 'desc' ? secondValue - firstValue : firstValue - secondValue;
  });
}

const DayCell = memo(function DayCell({
  todoId,
  todoName,
  dateKey,
  initialDone,
  isEditable,
  showAsEmpty,
  isToday,
  onToggle,
  resetToken,
}: {
  todoId: string;
  todoName: string;
  dateKey: string;
  initialDone: boolean;
  isEditable: boolean;
  showAsEmpty: boolean;
  isToday: boolean;
  onToggle?: (todoId: string, dateKey: string, nextCompleted: boolean) => void;
  resetToken: number;
}) {
  const styles = useMonthlyViewStyles();
  const [done, setDone] = useState(initialDone);

  useEffect(() => {
    setDone(initialDone);
  }, [initialDone, resetToken]);

  const content = (
    <View
      style={[
        styles.monthDayColumn,
        styles.monthStatusCell,
        isToday && styles.todayColumn,
        isEditable && styles.editableCell,
        isEditable && done && styles.editableCellDone,
      ]}
    >
      {done && !showAsEmpty ? (
        <View style={[styles.statusMarkCircle, styles.statusMarkDone]}>
          <Check size={12} color="#059669" strokeWidth={3} />
        </View>
      ) : showAsEmpty ? (
        <View style={[styles.statusMarkCircle, styles.statusMarkEmpty]}>
          <Text style={styles.futureMark}>-</Text>
        </View>
      ) : (
        <View style={[styles.statusMarkCircle, styles.statusMarkMissed]}>
          <X size={11} color="#ef4444" strokeWidth={2.5} />
        </View>
      )}
    </View>
  );

  if (!isEditable || !onToggle) {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={() => {
        const next = !done;
        setDone(next);
        onToggle(todoId, dateKey, next);
      }}
      activeOpacity={0.7}
      accessibilityLabel={`${done ? 'Unmark' : 'Mark'} ${todoName} on ${dateKey}`}
    >
      {content}
    </TouchableOpacity>
  );
});

function MonthlyTable({
  todos,
  orderedTodos,
  days,
  todayKey,
  groupByCategory,
  isEditing,
  onToggleCell,
  resetToken,
}: {
  todos: Todo[];
  orderedTodos: Todo[];
  days: Date[];
  todayKey: string;
  groupByCategory: boolean;
  isEditing: boolean;
  onToggleCell?: (todoId: string, dateKey: string, nextCompleted: boolean) => void;
  resetToken: number;
}) {
  const styles = useMonthlyViewStyles();
  const getCategoryLabel = (todo: Todo) => todo.category?.trim() || 'Uncategorized';

  const monthlyStats = useMemo(
    () => todos.map((todo) => getMonthlyCompletionStats(todo, days, todayKey)),
    [todos, days, todayKey]
  );
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

        {orderedTodos.map((todo, index) => {
          const { startDateKey, trackedDays, completedDays, completionPercentage } =
            getMonthlyCompletionStats(todo, days, todayKey);
          const priority =
            typeof todo.priority === 'number' && !isNaN(todo.priority) ? todo.priority : 0;
          const priorityTone = priority > 0 ? getPriorityTone(priority) : null;
          const categoryLabel = getCategoryLabel(todo);
          const previousCategory =
            index > 0 ? getCategoryLabel(orderedTodos[index - 1]) : null;
          const showCategoryHeader = groupByCategory && categoryLabel !== previousCategory;
          const summaryTone = getCompletionTone(completionPercentage, trackedDays.length > 0);

          return (
            <Fragment key={todo.id}>
              {showCategoryHeader && (
                <View style={styles.monthCategoryHeader}>
                  <Text style={styles.monthCategoryHeaderText}>{categoryLabel}</Text>
                </View>
              )}
              <View style={styles.monthDataRow}>
                <View style={styles.monthTaskColumn}>
                  <View style={styles.monthTaskIcon}>
                    <HabitIcon
                      icon={todo.icon}
                      size={14}
                      color={getHabitTheme(todo.name || todo.icon || todo.id).solid}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text style={styles.monthTaskName} numberOfLines={1}>
                    {todo.name}
                  </Text>
                  {priorityTone ? (
                    <Text
                      style={[
                        styles.monthTaskPriority,
                        {
                          color: priorityTone.text,
                          backgroundColor: priorityTone.bg,
                        },
                      ]}
                    >
                      P{priority}
                    </Text>
                  ) : null}
                </View>
                {days.map((day) => {
                  const dateKey = formatDateKey(day);
                  const isFuture = dateKey > todayKey;
                  const isBeforeStart = dateKey < startDateKey;
                  const isEditable = isEditing && !isFuture;
                  const showAsEmpty = !isEditable && (isBeforeStart || isFuture);
                  const initialDone =
                    !showAsEmpty && isTodoCompleted(todo, dateKey);

                  return (
                    <DayCell
                      key={`${todo.id}-${dateKey}`}
                      todoId={todo.id}
                      todoName={todo.name}
                      dateKey={dateKey}
                      initialDone={initialDone}
                      isEditable={isEditable}
                      showAsEmpty={showAsEmpty}
                      isToday={dateKey === todayKey}
                      onToggle={onToggleCell}
                      resetToken={resetToken}
                    />
                  );
                })}
                <View style={[styles.monthSummaryColumn, { backgroundColor: summaryTone.bg }]}>
                  <Text style={[styles.monthSummaryText, { color: summaryTone.text }]}>
                    {completedDays}/{trackedDays.length} ({completionPercentage}%)
                  </Text>
                  <View style={styles.summaryProgressTrack}>
                    <View
                      style={[
                        styles.summaryProgressFill,
                        {
                          width: `${trackedDays.length > 0 ? completionPercentage : 0}%`,
                          backgroundColor: summaryTone.fill,
                        },
                      ]}
                    />
                  </View>
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
          {(() => {
            const totalsTone = getCompletionTone(monthlyPercentage, monthlyTrackedTotal > 0);
            return (
              <View style={[styles.monthSummaryColumn, { backgroundColor: totalsTone.bg }]}>
                <Text style={[styles.monthTotalsText, { color: totalsTone.text }]}>
                  {monthlyCompletedTotal}/{monthlyTrackedTotal} ({monthlyPercentage}%)
                </Text>
                <View style={styles.summaryProgressTrack}>
                  <View
                    style={[
                      styles.summaryProgressFill,
                      {
                        width: `${monthlyTrackedTotal > 0 ? monthlyPercentage : 0}%`,
                        backgroundColor: totalsTone.fill,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })()}
        </View>
      </View>
    </ScrollView>
  );
}

export function MonthlyHabitView({
  todos,
  readOnly = false,
}: {
  todos: Todo[];
  readOnly?: boolean;
}) {
  const { applyCompletionEdits } = useTodos();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const [sortBy, setSortBy] = useState<MonthlySortBy>(DEFAULT_MONTHLY_VIEW_PREFS.sortBy);
  const [sortDirection, setSortDirection] = useState<MonthlySortDirection>(
    DEFAULT_MONTHLY_VIEW_PREFS.sortDirection
  );
  const [groupByCategory, setGroupByCategory] = useState(
    DEFAULT_MONTHLY_VIEW_PREFS.groupByCategory
  );
  const [prefsReady, setPrefsReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [frozenOrderIds, setFrozenOrderIds] = useState<string[] | null>(null);
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const draftRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MONTHLY_VIEW_PREFS_KEY);
        if (cancelled) return;
        const prefs = parseMonthlyViewPrefs(raw);
        setSortBy(prefs.sortBy);
        setSortDirection(prefs.sortDirection);
        setGroupByCategory(prefs.groupByCategory);
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setPrefsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    const prefs: MonthlyViewPrefs = { sortBy, sortDirection, groupByCategory };
    void AsyncStorage.setItem(MONTHLY_VIEW_PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefsReady, sortBy, sortDirection, groupByCategory]);

  const todayKey = formatDateKey(new Date());
  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isCurrentMonth = monthDate.getTime() >= currentMonth.getTime();

  const liveSortedTodos = useMemo(
    () => sortTodos(todos, days, todayKey, sortBy, sortDirection, groupByCategory),
    [todos, days, todayKey, sortBy, sortDirection, groupByCategory]
  );

  const orderedTodos = useMemo(() => {
    if (!isEditing || !frozenOrderIds) return liveSortedTodos;
    const byId = new Map(todos.map((todo) => [todo.id, todo]));
    return frozenOrderIds
      .map((id) => byId.get(id))
      .filter((todo): todo is Todo => !!todo);
  }, [isEditing, frozenOrderIds, liveSortedTodos, todos]);

  const changeMonth = (offset: number) => {
    if (isEditing) return;
    setMonthDate((previousMonth) => {
      const nextMonth = new Date(previousMonth);
      nextMonth.setMonth(nextMonth.getMonth() + offset);
      return nextMonth;
    });
  };

  const handleToggleCell = useCallback(
    (todoId: string, dateKey: string, nextCompleted: boolean) => {
      const key = draftKey(todoId, dateKey);
      const original = todos.find((t) => t.id === todoId);
      const originalDone = original ? isTodoCompleted(original, dateKey) : false;
      const nextDraft = { ...draftRef.current };

      if (nextCompleted === originalDone) {
        delete nextDraft[key];
      } else {
        nextDraft[key] = nextCompleted;
      }

      draftRef.current = nextDraft;
      setPendingChanges(Object.keys(nextDraft).length);
    },
    [todos]
  );

  const startEditing = () => {
    draftRef.current = {};
    setPendingChanges(0);
    setFrozenOrderIds(liveSortedTodos.map((todo) => todo.id));
    setResetToken((token) => token + 1);
    setIsEditing(true);
  };

  const discardChanges = () => {
    draftRef.current = {};
    setPendingChanges(0);
    setResetToken((token) => token + 1);
    setFrozenOrderIds(null);
    setIsEditing(false);
  };

  const saveChanges = () => {
    const edits = Object.entries(draftRef.current).map(([composite, completed]) => {
      const sep = composite.indexOf('::');
      return {
        id: composite.slice(0, sep),
        dateKey: composite.slice(sep + 2),
        completed,
      };
    });
    applyCompletionEdits(edits);
    draftRef.current = {};
    setPendingChanges(0);
    setFrozenOrderIds(null);
    setIsEditing(false);
  };

  return (
    <MonthlyViewStylesContext.Provider value={styles}>
    <View style={styles.monthView}>
      <View style={styles.monthToolbar}>
        <TouchableOpacity
          style={[styles.monthArrow, isEditing && styles.monthArrowDisabled]}
          onPress={() => changeMonth(-1)}
          disabled={isEditing}
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={20} color={isEditing ? colors.inactive : colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={[styles.monthArrow, (isCurrentMonth || isEditing) && styles.monthArrowDisabled]}
          onPress={() => changeMonth(1)}
          disabled={isCurrentMonth || isEditing}
          accessibilityLabel="Next month"
        >
          <ChevronRight size={20} color={isCurrentMonth || isEditing ? colors.inactive : colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sortRow, isEditing && styles.sortRowDisabled]}>
        <View style={[styles.sortCriteria, isEditing && styles.controlsDisabled]}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'completion' && styles.sortOptionActive]}
            onPress={() => !isEditing && setSortBy('completion')}
            disabled={isEditing}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === 'completion' && styles.sortOptionTextActive,
                isEditing && styles.disabledText,
              ]}
            >
              Done %
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'priority' && styles.sortOptionActive]}
            onPress={() => !isEditing && setSortBy('priority')}
            disabled={isEditing}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === 'priority' && styles.sortOptionTextActive,
                isEditing && styles.disabledText,
              ]}
            >
              Priority
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sortDirection, isEditing && styles.controlsDisabled]}
          onPress={() =>
            !isEditing && setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
          }
          disabled={isEditing}
          accessibilityLabel="Change sort direction"
        >
          {sortDirection === 'desc' ? (
            <ChevronDown size={15} color={isEditing ? colors.inactive : colors.primary} />
          ) : (
            <ChevronUp size={15} color={isEditing ? colors.inactive : colors.primary} />
          )}
          <Text style={[styles.sortDirectionText, isEditing && styles.disabledText]}>
            {sortDirection === 'desc'
              ? sortBy === 'completion'
                ? 'Highest % first'
                : 'Highest priority first'
              : sortBy === 'completion'
              ? 'Lowest % first'
              : 'Lowest priority first'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[
          styles.categoryToggle,
          groupByCategory && styles.categoryToggleActive,
          isEditing && styles.controlsDisabled,
        ]}
        onPress={() => !isEditing && setGroupByCategory((current) => !current)}
        disabled={isEditing}
        accessibilityLabel="Toggle grouping by category"
      >
        <Text
          style={[
            styles.categoryToggleText,
            groupByCategory && styles.categoryToggleTextActive,
            isEditing && styles.disabledText,
          ]}
        >
          {groupByCategory ? 'Grouped by category' : 'Group by category'}
        </Text>
      </TouchableOpacity>
      <MonthlyTable
        todos={todos}
        orderedTodos={orderedTodos}
        days={days}
        todayKey={todayKey}
        groupByCategory={groupByCategory}
        isEditing={isEditing && !readOnly}
        onToggleCell={handleToggleCell}
        resetToken={resetToken}
      />

      {!readOnly ? (
        <View style={styles.editRow}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={startEditing}
              activeOpacity={0.85}
              accessibilityLabel="Enable monthly editing"
            >
              <Pencil size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Enable editing</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, styles.discardBtn]}
                onPress={discardChanges}
                activeOpacity={0.85}
                accessibilityLabel="Discard monthly edits"
              >
                <RotateCcw size={14} color="#b91c1c" />
                <Text style={styles.discardBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnActive]}
                onPress={saveChanges}
                activeOpacity={0.85}
                accessibilityLabel="Save monthly edits"
              >
                <Save size={14} color="#ffffff" />
                <Text style={[styles.editBtnText, styles.editBtnTextActive]}>
                  {pendingChanges > 0 ? `Save changes (${pendingChanges})` : 'Save changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {isEditing ? (
            <Text style={styles.editHint}>
              Sorting locked while editing. Tap cells, then save or discard.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
    </MonthlyViewStylesContext.Provider>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
  monthView: {
    backgroundColor: colors.card,
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
    backgroundColor: colors.surfaceMuted,
  },
  monthArrowDisabled: {
    backgroundColor: colors.surface,
  },
  monthTitle: {
    color: colors.text,
    fontSize: fs(16),
    fontFamily,
    fontWeight: '800',
  },
  editRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 6,
  },
  editActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  editBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discardBtn: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: fs(12),
    fontFamily,
    fontWeight: '800',
  },
  editBtnTextActive: {
    color: '#ffffff',
  },
  discardBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
  },
  editHint: {
    color: colors.textMuted,
    fontSize: fs(11),
    fontFamily,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  sortRowDisabled: {
    opacity: 0.72,
  },
  controlsDisabled: {
    opacity: 0.7,
  },
  disabledText: {
    color: '#94a3b8',
  },
  sortCriteria: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: 2,
  },
  sortOption: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortOptionActive: {
    backgroundColor: colors.card,
  },
  sortOptionText: {
    color: colors.textMuted,
    fontSize: fs(11),
    fontFamily,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: colors.primary,
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
    color: colors.primary,
    fontSize: fs(11),
    fontFamily,
    fontWeight: '700',
  },
  categoryToggle: {
    alignSelf: 'flex-start',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  categoryToggleActive: {
    backgroundColor: colors.primarySoft,
  },
  categoryToggleText: {
    color: colors.textMuted,
    fontSize: fs(11),
    fontFamily,
    fontWeight: '700',
  },
  categoryToggleTextActive: {
    color: colors.primary,
  },
  monthTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
  },
  monthDataRow: {
    flexDirection: 'row',
  },
  monthCategoryHeader: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderColor: colors.primaryMuted,
  },
  monthCategoryHeaderText: {
    color: colors.primary,
    fontSize: fs(11),
    fontFamily,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthTotalsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
  },
  monthTaskColumn: {
    width: 132,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  monthHeaderCell: {
    minHeight: 48,
  },
  monthHeaderText: {
    color: colors.text,
    fontSize: fs(12),
    fontFamily,
    fontWeight: '800',
  },
  monthDayColumn: {
    width: 34,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  monthSummaryColumn: {
    width: 78,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  summaryProgressTrack: {
    width: '88%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 999,
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
    color: colors.text,
    fontSize: fs(12),
    fontFamily,
    fontWeight: '800',
    marginTop: 1,
  },
  monthStatusCell: {
    minHeight: 46,
  },
  statusMarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkDone: {
    backgroundColor: '#d1fae5',
  },
  statusMarkMissed: {
    backgroundColor: '#fee2e2',
  },
  statusMarkEmpty: {
    backgroundColor: '#f1f5f9',
  },
  editableCell: {
    backgroundColor: colors.surface,
  },
  editableCellDone: {
    backgroundColor: colors.successSoft,
  },
  monthTotalsCell: {
    minHeight: 46,
  },
  monthTaskIcon: {
    marginRight: 4,
  },
  monthTaskName: {
    flex: 1,
    color: colors.text,
    fontSize: fs(12),
    fontFamily,
    fontWeight: '700',
  },
  monthTotalsLabel: {
    color: colors.text,
    fontSize: fs(12),
    fontFamily,
    fontWeight: '800',
  },
  monthTaskPriority: {
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    overflow: 'hidden',
  },
  futureMark: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  monthSummaryText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  monthTotalsText: {
    color: colors.primary,
    fontSize: fs(10),
    fontWeight: '800',
    textAlign: 'center',
    fontFamily,
  },
  });
}
