import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { startRingAlarm, stopRingAlarm } from '@/utils/ring-alarm';
import {
  getNotificationSoundValue,
  normalizeRingSoundId,
  RING_DELAY_MS,
  type RingSoundId,
} from '@/utils/ringtones';
import {
  collectNotificationIds,
  getTodoSchedule,
  getUpcomingDueDateKeys,
  type TodoScheduleFields,
} from '@/utils/todo-schedule';

let Notifications: typeof import('expo-notifications') | null = null;

const TODOS_STORAGE_KEY = '@habit_app_todos';
export const TASK_RING_CATEGORY = 'task-ring';
export const RING_ACTION_MARK_DONE = 'mark-done';
export const RING_ACTION_SNOOZE = 'snooze-1h';
export const RING_ACTION_OFF = 'dismiss-ring';

export type NotificationKind = 'popup' | 'ring';

export interface ScheduleRemindersResult {
  notificationIds: string[];
  ringNotificationIds: string[];
}

export interface TodoRingFields {
  ringEnabled?: boolean;
  ringSoundId?: RingSoundId;
  ringSoundUri?: string;
  ringNotificationIds?: string[];
}

type ActionHandlers = {
  markDone: (todoId: string, dateKey: string) => void;
};

let actionHandlers: ActionHandlers | null = null;
let listenersReady = false;

try {
  // expo-notifications throws an error on import in Expo Go on SDK 53+
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  if (Platform.OS !== 'web' && Notifications && Notifications.setNotificationHandler) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = notification.request.content.data as {
            todoId?: string;
            dateKey?: string;
            kind?: NotificationKind;
          };
          const todoId = data?.todoId;
          const dateKey = typeof data?.dateKey === 'string' ? data.dateKey : formatDateKey(new Date());
          const alreadyDone =
            typeof todoId === 'string' && (await isStoredTodoCompletedOn(todoId, dateKey));
          const show = !alreadyDone;

          if (show && data?.kind === 'ring' && typeof todoId === 'string') {
            const soundId = normalizeRingSoundId(
              (notification.request.content.data as { ringSoundId?: string })?.ringSoundId
            );
            const ringSoundUri = (notification.request.content.data as { ringSoundUri?: string })
              ?.ringSoundUri;
            void startRingAlarm(soundId, ringSoundUri);
          }

          return {
            shouldShowAlert: show,
            shouldShowBanner: show,
            shouldShowList: show,
            shouldPlaySound: show,
            shouldSetBadge: false,
          };
        },
      });
    } catch (err) {
      console.warn('[Notifications] setNotificationHandler skipped:', err);
    }
  }
} catch {
  Notifications = null;
}

/** Default Android notification LED color (purple accent). Pass theme `colors.primary` when available. */
const DEFAULT_NOTIFICATION_LIGHT_COLOR = '#6366f1';

const INTERVAL_LOOKAHEAD = 60;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function isStoredTodoCompletedOn(todoId: string, dateKey: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return false;
    const todo = parsed.find((t: { id?: unknown }) => String(t?.id) === String(todoId));
    if (!todo) return false;
    if (todo.completions && typeof todo.completions[dateKey] === 'boolean') {
      return todo.completions[dateKey];
    }
    if (dateKey === formatDateKey(new Date()) && typeof todo.completed === 'boolean') {
      return todo.completed;
    }
    return false;
  } catch {
    return false;
  }
}

async function isStoredTodoCompletedToday(todoId: string): Promise<boolean> {
  return isStoredTodoCompletedOn(todoId, formatDateKey(new Date()));
}

export function registerNotificationActionHandlers(handlers: ActionHandlers): void {
  actionHandlers = handlers;
}

export function collectRingNotificationIds(todo: {
  ringNotificationIds?: string[];
}): string[] {
  if (!Array.isArray(todo.ringNotificationIds)) return [];
  return todo.ringNotificationIds.filter((id) => typeof id === 'string' && id.trim());
}

export function collectAllTodoNotificationIds(todo: {
  notificationId?: string;
  notificationIds?: string[];
  ringNotificationIds?: string[];
}): string[] {
  return [...collectNotificationIds(todo), ...collectRingNotificationIds(todo)];
}

/**
 * Request notification permissions, Android channels, and interactive ring actions.
 */
export async function requestNotificationPermissions(
  lightColor: string = DEFAULT_NOTIFICATION_LIGHT_COLOR
): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      await Notifications.setNotificationChannelAsync('ring', {
        name: 'Ring Alarms',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        // Omit `sound` for the system default. A string is treated as a custom
        // sound filename and must exist in the expo-notifications plugin sounds list.
      });
    }

    await ensureRingCategory();
    return true;
  } catch (error) {
    console.warn('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

async function ensureRingCategory(): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync(TASK_RING_CATEGORY, [
      {
        identifier: RING_ACTION_MARK_DONE,
        buttonTitle: 'Mark as done',
        options: { opensAppToForeground: true },
      },
      {
        identifier: RING_ACTION_SNOOZE,
        buttonTitle: 'Remind me after 1 hour',
        options: { opensAppToForeground: false },
      },
      {
        identifier: RING_ACTION_OFF,
        buttonTitle: 'Off notification',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (err) {
    console.warn('[Notifications] Failed to set ring category:', err);
  }
}

/**
 * Wire received/response listeners once (call from app root).
 */
export function setupNotificationListeners(): () => void {
  if (!Notifications || Platform.OS === 'web' || listenersReady) {
    return () => {};
  }
  listenersReady = true;
  void ensureRingCategory();

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as {
      kind?: NotificationKind;
      todoId?: string;
      dateKey?: string;
      ringSoundId?: string;
      ringSoundUri?: string;
    };
    if (data?.kind !== 'ring' || typeof data.todoId !== 'string') return;
    void (async () => {
      const dateKey = data.dateKey || formatDateKey(new Date());
      if (await isStoredTodoCompletedOn(data.todoId!, dateKey)) {
        await stopRingAlarm();
        return;
      }
      await startRingAlarm(normalizeRingSoundId(data.ringSoundId), data.ringSoundUri);
    })();
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    void handleNotificationResponse(response);
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) void handleNotificationResponse(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
    listenersReady = false;
  };
}

async function handleNotificationResponse(
  response: import('expo-notifications').NotificationResponse
): Promise<void> {
  const actionId = response.actionIdentifier;
  const data = response.notification.request.content.data as {
    kind?: NotificationKind;
    todoId?: string;
    dateKey?: string;
    ringSoundId?: string;
    ringSoundUri?: string;
    taskName?: string;
  };
  const todoId = typeof data?.todoId === 'string' ? data.todoId : null;
  const dateKey =
    typeof data?.dateKey === 'string' ? data.dateKey : formatDateKey(new Date());

  if (actionId === RING_ACTION_OFF) {
    await stopRingAlarm();
    return;
  }

  if (actionId === Notifications?.DEFAULT_ACTION_IDENTIFIER) {
    if (data?.kind === 'ring') await stopRingAlarm();
    return;
  }

  if (!todoId) return;

  if (actionId === RING_ACTION_MARK_DONE) {
    await stopRingAlarm();
    actionHandlers?.markDone(todoId, dateKey);
    return;
  }

  if (actionId === RING_ACTION_SNOOZE) {
    await stopRingAlarm();
    const soundId = normalizeRingSoundId(data.ringSoundId);
    await scheduleSnoozeRingNotification({
      todoId,
      taskName: typeof data.taskName === 'string' ? data.taskName : 'Task',
      dateKey,
      ringSoundId: soundId,
      ringSoundUri: data.ringSoundUri,
    });
  }
}

/**
 * Parse time string like "6:00 AM" or "10:30 PM" into hour (0-23) and minute (0-59)
 */
export function parseTimeString(timeStr?: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 9, minute: 0 };
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hour: 9, minute: 0 };

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm) {
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }

  return { hour: Math.min(23, Math.max(0, hour)), minute: Math.min(59, Math.max(0, minute)) };
}

function buildPopupContent(todoId: string, taskName: string, dateKey: string) {
  return {
    title: '⏰ Task Reminder',
    body: `It's time to complete: ${taskName}`,
    sound: true as const,
    data: { todoId, taskName, dateKey, kind: 'popup' as const },
  };
}

function buildRingContent(
  todoId: string,
  taskName: string,
  dateKey: string,
  ringSoundId: RingSoundId,
  ringSoundUri?: string
) {
  return {
    title: '🔔 Ring Alarm',
    body: `Still pending: ${taskName}`,
    sound: getNotificationSoundValue(ringSoundId),
    categoryIdentifier: TASK_RING_CATEGORY,
    data: {
      todoId,
      taskName,
      dateKey,
      kind: 'ring' as const,
      ringSoundId,
      ringSoundUri,
    },
    ...(Platform.OS === 'android' ? { channelId: 'ring' } : {}),
  };
}

async function scheduleOne(
  content: Record<string, unknown>,
  trigger: import('expo-notifications').SchedulableNotificationTriggerInput
): Promise<string | null> {
  if (!Notifications) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: content as import('expo-notifications').NotificationContentInput,
      trigger,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to schedule notification:', err);
    return null;
  }
}

/**
 * Schedule popup and/or ring reminders for a task.
 * Ring fires 30 minutes after the popup time. Skips completed days.
 */
export async function scheduleTodoReminders(options: {
  todoId: string;
  taskName: string;
  timeStr: string;
  scheduleInput?: Partial<TodoScheduleFields>;
  completions?: Record<string, boolean>;
  notificationEnabled?: boolean;
  ringEnabled?: boolean;
  ringSoundId?: RingSoundId;
  ringSoundUri?: string;
}): Promise<ScheduleRemindersResult> {
  const empty: ScheduleRemindersResult = { notificationIds: [], ringNotificationIds: [] };
  if (!Notifications || Platform.OS === 'web') return empty;

  const wantsPopup = !!options.notificationEnabled;
  const wantsRing = !!options.ringEnabled;
  if (!wantsPopup && !wantsRing) return empty;

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[Notifications] Permission not granted for scheduling');
    return empty;
  }

  const { hour, minute } = parseTimeString(options.timeStr);
  const schedule = getTodoSchedule(options.scheduleInput ?? {});
  const ringSoundId = normalizeRingSoundId(options.ringSoundId);
  const now = new Date();
  const dueKeys = getUpcomingDueDateKeys(schedule, now, INTERVAL_LOOKAHEAD);
  const notificationIds: string[] = [];
  const ringNotificationIds: string[] = [];

  for (const key of dueKeys) {
    if (options.completions?.[key]) continue;

    const parts = key.split('-').map(Number);
    const popupAt = new Date(parts[0], parts[1] - 1, parts[2], hour, minute, 0, 0);

    if (wantsPopup && popupAt.getTime() > now.getTime()) {
      const id = await scheduleOne(buildPopupContent(options.todoId, options.taskName, key), {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: popupAt,
      });
      if (id) notificationIds.push(id);
    }

    if (wantsRing) {
      const ringAt = new Date(popupAt.getTime() + RING_DELAY_MS);
      if (ringAt.getTime() > now.getTime()) {
        const id = await scheduleOne(
          buildRingContent(
            options.todoId,
            options.taskName,
            key,
            ringSoundId,
            options.ringSoundUri
          ),
          {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: ringAt,
          }
        );
        if (id) ringNotificationIds.push(id);
      }
    }
  }

  return { notificationIds, ringNotificationIds };
}

/** @deprecated Prefer scheduleTodoReminders — kept for simple popup-only callers */
export async function scheduleTaskNotification(
  todoId: string,
  taskName: string,
  timeStr: string,
  scheduleInput?: Partial<TodoScheduleFields>,
  completions?: Record<string, boolean>
): Promise<string[]> {
  const result = await scheduleTodoReminders({
    todoId,
    taskName,
    timeStr,
    scheduleInput,
    completions,
    notificationEnabled: true,
    ringEnabled: false,
  });
  return result.notificationIds;
}

export async function scheduleSnoozeRingNotification(options: {
  todoId: string;
  taskName: string;
  dateKey: string;
  ringSoundId: RingSoundId;
  ringSoundUri?: string;
}): Promise<string | null> {
  if (!Notifications || Platform.OS === 'web') return null;
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (await isStoredTodoCompletedOn(options.todoId, options.dateKey)) {
    return null;
  }

  const fireAt = new Date(Date.now() + 60 * 60 * 1000);
  return scheduleOne(
    buildRingContent(
      options.todoId,
      options.taskName,
      options.dateKey,
      options.ringSoundId,
      options.ringSoundUri
    ),
    {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    }
  );
}

export async function cancelTaskNotification(
  notificationIdOrIds?: string | string[] | null
): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  const ids = Array.isArray(notificationIdOrIds)
    ? notificationIdOrIds
    : notificationIdOrIds
      ? [notificationIdOrIds]
      : [];
  for (const notificationId of ids) {
    if (!notificationId) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn('[Notifications] Failed to cancel notification:', err);
    }
  }
}

export async function cancelTodoNotifications(todo: {
  notificationId?: string;
  notificationIds?: string[];
  ringNotificationIds?: string[];
}): Promise<void> {
  await cancelTaskNotification(collectAllTodoNotificationIds(todo));
}

export async function sendTestNotification(): Promise<boolean> {
  if (!Notifications || Platform.OS === 'web') {
    return false;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'Notifications are working perfectly! You will receive task alerts at your scheduled times.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
      },
    });
    return true;
  } catch (err) {
    console.warn('[Notifications] Test notification failed:', err);
    return false;
  }
}

/**
 * Test ring notification: schedule interactive alarm + start a short loop locally.
 * On web / Expo Go without notifications, still plays the ringtone for a short preview.
 */
export async function sendTestRingNotification(
  soundId: RingSoundId = 'clock',
  customUri?: string | null
): Promise<{ scheduled: boolean; ringing: boolean }> {
  const ringing = await startRingAlarm(soundId, customUri, 10_000);

  if (!Notifications || Platform.OS === 'web') {
    return { scheduled: false, ringing };
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return { scheduled: false, ringing };
  }

  try {
    const todayKey = formatDateKey(new Date());
    await Notifications.scheduleNotificationAsync({
      content: buildRingContent('test', 'Test habit', todayKey, soundId, customUri ?? undefined),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
      },
    });
    return { scheduled: true, ringing };
  } catch (err) {
    console.warn('[Notifications] Test ring notification failed:', err);
    return { scheduled: false, ringing };
  }
}

export { isStoredTodoCompletedToday };
