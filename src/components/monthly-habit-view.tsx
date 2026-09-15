import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { formatDateKey, isTodoCompleted, Todo } from '@/context/todos-context';

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

export function MonthlyHabitView({ todos }: { todos: Todo[] }) {
  const [sortBy, setSortBy] = useState<'completion' | 'priority'>('completion');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

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
  );
}

const PURPLE = '#6366f1';
const CARD = '#ffffff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
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
});
