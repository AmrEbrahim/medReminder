import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { initDatabase } from '../services/storageService';
import { requestNotificationPermissions, registerNotificationCategories } from '../services/notificationService';
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
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as any;
      // Quick-action response handling lives in the notification service
      // Full handling would dispatch to the dose store here
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
