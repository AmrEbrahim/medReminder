import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useSettingsStore } from '../../store/settingsStore';
import { useMedicationStore } from '../../store/medicationStore';
import { useDoseStore } from '../../store/doseStore';
import { Card } from '../../components/ui/Card';
import { scheduleAllNotifications } from '../../services/notificationService';

function SettingRow({
  icon, label, description, right,
}: { icon: string; label: string; description?: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, update } = useSettingsStore();
  const { medications } = useMedicationStore();
  const { logs } = useDoseStore();
  const [caregiverEmail, setCaregiverEmail] = useState(settings.defaultCaregiverEmail ?? '');
  const [userName, setUserName] = useState(settings.name ?? '');

  const snoozeOptions = [5, 10, 15, 30];
  const escalateOptions = [15, 30, 60, 120];

  const handleRescheduleNotifications = async () => {
    await scheduleAllNotifications(medications.filter(m => m.isActive));
    Alert.alert('Done', 'All medication reminders have been rescheduled.');
  };

  const handleSaveProfile = () => {
    update({ name: userName, defaultCaregiverEmail: caregiverEmail });
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const stats = {
    totalMeds: medications.filter(m => m.isActive).length,
    totalLogs: logs.length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <Card style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(settings.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.statLine}>{stats.totalMeds} medications · {stats.totalLogs} dose logs</Text>
            </View>
          </View>
          <TextInput
            style={styles.emailInput}
            value={caregiverEmail}
            onChangeText={setCaregiverEmail}
            placeholder="Caregiver email (optional)"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="🔔"
            label="Medication Reminders"
            description="Receive alerts at scheduled times"
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={v => update({ notificationsEnabled: v })}
                trackColor={{ true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔊"
            label="Sound"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={v => update({ soundEnabled: v })}
                trackColor={{ true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📳"
            label="Vibration"
            right={
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={v => update({ vibrationEnabled: v })}
                trackColor={{ true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Card>

        {/* Snooze Duration */}
        <Text style={styles.sectionLabel}>SNOOZE DURATION</Text>
        <Card style={styles.card}>
          <View style={styles.chipRow}>
            {snoozeOptions.map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.chip, settings.snoozeMinutes === min && styles.chipActive]}
                onPress={() => update({ snoozeMinutes: min })}
              >
                <Text style={[styles.chipText, settings.snoozeMinutes === min && styles.chipTextActive]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Escalating Alert */}
        <Text style={styles.sectionLabel}>ESCALATING ALERT AFTER</Text>
        <Card style={styles.card}>
          <Text style={styles.cardHint}>Alert again if a dose is not acknowledged</Text>
          <View style={styles.chipRow}>
            {escalateOptions.map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.chip, settings.escalateAfterMinutes === min && styles.chipActive]}
                onPress={() => update({ escalateAfterMinutes: min })}
              >
                <Text style={[styles.chipText, settings.escalateAfterMinutes === min && styles.chipTextActive]}>
                  {min >= 60 ? `${min / 60}h` : `${min}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Tools */}
        <Text style={styles.sectionLabel}>TOOLS</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleRescheduleNotifications}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionText}>Reschedule All Notifications</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>App</Text>
            <Text style={styles.aboutValue}>medReminder</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>OCR Engine</Text>
            <Text style={styles.aboutValue}>Gemini 2.5 Flash</Text>
          </View>
        </Card>

        <Text style={styles.disclaimer}>
          ⚕️ medReminder is a reminder tool only. Always follow your doctor's instructions. Do not use this app as medical advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8, gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginTop: 8 },
  card: { gap: 4 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  nameInput: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, paddingVertical: 2 },
  statLine: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emailInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, marginBottom: 10,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  settingIcon: { fontSize: 18 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  settingDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  cardHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  actionIcon: { fontSize: 20 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textTertiary },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  aboutKey: { fontSize: 14, color: Colors.textSecondary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  disclaimer: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});
