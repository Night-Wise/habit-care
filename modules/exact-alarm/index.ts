import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type ExactAlarmNativeModule = {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): boolean;
};

const ExactAlarm =
  Platform.OS === 'android' ? requireOptionalNativeModule<ExactAlarmNativeModule>('ExactAlarm') : null;

/**
 * Whether Android lets the app fire alarms at the exact time. Without it, scheduled reminders
 * become inexact and can arrive much later. Always true off Android or below Android 12.
 */
export function canScheduleExactAlarms(): boolean {
  if (!ExactAlarm) return true;
  try {
    return ExactAlarm.canScheduleExactAlarms();
  } catch {
    return true;
  }
}

/** Opens the system "Alarms & reminders" page for this app. Returns false if unavailable. */
export function openExactAlarmSettings(): boolean {
  if (!ExactAlarm) return false;
  try {
    return ExactAlarm.openExactAlarmSettings();
  } catch {
    return false;
  }
}
