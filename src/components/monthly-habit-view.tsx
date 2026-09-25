import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  RotateCcw,
  Save,
} from 'lucide-react-native';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getHabitTheme } from '@/components/habit-heatmap';
import { HabitIcon } from '@/components/habit-icon';
import { useTheme } from '@/context/theme-context';
import { formatDateKey, Todo, useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';

const MONTHLY_VIEW_PREFS_KEY = '@habit-app/monthly-view-prefs';

type MonthlySortBy = 'completion' | 'priority';
type MonthlySortDirection = 'asc' | 'desc';

type MonthlyViewPrefs = {
  sortBy: MonthlySortBy;
  sortDirection: MonthlySortDirection;
  groupByCategory: boolean;
  pinTaskColumn: boolean;
};

const DEFAULT_MONTHLY_VIEW_PREFS: MonthlyViewPrefs = {
  sortBy: 'completion',
  sortDirection: 'desc',
  groupByCategory: false,
  pinTaskColumn: true,
};

function parseMonthlyViewPrefs(raw: string | null): MonthlyViewPrefs {
  if (!raw) return DEFAULT_MONTHLY_VIEW_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<MonthlyViewPrefs>;
    return {
      sortBy: parsed.sortBy === 'priority' ? 'priority' : 'completion',
      sortDirection: parsed.sortDirection === 'asc' ? 'asc' : 'desc',
      groupByCategory: parsed.groupByCategory === true,
      // Default pinned when missing so older prefs pick up the sticky column.
      pinTaskColumn: parsed.pinTaskColumn !== false,
    };
  } catch {
    return DEFAULT_MONTHLY_VIEW_PREFS;
  }
}

let cachedMonthlyViewPrefs: MonthlyViewPrefs | null = null;
let monthlyViewPrefsPromise: Promise<MonthlyViewPrefs> | null = null;

function rememberMonthlyViewPrefs(prefs: MonthlyViewPrefs) {
  cachedMonthlyViewPrefs = prefs;
}

function loadMonthlyViewPrefs(): Promise<MonthlyViewPrefs> {
  if (cachedMonthlyViewPrefs) return Promise.resolve(cachedMonthlyViewPrefs);
  if (!monthlyViewPrefsPromise) {
    monthlyViewPrefsPromise = AsyncStorage.getItem(MONTHLY_VIEW_PREFS_KEY)
      .then((raw) => {
        const prefs = parseMonthlyViewPrefs(raw);
        if (!cachedMonthlyViewPrefs) rememberMonthlyViewPrefs(prefs);
        return cachedMonthlyViewPrefs ?? prefs;
      })
      .catch(() => {
        if (!cachedMonthlyViewPrefs) rememberMonthlyViewPrefs(DEFAULT_MONTHLY_VIEW_PREFS);
        return cachedMonthlyViewPrefs ?? DEFAULT_MONTHLY_VIEW_PREFS;
      });
  }
  return monthlyViewPrefsPromise;
}

void loadMonthlyViewPrefs();

type MonthlyViewStyles = ReturnType<typeof createStyles>;
const MonthlyViewStylesContext = createContext<MonthlyViewStyles | null>(null);

function useMonthlyViewStyles() {
  const ctx = useContext(MonthlyViewStylesContext);
  if (!ctx) {
    throw new Error('useMonthlyViewStyles must be used within MonthlyHabitView');
  }
  return ctx;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const TASK_COL_WIDTH = 132;
const DAY_COL_WIDTH = 34;
const SUMMARY_COL_WIDTH = 78;

type CellStatus = 'done' | 'missed' | 'empty';

type DayModel = {
  dateKey: string;
  weekdayLetter: string;
  dayNumber: number;
  isToday: boolean;
};

type CellModel = {
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  status: CellStatus;
  completed: boolean;
};

type RowModel = {
  todo: Todo;
  iconColor: string;
  cells: CellModel[];
  completedDays: number;
  trackedCount: number;
  completionPercentage: number;
  sortPriority: number;
  priority: number;
  priorityTone: { bg: string; text: string } | null;
  categoryLabel: string;
  summaryTone: { bg: string; text: string; fill: string };
};

type TotalModel = {
  dateKey: string;
  isToday: boolean;
  active: number;
  completed: number;
};

type MonthModel = {
  days: DayModel[];
  rows: RowModel[];
  totals: TotalModel[];
  completedTotal: number;
  trackedTotal: number;
  percentage: number;
  totalsTone: { bg: string; text: string; fill: string };
};

type CompletionDraft = Record<string, boolean>;

function draftKey(todoId: string, dateKey: string) {
  return `${todoId}::${dateKey}`;
}

function isCompletedOn(todo: Todo, dateKey: string, todayKey: string): boolean {
  const completions = todo.completions;
  if (completions && typeof completions[dateKey] === 'boolean') {
    return completions[dateKey];
  }
  if (dateKey === todayKey && typeof todo.completed === 'boolean') {
    return todo.completed;
  }
  return false;
}

function getTodoStartDateKey(todo: Todo, todayKey: string): string {
  const completions = todo.completions;
  if (!completions) return todayKey;

  let earliest: string | null = null;
  const keys = Object.keys(completions);
  for (let index = 0; index < keys.length; index++) {
    const dateKey = keys[index];
    if (
      completions[dateKey] === true &&
      dateKey <= todayKey &&
      (earliest === null || dateKey < earliest)
    ) {
      earliest = dateKey;
    }
  }

  return earliest ?? todayKey;
}

function getMonthDays(monthDate: Date): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return days;
}

function buildMonthModel(
  todos: Todo[],
  monthDays: Date[],
  todayKey: string,
  scheme: 'light' | 'dark'
): MonthModel {
  const days: DayModel[] = monthDays.map((day) => {
    const dateKey = formatDateKey(day);
    return {
      dateKey,
      weekdayLetter: WEEKDAY_LETTERS[day.getDay()],
      dayNumber: day.getDate(),
      isToday: dateKey === todayKey,
    };
  });

  let completedTotal = 0;
  let trackedTotal = 0;

  const rows: RowModel[] = todos.map((todo) => {
    const startDateKey = getTodoStartDateKey(todo, todayKey);
    let completedDays = 0;
    let trackedCount = 0;
    const cells: CellModel[] = days.map((day) => {
      const isFuture = day.dateKey > todayKey;
      const isBeforeStart = day.dateKey < startDateKey;
      const completed = !isFuture && isCompletedOn(todo, day.dateKey, todayKey);
      const inRange = !isFuture && !isBeforeStart;
      if (inRange) {
        trackedCount += 1;
        if (completed) completedDays += 1;
      }
      return {
        dateKey: day.dateKey,
        isToday: day.isToday,
        isFuture,
        status: inRange ? (completed ? 'done' : 'missed') : 'empty',
        completed,
      };
    });

    completedTotal += completedDays;
    trackedTotal += trackedCount;
    const priority =
      typeof todo.priority === 'number' && !Number.isNaN(todo.priority) ? todo.priority : 0;
    const completionPercentage = trackedCount ? Math.round((completedDays / trackedCount) * 100) : 0;
    const category = typeof todo.category === 'string' ? todo.category.trim() : '';
    const categoryLabel = category.length > 0 ? category : 'Uncategorized';

    return {
      todo,
      cells,
      iconColor: getHabitTheme(todo.name || todo.icon || todo.id).solid,
      completedDays,
      trackedCount,
      completionPercentage,
      priority,
      sortPriority: priority,
      categoryLabel,
      priorityTone: priority > 0 ? getPriorityTone(priority, scheme) : null,
      summaryTone: getCompletionTone(completionPercentage, trackedCount > 0, scheme),
    };
  });

  const totals: TotalModel[] = days.map((day, dayIndex) => {
    let active = 0;
    let completed = 0;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const cell = rows[rowIndex].cells[dayIndex];
      if (cell.status !== 'empty') {
        active += 1;
        if (cell.status === 'done') completed += 1;
      }
    }
    return { dateKey: day.dateKey, isToday: day.isToday, active, completed };
  });

  const percentage = trackedTotal ? Math.round((completedTotal / trackedTotal) * 100) : 0;

  return {
    days,
    rows,
    totals,
    completedTotal,
    trackedTotal,
    percentage,
    totalsTone: getCompletionTone(percentage, trackedTotal > 0, scheme),
  };
}

function getCompletionTone(
  percentage: number,
  hasTracked: boolean,
  scheme: 'light' | 'dark'
) {
  if (scheme === 'dark') {
    if (!hasTracked) {
      return { bg: '#161616', text: '#a3a3a3', fill: '#2a2a2a' };
    }
    if (percentage >= 90) {
      return { bg: '#04140e', text: '#34d399', fill: '#10b981' };
    }
    if (percentage >= 75) {
      return { bg: '#06140f', text: '#4ade80', fill: '#22c55e' };
    }
    if (percentage >= 60) {
      return { bg: '#0f1406', text: '#a3e635', fill: '#84cc16' };
    }
    if (percentage >= 45) {
      return { bg: '#1a1408', text: '#facc15', fill: '#eab308' };
    }
    if (percentage >= 30) {
      return { bg: '#1a1008', text: '#fb923c', fill: '#f97316' };
    }
    if (percentage >= 15) {
      return { bg: '#1a0808', text: '#f87171', fill: '#ef4444' };
    }
    return { bg: '#1a0808', text: '#f87171', fill: '#dc2626' };
  }

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

function getPriorityTone(priority: number, scheme: 'light' | 'dark') {
  if (priority >= 5) {
    return { bg: '#dc2626', text: '#ffffff' };
  }
  if (scheme === 'dark') {
    if (priority >= 3) {
      return { bg: '#1a0808', text: '#f87171' };
    }
    if (priority >= 2) {
      return { bg: '#1a1008', text: '#fb923c' };
    }
    return { bg: '#1a1408', text: '#facc15' };
  }
  if (priority >= 3) {
    return { bg: '#fee2e2', text: '#b91c1c' };
  }
  if (priority >= 2) {
    return { bg: '#ffedd5', text: '#c2410c' };
  }
  return { bg: '#fef9c3', text: '#a16207' };
}

function sortRows(
  rows: RowModel[],
  sortBy: MonthlySortBy,
  sortDirection: MonthlySortDirection,
  groupByCategory: boolean
) {
  const sorted = rows.slice();
  sorted.sort((firstRow, secondRow) => {
    if (groupByCategory) {
      const categoryOrder = firstRow.categoryLabel.localeCompare(secondRow.categoryLabel);
      if (categoryOrder !== 0) return categoryOrder;
    }

    const firstValue = sortBy === 'completion' ? firstRow.completionPercentage : firstRow.sortPriority;
    const secondValue = sortBy === 'completion' ? secondRow.completionPercentage : secondRow.sortPriority;
    return sortDirection === 'desc' ? secondValue - firstValue : firstValue - secondValue;
  });
  return sorted;
}

const MARK_LABEL: Record<CellStatus, string> = {
  done: '✓',
  missed: '✕',
  empty: '–',
};

type MonthDataRowProps = {
  row: RowModel;
  categoryHeader: string | null;
  isEditing: boolean;
  draft: CompletionDraft;
  onToggle: (todoId: string, dateKey: string, nextCompleted: boolean) => void;
  showTaskColumn: boolean;
};

function areRowPropsEqual(prev: MonthDataRowProps, next: MonthDataRowProps) {
  if (
    prev.row !== next.row ||
    prev.categoryHeader !== next.categoryHeader ||
    prev.isEditing !== next.isEditing ||
    prev.onToggle !== next.onToggle ||
    prev.showTaskColumn !== next.showTaskColumn
  ) {
    return false;
  }

  if (!next.isEditing) return true;

  const cells = next.row.cells;
  const todoId = next.row.todo.id;
  for (let index = 0; index < cells.length; index++) {
    const key = draftKey(todoId, cells[index].dateKey);
    if (prev.draft[key] !== next.draft[key]) return false;
  }
  return true;
}

function TaskNameCell({ row }: { row: RowModel }) {
  const styles = useMonthlyViewStyles();
  const { todo, priority, priorityTone } = row;

  return (
    <View style={styles.monthTaskColumn}>
      <View style={styles.monthTaskIcon}>
        <HabitIcon icon={todo.icon} size={14} color={row.iconColor} strokeWidth={2.2} />
      </View>
      <Text style={styles.monthTaskName} numberOfLines={1}>
        {todo.name}
      </Text>
      {priorityTone ? (
        <Text
          style={[
            styles.monthTaskPriority,
            { color: priorityTone.text, backgroundColor: priorityTone.bg },
          ]}
        >
          P{priority}
        </Text>
      ) : null}
    </View>
  );
}

const MonthDataRow = memo(function MonthDataRow({
  row,
  categoryHeader,
  isEditing,
  draft,
  onToggle,
  showTaskColumn,
}: MonthDataRowProps) {
  const styles = useMonthlyViewStyles();
  const { todo, summaryTone } = row;
  const markStyle = {
    done: styles.statusDone,
    missed: styles.statusMissed,
    empty: styles.statusEmpty,
  };

  const scrollWidth =
    row.cells.length * DAY_COL_WIDTH + SUMMARY_COL_WIDTH + (showTaskColumn ? TASK_COL_WIDTH : 0);

  return (
    <View style={{ width: scrollWidth }}>
      {categoryHeader ? (
        <View style={[styles.monthCategoryHeader, !showTaskColumn && styles.monthCategoryHeaderScroll]}>
          {showTaskColumn ? (
            <Text style={styles.monthCategoryHeaderText}>{categoryHeader}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.monthDataRow}>
        {showTaskColumn ? <TaskNameCell row={row} /> : null}
        {row.cells.map((cell) => {
          const editable = isEditing && !cell.isFuture;
          const key = draftKey(todo.id, cell.dateKey);
          const done = editable ? (key in draft ? draft[key] : cell.completed) : cell.status === 'done';
          const status: CellStatus = editable ? (done ? 'done' : 'missed') : cell.status;
          const columnStyle = [
            styles.monthDayColumn,
            styles.monthStatusCell,
            cell.isToday && styles.todayColumn,
            editable && styles.editableCell,
            editable && done && styles.editableCellDone,
          ];
          const mark = (
            <Text allowFontScaling={false} style={[styles.statusMark, markStyle[status]]}>
              {MARK_LABEL[status]}
            </Text>
          );

          if (!editable) {
            return (
              <View key={cell.dateKey} style={columnStyle}>
                {mark}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={cell.dateKey}
              style={columnStyle}
              onPress={() => onToggle(todo.id, cell.dateKey, !done)}
              activeOpacity={0.7}
              accessibilityLabel={`${done ? 'Unmark' : 'Mark'} ${todo.name} on ${cell.dateKey}`}
            >
              {mark}
            </TouchableOpacity>
          );
        })}
        <View style={[styles.monthSummaryColumn, { backgroundColor: summaryTone.bg }]}>
          <Text style={[styles.monthSummaryText, { color: summaryTone.text }]}>
            {row.completedDays}/{row.trackedCount} ({row.completionPercentage}%)
          </Text>
          <View style={styles.summaryProgressTrack}>
            <View
              style={[
                styles.summaryProgressFill,
                {
                  width: `${row.trackedCount > 0 ? row.completionPercentage : 0}%`,
                  backgroundColor: summaryTone.fill,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}, areRowPropsEqual);

function StickyTaskPane({
  orderedRows,
  groupByCategory,
}: {
  orderedRows: RowModel[];
  groupByCategory: boolean;
}) {
  const styles = useMonthlyViewStyles();

  return (
    <View style={styles.stickyTaskPane}>
      <View style={[styles.monthTaskColumn, styles.monthHeaderCell, styles.stickyTaskHeader]}>
        <Text style={styles.monthHeaderText}>Task</Text>
      </View>
      {orderedRows.map((row, index) => {
        const previousCategory = index > 0 ? orderedRows[index - 1].categoryLabel : null;
        const categoryHeader =
          groupByCategory && row.categoryLabel !== previousCategory ? row.categoryLabel : null;
        return (
          <View key={row.todo.id}>
            {categoryHeader ? (
              <View style={styles.monthCategoryHeader}>
                <Text style={styles.monthCategoryHeaderText} numberOfLines={1}>
                  {categoryHeader}
                </Text>
              </View>
            ) : null}
            <TaskNameCell row={row} />
          </View>
        );
      })}
      <View style={[styles.monthTaskColumn, styles.stickyTotalsTask]}>
        <Text style={styles.monthTotalsLabel}>Totals</Text>
      </View>
    </View>
  );
}

function MonthlyTable({
  model,
  orderedRows,
  groupByCategory,
  isEditing,
  draft,
  onToggleCell,
  pinTaskColumn,
}: {
  model: MonthModel;
  orderedRows: RowModel[];
  groupByCategory: boolean;
  isEditing: boolean;
  draft: CompletionDraft;
  onToggleCell: (todoId: string, dateKey: string, nextCompleted: boolean) => void;
  pinTaskColumn: boolean;
}) {
  const styles = useMonthlyViewStyles();
  const showTaskColumn = !pinTaskColumn;

  const dayAndSummaryHeader = (
    <>
      {model.days.map((day) => (
        <View
          key={day.dateKey}
          style={[styles.monthDayColumn, day.isToday && styles.todayColumn]}
        >
          <Text style={styles.monthDayName}>{day.weekdayLetter}</Text>
          <Text style={styles.monthDayNumber}>{day.dayNumber}</Text>
        </View>
      ))}
      <View style={[styles.monthSummaryColumn, styles.monthHeaderCell]}>
        <Text style={styles.monthHeaderText}>Summary</Text>
      </View>
    </>
  );

  const dataRows = orderedRows.map((row, index) => {
    const previousCategory = index > 0 ? orderedRows[index - 1].categoryLabel : null;
    const categoryHeader =
      groupByCategory && row.categoryLabel !== previousCategory ? row.categoryLabel : null;

    return (
      <MonthDataRow
        key={row.todo.id}
        row={row}
        categoryHeader={categoryHeader}
        isEditing={isEditing}
        draft={draft}
        onToggle={onToggleCell}
        showTaskColumn={showTaskColumn}
      />
    );
  });

  const totalsDays = (
    <>
      {model.totals.map((total) => (
        <View
          key={`total-${total.dateKey}`}
          style={[
            styles.monthDayColumn,
            styles.monthTotalsCell,
            total.isToday && styles.todayColumn,
          ]}
        >
          {total.active > 0 ? (
            <Text style={styles.monthTotalsText}>
              {total.completed}/{total.active}
            </Text>
          ) : (
            <Text style={styles.futureMark}>–</Text>
          )}
        </View>
      ))}
      <View style={[styles.monthSummaryColumn, { backgroundColor: model.totalsTone.bg }]}>
        <Text style={[styles.monthTotalsText, { color: model.totalsTone.text }]}>
          {model.completedTotal}/{model.trackedTotal} ({model.percentage}%)
        </Text>
        <View style={styles.summaryProgressTrack}>
          <View
            style={[
              styles.summaryProgressFill,
              {
                width: `${model.trackedTotal > 0 ? model.percentage : 0}%`,
                backgroundColor: model.totalsTone.fill,
              },
            ]}
          />
        </View>
      </View>
    </>
  );

  if (!pinTaskColumn) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.monthTable}>
          <View style={styles.monthHeaderRow}>
            <View style={[styles.monthTaskColumn, styles.monthHeaderCell]}>
              <Text style={styles.monthHeaderText}>Task</Text>
            </View>
            {dayAndSummaryHeader}
          </View>
          {dataRows}
          <View style={styles.monthTotalsRow}>
            <View style={styles.monthTaskColumn}>
              <Text style={styles.monthTotalsLabel}>Totals</Text>
            </View>
            {totalsDays}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.monthTablePinned}>
      <StickyTaskPane orderedRows={orderedRows} groupByCategory={groupByCategory} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthScrollPane}
      >
        <View style={[styles.monthTable, styles.monthTableScrollBody]}>
          <View style={styles.monthHeaderRow}>{dayAndSummaryHeader}</View>
          {dataRows}
          <View style={styles.monthTotalsRow}>{totalsDays}</View>
        </View>
      </ScrollView>
    </View>
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
  const { colors, fs, fontFamilyValue, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue, resolvedScheme),
    [colors, fs, fontFamilyValue, resolvedScheme]
  );
  const [sortBy, setSortBy] = useState<MonthlySortBy>(
    () => (cachedMonthlyViewPrefs ?? DEFAULT_MONTHLY_VIEW_PREFS).sortBy
  );
  const [sortDirection, setSortDirection] = useState<MonthlySortDirection>(
    () => (cachedMonthlyViewPrefs ?? DEFAULT_MONTHLY_VIEW_PREFS).sortDirection
  );
  const [groupByCategory, setGroupByCategory] = useState(
    () => (cachedMonthlyViewPrefs ?? DEFAULT_MONTHLY_VIEW_PREFS).groupByCategory
  );
  const [pinTaskColumn, setPinTaskColumn] = useState(
    () => (cachedMonthlyViewPrefs ?? DEFAULT_MONTHLY_VIEW_PREFS).pinTaskColumn
  );
  const [prefsReady, setPrefsReady] = useState(cachedMonthlyViewPrefs !== null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CompletionDraft>({});
  const [frozenOrderIds, setFrozenOrderIds] = useState<string[] | null>(null);
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  useEffect(() => {
    let cancelled = false;
    loadMonthlyViewPrefs().then((prefs) => {
      if (cancelled) return;
      setSortBy(prefs.sortBy);
      setSortDirection(prefs.sortDirection);
      setGroupByCategory(prefs.groupByCategory);
      setPinTaskColumn(prefs.pinTaskColumn);
      setPrefsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    const prefs: MonthlyViewPrefs = { sortBy, sortDirection, groupByCategory, pinTaskColumn };
    rememberMonthlyViewPrefs(prefs);
    void AsyncStorage.setItem(MONTHLY_VIEW_PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefsReady, sortBy, sortDirection, groupByCategory, pinTaskColumn]);

  const todayKey = formatDateKey(new Date());
  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isCurrentMonth = monthDate.getTime() >= currentMonth.getTime();
  const monthModel = useMemo(
    () => buildMonthModel(todos, monthDays, todayKey, resolvedScheme),
    [todos, monthDays, todayKey, resolvedScheme]
  );

  const liveSortedRows = useMemo(
    () => sortRows(monthModel.rows, sortBy, sortDirection, groupByCategory),
    [monthModel.rows, sortBy, sortDirection, groupByCategory]
  );

  const orderedRows = useMemo(() => {
    if (!isEditing || !frozenOrderIds) return liveSortedRows;
    const byId = new Map(monthModel.rows.map((row) => [row.todo.id, row]));
    return frozenOrderIds
      .map((id) => byId.get(id))
      .filter((row): row is RowModel => !!row);
  }, [isEditing, frozenOrderIds, liveSortedRows, monthModel.rows]);

  const changeMonth = (offset: number) => {
    if (isEditing) return;
    setMonthDate((previousMonth) => {
      const nextMonth = new Date(previousMonth);
      nextMonth.setMonth(nextMonth.getMonth() + offset);
      return nextMonth;
    });
  };

  const pendingChanges = Object.keys(draft).length;

  const handleToggleCell = useCallback(
    (todoId: string, dateKey: string, nextCompleted: boolean) => {
      const key = draftKey(todoId, dateKey);
      const original = todos.find((todo) => todo.id === todoId);
      const originalDone = original ? isCompletedOn(original, dateKey, todayKey) : false;
      setDraft((current) => {
        if (nextCompleted === originalDone) {
          if (!(key in current)) return current;
          const next = { ...current };
          delete next[key];
          return next;
        }
        if (current[key] === nextCompleted) return current;
        return { ...current, [key]: nextCompleted };
      });
    },
    [todos, todayKey]
  );

  const startEditing = () => {
    setDraft({});
    setFrozenOrderIds(liveSortedRows.map((row) => row.todo.id));
    setIsEditing(true);
  };

  const discardChanges = () => {
    setDraft({});
    setFrozenOrderIds(null);
    setIsEditing(false);
  };

  const saveChanges = () => {
    const edits = Object.entries(draft).map(([composite, completed]) => {
      const sep = composite.indexOf('::');
      return {
        id: composite.slice(0, sep),
        dateKey: composite.slice(sep + 2),
        completed,
      };
    });
    applyCompletionEdits(edits);
    setDraft({});
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

      {prefsReady ? (
      <>
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
      <View style={styles.toggleRow}>
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
        <TouchableOpacity
          style={[
            styles.categoryToggle,
            pinTaskColumn && styles.categoryToggleActive,
            isEditing && styles.controlsDisabled,
          ]}
          onPress={() => !isEditing && setPinTaskColumn((current) => !current)}
          disabled={isEditing}
          accessibilityLabel="Toggle pinning the task column"
        >
          <Text
            style={[
              styles.categoryToggleText,
              pinTaskColumn && styles.categoryToggleTextActive,
              isEditing && styles.disabledText,
            ]}
          >
            {pinTaskColumn ? 'Task column pinned' : 'Pin task column'}
          </Text>
        </TouchableOpacity>
      </View>
      <MonthlyTable
        model={monthModel}
        orderedRows={orderedRows}
        groupByCategory={groupByCategory}
        isEditing={isEditing && !readOnly}
        draft={draft}
        onToggleCell={handleToggleCell}
        pinTaskColumn={pinTaskColumn}
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
      </>
      ) : null}
    </View>
    </MonthlyViewStylesContext.Provider>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string,
  scheme: 'light' | 'dark' = 'light'
) {
  const isDark = scheme === 'dark';
  const statusDone = isDark
    ? { backgroundColor: '#0f2e24', color: '#5eead4' }
    : { backgroundColor: '#d1fae5', color: '#059669' };
  const statusMissed = isDark
    ? { backgroundColor: '#3a1518', color: '#fb7185' }
    : { backgroundColor: '#fee2e2', color: '#ef4444' };
  const statusEmpty = isDark
    ? { backgroundColor: '#1c2430', color: '#94a3b8' }
    : { backgroundColor: colors.surfaceMuted, color: colors.inactive };

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
    color: colors.danger,
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
    color: colors.inactive,
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
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  monthTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  monthTablePinned: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  monthTableScrollBody: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  stickyTaskPane: {
    width: TASK_COL_WIDTH,
    zIndex: 2,
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
  },
  stickyTaskHeader: {
    backgroundColor: colors.surface,
  },
  stickyTotalsTask: {
    backgroundColor: colors.surface,
  },
  monthScrollPane: {
    flex: 1,
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
  monthCategoryHeaderScroll: {
    paddingHorizontal: 0,
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
    width: TASK_COL_WIDTH,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    width: DAY_COL_WIDTH,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  monthSummaryColumn: {
    width: SUMMARY_COL_WIDTH,
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
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  todayColumn: {
    backgroundColor: colors.warningSoft,
  },
  monthDayName: {
    color: colors.inactive,
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
  statusMark: {
    width: 22,
    height: 22,
    borderRadius: 7,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  statusDone,
  statusMissed,
  statusEmpty,
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
    color: colors.inactive,
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
