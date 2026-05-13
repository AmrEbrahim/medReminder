import * as Notifications from 'expo-notifications';
import { buildScheduledDatetime } from '../utils/scheduleUtils';
import type { Medication } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAllNotifications(medications: Medication[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const med of medications) {
    if (!med.isActive) continue;
    await scheduleMedicationNotifications(med);
  }
}

export async function scheduleMedicationNotifications(med: Medication): Promise<string[]> {
  const ids: string[] = [];
  const today = new Date();
  // Schedule for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const times = getTimesForDate(med, targetDate);

    for (const time of times) {
      const scheduled = buildScheduledDatetime(targetDate, time);
      if (scheduled <= new Date()) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to take ${med.name}`,
          body: `${med.dosage}${med.unit} — ${med.instructions || 'Tap to log your dose'}`,
          data: { medicationId: med.id, scheduledTime: scheduled.toISOString() },
          categoryIdentifier: 'DOSE_REMINDER',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduled,
        },
      });
      ids.push(id);
    }
  }
  return ids;
}

function getTimesForDate(med: Medication, date: Date): string[] {
  const { schedule } = med;
  const dayOfWeek = date.getDay();

  if (schedule.type === 'as-needed') return [];
  if (schedule.type === 'specific-days' && schedule.daysOfWeek) {
    if (!schedule.daysOfWeek.includes(dayOfWeek)) return [];
  }
  if (schedule.type === 'every-x-hours' && schedule.intervalHours) {
    const times: string[] = [];
    let hour = 8;
    while (hour < 24) {
      times.push(`${String(hour).padStart(2, '0')}:00`);
      hour += schedule.intervalHours;
    }
    return times;
  }
  return schedule.times || [];
}

export async function cancelMedicationNotifications(medicationId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function scheduleEscalatingAlert(
  med: Medication,
  scheduledTime: string,
  afterMinutes: number
): Promise<string> {
  const date = new Date(new Date(scheduledTime).getTime() + afterMinutes * 60000);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ Missed dose: ${med.name}`,
      body: `You haven't logged your ${med.dosage}${med.unit} dose yet. Please take it now.`,
      data: { medicationId: med.id, type: 'escalating' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}

export async function scheduleSnoozeNotification(
  med: Medication,
  originalScheduledTime: string,
  snoozeMinutes: number,
): Promise<string> {
  const date = new Date(Date.now() + snoozeMinutes * 60000);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to take ${med.name}`,
      body: `${med.dosage}${med.unit} — snoozed ${snoozeMinutes}m reminder`,
      data: { medicationId: med.id, scheduledTime: originalScheduledTime },
      categoryIdentifier: 'DOSE_REMINDER',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('DOSE_REMINDER', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'SKIP',
      buttonTitle: 'Skip',
      options: { isDestructive: true, isAuthenticationRequired: false },
    },
  ]);
}
