import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  alarmBudgetPerTodo,
  cancelStaleTodoNotifications,
  cancelTodoNotifications,
  registerNotificationActionHandlers,
  scheduleTodoReminders,
  setupNotificationListeners,
} from '@/utils/notifications';
import { normalizePriority } from '@/utils/priority';
import {
  normalizeRingSoundId,
  type RingSoundId,
} from '@/utils/ringtones';
import {
  collectNotificationIds,
  normalizeScheduleFields,
  type TodoScheduleFields,
  type TodoScheduleType,
} from '@/utils/todo-schedule';
import { syncMonthlyHeatmapWidget } from '@/widgets/sync-monthly-heatmap-widget';
import { TODOS_STORAGE_KEY } from '@/widgets/constants';

export type { TodoScheduleFields, TodoScheduleType };

export interface Todo {
  id: string;
  name: string;
  icon: string;
  category?: string;
  timeMinutes?: number;
  priority?: number;
  createdAt?: string;
  completions?: Record<string, boolean>;
  completed?: boolean;
  notificationTime?: string;
  notificationEnabled?: boolean;
  /** @deprecated Prefer `notificationIds` for multi-trigger schedules */
  notificationId?: string;
  notificationIds?: string[];
  /** Ring alarm 30 min after popup time (off by default) */
  ringEnabled?: boolean;
  ringSoundId?: RingSoundId;
  /** Local file URI for custom ringtone */
  ringSoundUri?: string;
  ringNotificationIds?: string[];
  scheduleType?: TodoScheduleType;
  scheduleIntervalDays?: number;
  scheduleStartDate?: string;
  /** JS weekday numbers: 0=Sun … 6=Sat */
  scheduleWeekdays?: number[];
}

export interface TodoInsights {
  currentStreak: number;
  maxStreak: number;
  completedCount: number;
  missedCount: number;
  completedPct: number;
  missedPct: number;
  weekCompleted: number;
  weekTotal: number;
  monthCompleted: number;
  monthTotal: number;
  allTimeCompleted: number;
  allTimeTotal: number;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const parts = key.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // Monday is 1, Sunday is 0. If Sunday, diff is -6; otherwise 1 - day
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isTodoCompleted(todo: Todo, dateKey?: string): boolean {
  const key = dateKey || formatDateKey(new Date());
  if (todo.completions && typeof todo.completions[key] === 'boolean') {
    return todo.completions[key];
  }
  if (key === formatDateKey(new Date()) && typeof todo.completed === 'boolean') {
    return todo.completed;
  }
  return false;
}

export function getTodoInsights(todo: Todo): TodoInsights {
  const now = new Date();
  const todayKey = formatDateKey(now);

  // 1. Determine creation date
  let createdDate: Date;
  if (todo.createdAt) {
    createdDate = new Date(todo.createdAt);
  } else if (!isNaN(Number(todo.id)) && Number(todo.id) > 1500000000000) {
    createdDate = new Date(Number(todo.id));
  } else {
    createdDate = new Date(now);
  }

  const startOfCreated = new Date(
    createdDate.getFullYear(),
    createdDate.getMonth(),
    createdDate.getDate()
  );
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // 2. Determine starting date: minimum of creation date or first tick mark
  const completions = todo.completions || {};
  const completedKeys = Object.keys(completions)
    .filter((k) => completions[k] && k <= todayKey)
    .sort();

  let startDate = startOfCreated;
  if (completedKeys.length > 0) {
    const firstTickDate = parseDateKey(completedKeys[0]);
    if (firstTickDate.getTime() < startDate.getTime()) {
      startDate = firstTickDate;
    }
  }

  // Safety: start date should not be after today
  if (startDate.getTime() > startOfToday.getTime()) {
    startDate = startOfToday;
  }

  const diffMs = startOfToday.getTime() - startDate.getTime();
  const rawElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  let allTimeTotal = Math.max(1, rawElapsed);
  const allTimeCompleted = completedKeys.length;

  if (allTimeCompleted > allTimeTotal) {
    allTimeTotal = allTimeCompleted;
  }

  const missedCount = Math.max(0, allTimeTotal - allTimeCompleted);
  const completedPct =
    allTimeTotal > 0 ? Math.round((allTimeCompleted / allTimeTotal) * 100) : 0;
  const missedPct = allTimeTotal > 0 ? Math.max(0, 100 - completedPct) : 0;

  // 2. Current streak
  let currentStreak = 0;
  const todayDone = isTodoCompleted(todo, todayKey);
  let checkDate = new Date(startOfToday);

  if (todayDone) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
    while (isTodoCompleted(todo, formatDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isTodoCompleted(todo, formatDateKey(yesterday))) {
      currentStreak = 1;
      checkDate = yesterday;
      checkDate.setDate(checkDate.getDate() - 1);
      while (isTodoCompleted(todo, formatDateKey(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      currentStreak = 0;
    }
  }

  // 3. Max streak
  let maxStreak = currentStreak;
  const sortedDates = [...completedKeys].sort();
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const dayDiff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff === 1) {
        tempStreak++;
      } else if (dayDiff > 1) {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
  }

  // 4. This week (Monday to Sunday)
  const monday = getMonday(now);
  let weekCompleted = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (isTodoCompleted(todo, formatDateKey(d))) {
      weekCompleted++;
    }
  }
  const weekTotal = 7;

  // 5. This month
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthTotal = new Date(year, month + 1, 0).getDate();
  let monthCompleted = 0;
  for (let day = 1; day <= monthTotal; day++) {
    const d = new Date(year, month, day);
    if (isTodoCompleted(todo, formatDateKey(d))) {
      monthCompleted++;
    }
  }

  return {
    currentStreak,
    maxStreak,
    completedCount: allTimeCompleted,
    missedCount,
    completedPct,
    missedPct,
    weekCompleted,
    weekTotal,
    monthCompleted,
    monthTotal,
    allTimeCompleted,
    allTimeTotal,
  };
}

function applyScheduleToTodo(todo: Todo, schedule?: Partial<TodoScheduleFields>): Todo {
  const normalized = normalizeScheduleFields({ ...todo, ...schedule });
  return {
    ...todo,
    scheduleType: normalized.scheduleType,
    scheduleIntervalDays:
      normalized.scheduleType === 'interval' ? normalized.scheduleIntervalDays : undefined,
    scheduleStartDate:
      normalized.scheduleType === 'interval' ? normalized.scheduleStartDate : undefined,
    scheduleWeekdays:
      normalized.scheduleType === 'weekdays' ? normalized.scheduleWeekdays : undefined,
  };
}

function withNotificationIds(
  todo: Todo,
  notificationIds: string[],
  ringNotificationIds: string[] = []
): Todo {
  return {
    ...todo,
    notificationIds: notificationIds.length > 0 ? notificationIds : undefined,
    notificationId: notificationIds[0],
    ringNotificationIds: ringNotificationIds.length > 0 ? ringNotificationIds : undefined,
  };
}

export interface TodoRingOptions {
  ringEnabled?: boolean;
  ringSoundId?: RingSoundId;
  ringSoundUri?: string;
}

function hasReminders(todo: Todo): boolean {
  return !!todo.notificationEnabled || !!todo.ringEnabled;
}

async function scheduleNotificationsForTodo(
  todo: Todo,
  maxAlarms: number
): Promise<{
  notificationIds: string[];
  ringNotificationIds: string[];
}> {
  return scheduleTodoReminders({
    maxAlarms,
    todoId: todo.id,
    taskName: todo.name,
    timeStr: todo.notificationTime || '09:00 AM',
    scheduleInput: normalizeScheduleFields(todo),
    completions: todo.completions,
    notificationEnabled: !!todo.notificationEnabled,
    ringEnabled: !!todo.ringEnabled,
    ringSoundId: normalizeRingSoundId(todo.ringSoundId),
    ringSoundUri: todo.ringSoundUri,
  });
}

interface TodosContextType {
  todos: Todo[];
  isLoaded: boolean;
  addTodo: (
    name: string,
    icon: string,
    timeMinutes?: number,
    notificationTime?: string,
    notificationEnabled?: boolean,
    priority?: number,
    category?: string,
    schedule?: Partial<TodoScheduleFields>,
    ring?: TodoRingOptions
  ) => Promise<void>;
  toggleTodo: (id: string, dateKey?: string) => void;
  applyCompletionEdits: (
    edits: { id: string; dateKey: string; completed: boolean }[]
  ) => void;
  deleteTodo: (id: string) => void;
  editTodo: (
    id: string,
    name: string,
    icon: string,
    timeMinutes?: number,
    notificationTime?: string,
    notificationEnabled?: boolean,
    priority?: number,
    category?: string,
    schedule?: Partial<TodoScheduleFields>,
    ring?: TodoRingOptions
  ) => Promise<void>;
  toggleTodoNotification: (id: string) => Promise<void>;
  isTodoCompleted: (todo: Todo, dateKey?: string) => boolean;
  exportData: () => string;
  importData: (
    rawJson: string,
    mode: 'merge' | 'replace'
  ) => { success: boolean; count: number; error?: string };
  clearAllData: () => void;
  /**
   * Replace all todos. Pass `snapshot` (the list the replacement was derived from) to keep
   * local adds/edits/deletes made after it was taken, e.g. during a cloud sync round trip.
   */
  replaceTodos: (nextTodos: Todo[], snapshot?: Todo[]) => void;
}

const TODOS_KEY = TODOS_STORAGE_KEY;

const TodosContext = createContext<TodosContextType | undefined>(undefined);

export function TodosProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const todosRef = useRef<Todo[]>([]);
  const notificationQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  /**
   * Cancel/schedule calls must not interleave: two overlapping reschedules of the same task
   * leave duplicate alarms behind and whichever finishes last would win.
   */
  const runNotificationTask = (task: () => Promise<void>): Promise<void> => {
    const next = notificationQueue.current.then(task).catch((e) => {
      console.warn('[TodosContext] Notification task failed:', e);
    });
    notificationQueue.current = next;
    return next;
  };

  const applyScheduledIds = (
    todoId: string,
    scheduled: { notificationIds: string[]; ringNotificationIds: string[] }
  ) => {
    setTodos((latest) =>
      latest.map((t) =>
        t.id === todoId
          ? withNotificationIds(t, scheduled.notificationIds, scheduled.ringNotificationIds)
          : t
      )
    );
  };

  const alarmBudgetFor = (todo: Todo) => {
    const others = todosRef.current.filter((t) => t.id !== todo.id && hasReminders(t)).length;
    return alarmBudgetPerTodo(others + 1);
  };

  const rescheduleTodo = (todo: Todo) =>
    runNotificationTask(async () => {
      await cancelTodoNotifications(todo);
      applyScheduledIds(todo.id, await scheduleNotificationsForTodo(todo, alarmBudgetFor(todo)));
    });

  // Load from storage on mount and migrate legacy data if needed
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TODOS_KEY);
        let parsed: any[] = [];
        try { parsed = stored ? JSON.parse(stored) : []; } catch { parsed = []; }

        const todayKey = formatDateKey(new Date());
        const migrated: Todo[] = parsed.map((t) => {
          const completions: Record<string, boolean> = { ...(t.completions || {}) };
          if (typeof t.completed === 'boolean' && completions[todayKey] === undefined) {
            completions[todayKey] = t.completed;
          }
          const timeMinutes =
            typeof t.timeMinutes === 'number' && t.timeMinutes > 0 ? t.timeMinutes : 30;
          const priority = normalizePriority(t.priority);
          const schedule = normalizeScheduleFields(t);
          const notificationIds = collectNotificationIds(t);
          const ringNotificationIds = Array.isArray(t.ringNotificationIds)
            ? t.ringNotificationIds.filter((id: unknown) => typeof id === 'string')
            : [];
          return applyScheduleToTodo(
            {
              id: String(t.id),
              name: t.name,
              icon: t.icon,
              category: typeof t.category === 'string' ? t.category : '',
              timeMinutes,
              priority,
              createdAt: t.createdAt || new Date().toISOString(),
              completions,
              notificationTime: t.notificationTime || '09:00 AM',
              notificationEnabled:
                typeof t.notificationEnabled === 'boolean' ? t.notificationEnabled : false,
              notificationId: notificationIds[0],
              notificationIds: notificationIds.length > 0 ? notificationIds : undefined,
              ringEnabled: typeof t.ringEnabled === 'boolean' ? t.ringEnabled : false,
              ringSoundId: normalizeRingSoundId(t.ringSoundId),
              ringSoundUri: typeof t.ringSoundUri === 'string' ? t.ringSoundUri : undefined,
              ringNotificationIds:
                ringNotificationIds.length > 0 ? ringNotificationIds : undefined,
            },
            schedule
          );
        });

        todosRef.current = migrated;
        setTodos(migrated);

        // Refresh reminders so DATE triggers stay ahead of today and skip completed days.
        // Reads the latest todo when each task runs, since this can take a while and the
        // user may edit (or sync may replace) todos in the meantime.
        void runNotificationTask(() => cancelStaleTodoNotifications(migrated));
        for (const todo of migrated) {
          if (!hasReminders(todo)) continue;
          void runNotificationTask(async () => {
            const current = todosRef.current.find((t) => t.id === todo.id);
            if (!current || !hasReminders(current)) return;
            await cancelTodoNotifications(current);
            applyScheduledIds(
              current.id,
              await scheduleNotificationsForTodo(current, alarmBudgetFor(current))
            );
          });
        }
      } catch (e) {
        console.warn('[TodosContext] Failed to load from AsyncStorage:', e);
        setTodos([]);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist todos whenever they change, and refresh the Android heatmap widget
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos)).catch((e) =>
      console.warn('[TodosContext] Failed to save to AsyncStorage:', e)
    );
    syncMonthlyHeatmapWidget(todos);
  }, [todos, isLoaded]);

  // Notification action buttons (Mark as done / Snooze / Off)
  useEffect(() => {
    const cleanup = setupNotificationListeners();
    registerNotificationActionHandlers({
      markDone: (todoId, dateKey) => {
        setTodos((prev) => {
          const existing = prev.find((t) => t.id === todoId);
          if (!existing || isTodoCompleted(existing, dateKey)) return prev;
          const updated: Todo = {
            ...existing,
            completions: {
              ...(existing.completions || {}),
              [dateKey]: true,
            },
          };
          if (updated.notificationEnabled || updated.ringEnabled) {
            void rescheduleTodo(updated);
          }
          return prev.map((t) => (t.id === todoId ? updated : t));
        });
      },
    });
    return cleanup;
    // Register once; rescheduleTodo only touches refs and the state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTodo = async (
    name: string,
    icon: string,
    timeMinutes?: number,
    notificationTime?: string,
    notificationEnabled?: boolean,
    priority?: number,
    category?: string,
    schedule?: Partial<TodoScheduleFields>,
    ring?: TodoRingOptions
  ) => {
    const minutes =
      typeof timeMinutes === 'number' && !isNaN(timeMinutes) && timeMinutes > 0
        ? timeMinutes
        : 30;
    const prio = normalizePriority(priority);
    const id = Date.now().toString();
    const timeStr = notificationTime || '09:00 AM';
    const scheduleFields = normalizeScheduleFields(schedule ?? {});
    const ringEnabled = !!ring?.ringEnabled;
    const ringSoundId = normalizeRingSoundId(ring?.ringSoundId);
    const ringSoundUri = ring?.ringSoundUri;

    const newTodo = applyScheduleToTodo(
      {
        id,
        name: name.trim(),
        icon,
        category: category?.trim() || '',
        timeMinutes: minutes,
        priority: prio,
        createdAt: new Date().toISOString(),
        completions: {},
        notificationTime: timeStr,
        notificationEnabled: !!notificationEnabled,
        ringEnabled,
        ringSoundId,
        ringSoundUri,
      },
      scheduleFields
    );
    setTodos((prev) => [...prev, newTodo]);
    void rescheduleTodo(newTodo);
  };

  const toggleTodo = (id: string, dateKey?: string) => {
    const targetDate = dateKey || formatDateKey(new Date());
    setTodos((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (!existing) return prev;

      const currentlyDone = isTodoCompleted(existing, targetDate);
      const updated: Todo = {
        ...existing,
        completions: {
          ...(existing.completions || {}),
          [targetDate]: !currentlyDone,
        },
      };

      if (updated.notificationEnabled || updated.ringEnabled) {
        void rescheduleTodo(updated);
      }

      return prev.map((t) => (t.id === id ? updated : t));
    });
  };

  const applyCompletionEdits = (
    edits: { id: string; dateKey: string; completed: boolean }[]
  ) => {
    if (!edits.length) return;
    const byTodo = new Map<string, Record<string, boolean>>();
    for (const edit of edits) {
      const current = byTodo.get(edit.id) || {};
      current[edit.dateKey] = edit.completed;
      byTodo.set(edit.id, current);
    }
    setTodos((prev) => {
      const next = prev.map((t) => {
        const overrides = byTodo.get(t.id);
        if (!overrides) return t;
        return {
          ...t,
          completions: {
            ...(t.completions || {}),
            ...overrides,
          },
        };
      });

      for (const todo of next) {
        if ((todo.notificationEnabled || todo.ringEnabled) && byTodo.has(todo.id)) {
          void rescheduleTodo(todo);
        }
      }

      return next;
    });
  };

  const deleteTodo = (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (target) {
      void runNotificationTask(() => cancelTodoNotifications(target));
    }
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const editTodo = async (
    id: string,
    name: string,
    icon: string,
    timeMinutes?: number,
    notificationTime?: string,
    notificationEnabled?: boolean,
    priority?: number,
    category?: string,
    schedule?: Partial<TodoScheduleFields>,
    ring?: TodoRingOptions
  ) => {
    const minutes =
      typeof timeMinutes === 'number' && !isNaN(timeMinutes) && timeMinutes > 0
        ? timeMinutes
        : 30;
    const prio = normalizePriority(priority);
    const timeStr = notificationTime || '09:00 AM';

    const existing = todos.find((t) => t.id === id);
    if (!existing) return;

    const scheduleFields = normalizeScheduleFields({
      ...existing,
      ...schedule,
    });

    const ringEnabled = ring ? !!ring.ringEnabled : !!existing.ringEnabled;
    const ringSoundId = normalizeRingSoundId(ring?.ringSoundId ?? existing.ringSoundId);
    const ringSoundUri =
      ring && 'ringSoundUri' in ring ? ring.ringSoundUri : existing.ringSoundUri;

    const applyEdits = (todo: Todo): Todo =>
      applyScheduleToTodo(
        {
          ...todo,
          name: name.trim(),
          icon,
          category: category?.trim() || '',
          timeMinutes: minutes,
          priority: prio,
          notificationTime: timeStr,
          notificationEnabled: !!notificationEnabled,
          ringEnabled,
          ringSoundId,
          ringSoundUri,
        },
        scheduleFields
      );

    // Persist the edit first; rescheduling (up to ~120 native calls) patches ids in afterwards.
    setTodos((prev) => prev.map((t) => (t.id === id ? applyEdits(t) : t)));
    void rescheduleTodo(applyEdits(existing));
  };

  const toggleTodoNotification = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const notificationEnabled = !target.notificationEnabled;
    const notificationTime = target.notificationTime || '09:00 AM';
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notificationEnabled, notificationTime } : t))
    );
    await rescheduleTodo({ ...target, notificationEnabled, notificationTime });
  };

  const exportData = (): string => {
    const payload = {
      appName: 'HabitCare',
      version: 1,
      exportedAt: new Date().toISOString(),
      todos,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importData = (
    rawJson: string,
    mode: 'merge' | 'replace'
  ): { success: boolean; count: number; error?: string } => {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        return {
          success: false,
          count: 0,
          error: 'Invalid JSON format. Please paste or choose a valid JSON file.',
        };
      }

      let candidateTodos: any[] = [];
      if (Array.isArray(parsed)) {
        candidateTodos = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.todos)) {
        candidateTodos = parsed.todos;
      } else {
        return {
          success: false,
          count: 0,
          error: 'JSON must contain an array of habits or an object with a "todos" array.',
        };
      }

      if (candidateTodos.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'No habit items found in the imported JSON.',
        };
      }

      const validImportedTodos: Todo[] = [];
      for (let i = 0; i < candidateTodos.length; i++) {
        const item = candidateTodos[i];
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.name !== 'string' ||
          !item.name.trim()
        ) {
          continue;
        }
        const timeMinutes =
          typeof item.timeMinutes === 'number' && item.timeMinutes > 0 ? item.timeMinutes : 30;
        const priority = normalizePriority(item.priority);
        const completions: Record<string, boolean> =
          item.completions && typeof item.completions === 'object'
            ? { ...item.completions }
            : {};

        const notificationIds = collectNotificationIds(item);
        validImportedTodos.push(
          applyScheduleToTodo(
            {
              id: item.id ? String(item.id) : `${Date.now()}_${i}`,
              name: String(item.name).trim(),
              icon: item.icon ? String(item.icon) : 'circle-check',
              category: typeof item.category === 'string' ? item.category.trim() : '',
              timeMinutes,
              priority,
              createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
              completions,
              notificationTime: item.notificationTime || '09:00 AM',
              notificationEnabled:
                typeof item.notificationEnabled === 'boolean' ? item.notificationEnabled : false,
              notificationId: notificationIds[0],
              notificationIds: notificationIds.length > 0 ? notificationIds : undefined,
              ringEnabled: typeof item.ringEnabled === 'boolean' ? item.ringEnabled : false,
              ringSoundId: normalizeRingSoundId(item.ringSoundId),
              ringSoundUri:
                typeof item.ringSoundUri === 'string' ? item.ringSoundUri : undefined,
            },
            item
          )
        );
      }

      if (validImportedTodos.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'Could not extract valid habit records from the JSON.',
        };
      }

      if (mode === 'replace') {
        setTodos(validImportedTodos);
        return { success: true, count: validImportedTodos.length };
      } else {
        // Merge mode
        setTodos((prev) => {
          const prevMap = new Map<string, Todo>();
          prev.forEach((t) =>
            prevMap.set(t.id, { ...t, completions: { ...(t.completions || {}) } })
          );

          validImportedTodos.forEach((imp) => {
            if (prevMap.has(imp.id)) {
              const existing = prevMap.get(imp.id)!;
              prevMap.set(imp.id, {
                ...existing,
                name: imp.name || existing.name,
                icon: imp.icon || existing.icon,
                category: imp.category || existing.category || '',
                timeMinutes: imp.timeMinutes || existing.timeMinutes,
                priority: typeof imp.priority === 'number' ? imp.priority : existing.priority,
                notificationTime: imp.notificationTime || existing.notificationTime,
                notificationEnabled:
                  typeof imp.notificationEnabled === 'boolean'
                    ? imp.notificationEnabled
                    : existing.notificationEnabled,
                notificationId: imp.notificationId || existing.notificationId,
                notificationIds: imp.notificationIds || existing.notificationIds,
                ringEnabled:
                  typeof imp.ringEnabled === 'boolean' ? imp.ringEnabled : existing.ringEnabled,
                ringSoundId: imp.ringSoundId || existing.ringSoundId,
                ringSoundUri: imp.ringSoundUri || existing.ringSoundUri,
                ringNotificationIds: imp.ringNotificationIds || existing.ringNotificationIds,
                scheduleType: imp.scheduleType ?? existing.scheduleType,
                scheduleIntervalDays: imp.scheduleIntervalDays ?? existing.scheduleIntervalDays,
                scheduleStartDate: imp.scheduleStartDate ?? existing.scheduleStartDate,
                scheduleWeekdays: imp.scheduleWeekdays ?? existing.scheduleWeekdays,
                completions: {
                  ...(existing.completions || {}),
                  ...(imp.completions || {}),
                },
              });
            } else {
              const existingByName = Array.from(prevMap.values()).find(
                (t) => t.name.toLowerCase() === imp.name.toLowerCase()
              );
              if (existingByName) {
                prevMap.set(existingByName.id, {
                  ...existingByName,
                  completions: {
                    ...(existingByName.completions || {}),
                    ...(imp.completions || {}),
                  },
                });
              } else {
                prevMap.set(imp.id, imp);
              }
            }
          });

          return Array.from(prevMap.values());
        });
        return { success: true, count: validImportedTodos.length };
      }
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        error: err?.message || 'An error occurred during JSON import.',
      };
    }
  };

  const clearAllData = () => {
    todos.forEach((t) => {
      void runNotificationTask(() => cancelTodoNotifications(t));
    });
    setTodos([]);
  };

  const replaceTodos = (nextTodos: Todo[], snapshot?: Todo[]) => {
    if (!snapshot) {
      setTodos(nextTodos);
      return;
    }
    setTodos((latest) => {
      const before = new Map(snapshot.map((t) => [t.id, t]));
      const latestIds = new Set(latest.map((t) => t.id));
      const changedLocally = new Map(
        latest.filter((t) => before.get(t.id) !== t).map((t) => [t.id, t])
      );
      const deletedLocally = new Set(snapshot.filter((t) => !latestIds.has(t.id)).map((t) => t.id));
      if (changedLocally.size === 0 && deletedLocally.size === 0) return nextTodos;

      const merged = nextTodos
        .filter((t) => !deletedLocally.has(t.id))
        .map((t) => changedLocally.get(t.id) ?? t);
      const mergedIds = new Set(merged.map((t) => t.id));
      for (const t of changedLocally.values()) {
        if (!mergedIds.has(t.id)) merged.push(t);
      }
      return merged;
    });
  };

  return (
    <TodosContext.Provider
      value={{
        todos,
        isLoaded,
        addTodo,
        toggleTodo,
        applyCompletionEdits,
        deleteTodo,
        editTodo,
        toggleTodoNotification,
        isTodoCompleted,
        exportData,
        importData,
        clearAllData,
        replaceTodos,
      }}
    >
      {children}
    </TodosContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodosContext);
  if (!ctx) throw new Error('useTodos must be used within TodosProvider');
  return ctx;
}

