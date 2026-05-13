import React, { useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors } from '../../constants/colors';
import { useMedicationStore } from '../../store/medicationStore';
import { useDoseStore } from '../../store/doseStore';
import { useSettingsStore } from '../../store/settingsStore';
import { scheduleSnoozeNotification } from '../../services/notificationService';
import { DoseCard } from '../../components/DoseCard';
import { StreakBadge } from '../../components/StreakBadge';
import { Card } from '../../components/ui/Card';
import { getScheduledTimesToday, buildScheduledDatetime } from '../../utils/scheduleUtils';
import { calculateStreak } from '../../utils/adherenceUtils';
import type { DoseLog, DoseStatus } from '../../types';

export default function TodayScreen() {
  const { medications, loading: medsLoading } = useMedicationStore();
  const { logs, logDose, updateDoseStatus, snooze, load: loadDoses, loading: dosesLoading } = useDoseStore();
  const { settings } = useSettingsStore();

  const todayLabel = format(new Date(), 'EEEE, MMMM d');

  const todayDoses = useMemo(() => {
    const today = new Date();
    const result: { medication: (typeof medications)[0]; scheduledTime: string; log: DoseLog | undefined }[] = [];

    for (const med of medications) {
      if (!med.isActive) continue;
      const times = getScheduledTimesToday(med);
      for (const time of times) {
        const scheduled = buildScheduledDatetime(today, time);
        const existingLog = logs.find(
          l => l.medicationId === med.id && l.scheduledTime === scheduled.toISOString()
        );
        result.push({ medication: med, scheduledTime: scheduled.toISOString(), log: existingLog });
      }
    }

    return result.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [medications, logs]);

  const pendingCount = todayDoses.filter(d => !d.log || d.log.status === 'pending' || d.log.status === 'snoozed').length;
  const takenCount = todayDoses.filter(d => d.log?.status === 'taken').length;
  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const adherenceToday = todayDoses.length > 0
    ? Math.round((takenCount / todayDoses.length) * 100)
    : null;

  const handleStatusChange = useCallback(async (logId: string, medicationId: string, scheduledTime: string, status: DoseStatus) => {
    if (logId && status !== 'snoozed') {
      await updateDoseStatus(logId, status, status === 'taken' ? new Date().toISOString() : undefined);
    } else if (status === 'snoozed' && logId) {
      await snooze(logId, settings.snoozeMinutes);
      const med = medications.find(m => m.id === medicationId);
      if (med) await scheduleSnoozeNotification(med, scheduledTime, settings.snoozeMinutes);
    } else {
      await logDose(medicationId, scheduledTime, status);
    }

    if (status === 'taken') {
      const med = medications.find(m => m.id === medicationId);
      if (med?.pillsPerDose) {
        await useMedicationStore.getState().decrementPillCount(medicationId, med.pillsPerDose);
      }
    }
  }, [medications, settings.snoozeMinutes, updateDoseStatus, snooze, logDose]);

  const onRefresh = useCallback(async () => {
    await loadDoses();
  }, [loadDoses]);

  const loading = medsLoading || dosesLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
            <Text style={styles.date}>{todayLabel}</Text>
          </View>
          {streak > 0 && <StreakBadge streak={streak} compact />}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{todayDoses.length}</Text>
            <Text style={styles.summaryLabel}>Total Today</Text>
          </Card>
          <Card style={[styles.summaryCard, styles.summaryCardGreen]}>
            <Text style={[styles.summaryNumber, styles.summaryNumberGreen]}>{takenCount}</Text>
            <Text style={styles.summaryLabel}>Taken</Text>
          </Card>
          <Card style={pendingCount > 0 ? [styles.summaryCard, styles.summaryCardWarning] : styles.summaryCard}>
            <Text style={pendingCount > 0 ? [styles.summaryNumber, styles.summaryNumberWarning] : styles.summaryNumber}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </Card>
          {adherenceToday !== null && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{adherenceToday}%</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </Card>
          )}
        </View>

        {/* Refill Alerts */}
        {medications.filter(m => m.isActive && m.pillCount !== undefined && m.pillCount <= (m.refillReminderAt || 7)).map(med => (
          <TouchableOpacity
            key={med.id}
            style={styles.refillAlert}
            onPress={() => router.push(`/medications/${med.id}`)}
          >
            <View style={styles.refillAlertRow}>
              <Ionicons name="medical-outline" size={14} color={Colors.warning} />
              <Text style={styles.refillAlertText}>
                {med.name} — only {med.pillCount} pills left. Time to refill!
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Dose List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Doses</Text>
          {loading && todayDoses.length === 0 && (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
          )}
          {!loading && todayDoses.length === 0 ? (
            <Card style={styles.emptyCard} variant="flat">
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>No doses today!</Text>
              <Text style={styles.emptySubtitle}>
                {medications.length === 0
                  ? 'Add your first medication to get started.'
                  : 'Enjoy your medication-free day.'}
              </Text>
              {medications.length === 0 && (
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/medications/add')}>
                  <Text style={styles.addBtnText}>+ Add Medication</Text>
                </TouchableOpacity>
              )}
            </Card>
          ) : (
            todayDoses.map(({ medication, scheduledTime, log }) => {
              const doseLog: DoseLog = log ?? {
                id: '',
                medicationId: medication.id,
                scheduledTime,
                status: 'pending',
                createdAt: new Date().toISOString(),
              };
              return (
                <DoseCard
                  key={`${medication.id}-${scheduledTime}`}
                  log={doseLog}
                  medication={medication}
                  onStatusChange={handleStatusChange}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  date: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, alignItems: 'center', padding: 12, gap: 4 },
  summaryCardGreen: { backgroundColor: Colors.secondaryLight },
  summaryCardWarning: { backgroundColor: Colors.warningLight },
  summaryNumber: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  summaryNumberGreen: { color: Colors.secondary },
  summaryNumberWarning: { color: Colors.warning },
  summaryLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  refillAlert: {
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  refillAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refillAlertText: { fontSize: 13, color: Colors.warning, fontWeight: '600', flex: 1 },
  section: { gap: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
