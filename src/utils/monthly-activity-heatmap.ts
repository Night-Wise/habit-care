/** Minimal habit shape needed for heatmap intensity (avoids importing todos-context). */
export type HeatmapTodo = {
  completions?: Record<string, boolean>;
  completed?: boolean;
};

export type HeatmapCell =
  | { kind: 'empty' }
  | { kind: 'day'; dateKey: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type MonthlyActivityHeatmap = {
  year: number;
  month: number; // 0-indexed
  title: string;
  /** Week columns; each column has 7 cells Mon→Sun */
  weeks: HeatmapCell[][];
  maxCount: number;
};

/** GitHub-style greens: empty / level 0 (in month, 0 done) / 1–4 intensity */
export const HEATMAP_COLORS = {
  outOfMonth: 'transparent',
  level0: '#ebedf0',
  level1: '#9be9a8',
  level2: '#40c463',
  level3: '#30a14e',
  level4: '#216e39',
} as const;

export const HEATMAP_COLORS_DARK = {
  outOfMonth: 'transparent',
  level0: '#2d333b',
  level1: '#0e4429',
  level2: '#006d32',
  level3: '#26a641',
  level4: '#39d353',
} as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isTodoCompleted(todo: HeatmapTodo, dateKey: string): boolean {
  if (todo.completions && typeof todo.completions[dateKey] === 'boolean') {
    return todo.completions[dateKey];
  }
  if (dateKey === formatDateKey(new Date()) && typeof todo.completed === 'boolean') {
    return todo.completed;
  }
  return false;
}

export function getHeatmapColor(cell: HeatmapCell, dark = false): string {
  const palette = dark ? HEATMAP_COLORS_DARK : HEATMAP_COLORS;
  if (cell.kind === 'empty') return palette.outOfMonth;
  switch (cell.level) {
    case 1:
      return palette.level1;
    case 2:
      return palette.level2;
    case 3:
      return palette.level3;
    case 4:
      return palette.level4;
    default:
      return palette.level0;
  }
}

function countCompletionsForDay(todos: HeatmapTodo[], dateKey: string): number {
  let count = 0;
  for (const todo of todos) {
    if (isTodoCompleted(todo, dateKey)) count += 1;
  }
  return count;
}

/** Map a day's count to 0–4 relative to the month max (GitHub-style). */
export function countToLevel(
  count: number,
  maxCount: number
): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function buildMonthlyActivityHeatmap(
  todos: HeatmapTodo[],
  year: number,
  month: number
): MonthlyActivityHeatmap {
  const firstOfMonth = new Date(year, month, 1);
  firstOfMonth.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayCounts: { dateKey: string; count: number }[] = [];
  let maxCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    const count = countCompletionsForDay(todos, dateKey);
    if (count > maxCount) maxCount = count;
    dayCounts.push({ dateKey, count });
  }

  const startMonday = getMonday(firstOfMonth);
  const lastOfMonth = new Date(year, month, daysInMonth);
  const endMonday = getMonday(lastOfMonth);

  const weeks: HeatmapCell[][] = [];
  const cursor = new Date(startMonday);

  while (cursor <= endMonday) {
    const column: HeatmapCell[] = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + dayOfWeek);
      const inMonth =
        date.getFullYear() === year && date.getMonth() === month;
      if (!inMonth) {
        column.push({ kind: 'empty' });
        continue;
      }
      const dateKey = formatDateKey(date);
      const entry = dayCounts.find((d) => d.dateKey === dateKey);
      const count = entry?.count ?? 0;
      column.push({
        kind: 'day',
        dateKey,
        count,
        level: countToLevel(count, maxCount),
      });
    }
    weeks.push(column);
    cursor.setDate(cursor.getDate() + 7);
  }

  return {
    year,
    month,
    title: `${MONTH_NAMES[month]} ${year}`,
    weeks,
    maxCount,
  };
}

export function buildCurrentMonthActivityHeatmap(
  todos: HeatmapTodo[],
  now = new Date()
): MonthlyActivityHeatmap {
  return buildMonthlyActivityHeatmap(
    todos,
    now.getFullYear(),
    now.getMonth()
  );
}
