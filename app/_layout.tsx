import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { initDatabase } from '../services/storageService';
import { requestNotificationPermissions, registerNotificationCategories, scheduleSnoozeNotification } from '../services/notificationService';
import { useMedicationStore } from '../store/medicationStore';
import { useDoseStore } from '../store/doseStore';
import { useSettingsStore } from '../store/settingsStore';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadMeds = useMedicationStore(s => s.load);
  const loadDoses = useDoseStore(s => s.load);
  const loadSettings = useSettingsStore(s => s.load);

  useEffect(() => {
    async function bootstrap() {
      try {
        await Font.loadAsync(Ionicons.font);
        await initDatabase();
        await Promise.all([loadMeds(), loadDoses(), loadSettings()]);
        await requestNotificationPermissions();
        await registerNotificationCategories();
      } finally {
        SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async response => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as {
        medicationId?: string;
        scheduledTime?: string;
      };

      const medicationId = data.medicationId;
      const scheduledTime = data.scheduledTime;
      if (!medicationId || !scheduledTime) return;

      const { logs, logDose, updateDoseStatus, snooze } = useDoseStore.getState();
      const { settings } = useSettingsStore.getState();
      const existing = logs.find(
        l => l.medicationId === medicationId && l.scheduledTime === scheduledTime,
      );

      if (actionId === 'TAKEN') {
        if (existing?.id) {
          await updateDoseStatus(existing.id, 'taken', new Date().toISOString());
        } else {
          await logDose(medicationId, scheduledTime, 'taken');
        }
      } else if (actionId === 'SNOOZE') {
        if (existing?.id) {
          await snooze(existing.id, settings.snoozeMinutes);
        } else {
          await logDose(medicationId, scheduledTime, 'snoozed');
        }
        const med = useMedicationStore.getState().getById(medicationId);
        if (med) await scheduleSnoozeNotification(med, scheduledTime, settings.snoozeMinutes);
      } else if (actionId === 'SKIP') {
        if (existing?.id) {
          await updateDoseStatus(existing.id, 'skipped');
        } else {
          await logDose(medicationId, scheduledTime, 'skipped');
        }
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="medications/add"
          options={{ headerShown: true, title: 'Add Medication', headerBackTitle: 'Back', headerTintColor: Colors.primary, presentation: 'modal' }}
        />
        <Stack.Screen
          name="medications/scan"
          options={{ headerShown: true, title: 'Scan Prescription', headerBackTitle: 'Back', headerTintColor: Colors.primary, presentation: 'modal' }}
        />
        <Stack.Screen
          name="medications/[id]"
          options={{ headerShown: true, title: 'Medication Detail', headerBackTitle: 'Back', headerTintColor: Colors.primary }}
        />
      </Stack>
    </>
  );
}
