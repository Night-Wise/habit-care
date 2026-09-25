/** One exclusive schedule mode per task. Missing/unknown → everyday. */
export type TodoScheduleType = 'everyday' | 'interval' | 'weekdays';

/** JS `Date.getDay()` values: 0=Sun … 6=Sat. UI order is Mon→Sun. */
export const WEEKDAY_OPTIONS: { label: string; day: number }[] = [
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
  { label: 'S', day: 0 },
];

export const SCHEDULE_INTERVAL_MIN = 1;
export const SCHEDULE_INTERVAL_MAX = 366;
export const SCHEDULE_INTERVAL_DEFAULT = 2;

export interface TodoScheduleFields {
  scheduleType: TodoScheduleType;
  scheduleIntervalDays?: number;
  scheduleStartDate?: string;
  scheduleWeekdays?: number[];
}

type ScheduleSource = Partial<TodoScheduleFields> & {
  notificationId?: string;
  notificationIds?: string[];
};

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string): Date {
  const parts = key.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function clampScheduleInterval(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (isNaN(n)) return SCHEDULE_INTERVAL_DEFAULT;
  return Math.min(SCHEDULE_INTERVAL_MAX, Math.max(SCHEDULE_INTERVAL_MIN, Math.round(n)));
}

export function normalizeWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<number>();
  for (const item of value) {
    const day = typeof item === 'number' ? item : parseInt(String(item), 10);
    if (!isNaN(day) && day >= 0 && day <= 6) unique.add(day);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function normalizeScheduleType(value: unknown): TodoScheduleType {
  if (value === 'interval' || value === 'weekdays' || value === 'everyday') return value;
  return 'everyday';
}

export function normalizeScheduleFields(
  input: Partial<TodoScheduleFields> | Record<string, unknown>
): TodoScheduleFields {
  const scheduleType = normalizeScheduleType(input.scheduleType);
  const scheduleIntervalDays = clampScheduleInterval(input.scheduleIntervalDays);
  const rawStart =
    typeof input.scheduleStartDate === 'string' ? input.scheduleStartDate.trim() : '';
  const scheduleStartDate = /^\d{4}-\d{2}-\d{2}$/.test(rawStart)
    ? rawStart
    : formatDateKey(new Date());
  const scheduleWeekdays = normalizeWeekdays(input.scheduleWeekdays);

  if (scheduleType === 'interval') {
    return { scheduleType, scheduleIntervalDays, scheduleStartDate };
  }
  if (scheduleType === 'weekdays') {
    return {
      scheduleType,
      scheduleWeekdays: scheduleWeekdays.length > 0 ? scheduleWeekdays : [1, 2, 3, 4, 5],
    };
  }
  return { scheduleType: 'everyday' };
}

export function getTodoSchedule(todo: Partial<TodoScheduleFields>): TodoScheduleFields {
  return normalizeScheduleFields(todo);
}

/** Whether the habit is due (visible on Home + eligible for reminder) on this calendar day. */
export function isTodoDueOnDate(todo: Partial<TodoScheduleFields>, dateKey: string): boolean {
  const schedule = getTodoSchedule(todo);

  if (schedule.scheduleType === 'everyday') return true;

  if (schedule.scheduleType === 'weekdays') {
    const days = schedule.scheduleWeekdays ?? [];
    if (days.length === 0) return true;
    return days.includes(parseDateKey(dateKey).getDay());
  }

  const startKey = schedule.scheduleStartDate;
  const interval = schedule.scheduleIntervalDays ?? SCHEDULE_INTERVAL_DEFAULT;
  if (!startKey) return true;
  if (dateKey < startKey) return false;

  const start = parseDateKey(startKey);
  const date = parseDateKey(dateKey);
  const diffDays = Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays % interval === 0;
}

/** Next due date keys from `fromDate` (inclusive if due), up to `count` occurrences. */
export function getUpcomingDueDateKeys(
  todo: Partial<TodoScheduleFields>,
  fromDate: Date = new Date(),
  count: number = 60
): string[] {
  const keys: string[] = [];
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  let guard = 0;
  const maxScan = Math.max(count * 400, 400);

  while (keys.length < count && guard < maxScan) {
    const key = formatDateKey(cursor);
    if (isTodoDueOnDate(todo, key)) keys.push(key);
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return keys;
}

export function collectNotificationIds(todo: ScheduleSource): string[] {
  const ids: string[] = [];
  if (Array.isArray(todo.notificationIds)) {
    for (const id of todo.notificationIds) {
      if (typeof id === 'string' && id.trim()) ids.push(id.trim());
    }
  }
  if (typeof todo.notificationId === 'string' && todo.notificationId.trim()) {
    if (!ids.includes(todo.notificationId.trim())) ids.push(todo.notificationId.trim());
  }
  return ids;
}

/** Short label for home/list UI: "Everyday", "Every 3 days", "M T W F". */
export function formatScheduleLabel(todo: Partial<TodoScheduleFields>): string {
  const schedule = getTodoSchedule(todo);

  if (schedule.scheduleType === 'everyday') return 'Everyday';

  if (schedule.scheduleType === 'interval') {
    const days = schedule.scheduleIntervalDays ?? SCHEDULE_INTERVAL_DEFAULT;
    return days === 1 ? 'Every day' : `Every ${days} days`;
  }

  const selected = new Set(schedule.scheduleWeekdays ?? []);
  const labels = WEEKDAY_OPTIONS.filter((opt) => selected.has(opt.day)).map((opt) => opt.label);
  if (labels.length === 0) return 'Weekdays';
  if (labels.length === 7) return 'Everyday';
  return labels.join(' ');
}
