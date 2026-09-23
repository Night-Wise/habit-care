import { Platform } from 'react-native';

let Notifications: typeof import('expo-notifications') | null = null;

try {
  // expo-notifications throws an error on import in Expo Go on SDK 53+
  // Requiring inside try-catch allows the app to load cleanly in Expo Go while working in development builds
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  if (Platform.OS !== 'web' && Notifications && Notifications.setNotificationHandler) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (err) {
      console.warn('[Notifications] setNotificationHandler skipped:', err);
    }
  }
} catch {
  // Silent fallback for Expo Go where native remote push notifications are not available
  Notifications = null;
}

/** Default Android notification LED color (purple accent). Pass theme `colors.primary` when available. */
const DEFAULT_NOTIFICATION_LIGHT_COLOR = '#6366f1';

/**
 * Request notification permissions and setup Android notification channel
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
      });
    }

    return true;
  } catch (error) {
    console.warn('[Notifications] Error requesting permissions:', error);
    return false;
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

/**
 * Schedule a daily local notification for a task at its specified timing
 */
export async function scheduleTaskNotification(
  todoId: string,
  taskName: string,
  timeStr: string
): Promise<string | null> {
  if (!Notifications || Platform.OS === 'web') return null;

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[Notifications] Permission not granted for scheduling task notification');
    return null;
  }

  const { hour, minute } = parseTimeString(timeStr);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Task Reminder',
        body: `It's time to complete: ${taskName}`,
        sound: true,
        data: { todoId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (err) {
    console.warn('[Notifications] Failed to schedule notification:', err);
    return null;
  }
}

/**
 * Cancel a scheduled local notification by ID
 */
export async function cancelTaskNotification(notificationId?: string): Promise<void> {
  if (!Notifications || !notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('[Notifications] Failed to cancel notification:', err);
  }
}

/**
 * Send an immediate test push-down notification
 */
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
