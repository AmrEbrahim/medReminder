import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { formatTime } from '../utils/dateUtils';
import type { DoseLog, Medication, DoseStatus } from '../types';

interface Props {
  log: DoseLog;
  medication: Medication;
  onStatusChange: (logId: string, medicationId: string, scheduledTime: string, status: DoseStatus) => void;
}

const STATUS_CONFIG: Record<DoseStatus, { label: string; bg: string; text: string; icon: string }> = {
  pending:  { label: 'Pending',  bg: Colors.primaryLight, text: Colors.primary,   icon: '⏳' },
  taken:    { label: 'Taken',    bg: Colors.secondaryLight, text: Colors.secondary, icon: '✅' },
  skipped:  { label: 'Skipped', bg: Colors.warningLight, text: Colors.warning,   icon: '⏭️' },
  snoozed:  { label: 'Snoozed', bg: Colors.purpleLight, text: Colors.purple,    icon: '💤' },
  missed:   { label: 'Missed',  bg: Colors.errorLight, text: Colors.error,     icon: '❌' },
};

export function DoseCard({ log, medication, onStatusChange }: Props) {
  const cfg = STATUS_CONFIG[log.status];
  const accent = medication.color_hex || Colors.primary;
  const isPending = log.status === 'pending' || log.status === 'snoozed';

  const handleTaken = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStatusChange(log.id, log.medicationId, log.scheduledTime, 'taken');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStatusChange(log.id, log.medicationId, log.scheduledTime, 'skipped');
  };

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStatusChange(log.id, log.medicationId, log.scheduledTime, 'snoozed');
  };

  return (
    <View style={styles.card}>
      <View style={[styles.timeBar, { backgroundColor: accent }]}>
        <Text style={styles.timeText}>{formatTime(log.scheduledTime)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.medName}>{medication.name}</Text>
          <Text style={styles.dosage}>{medication.dosage}{medication.unit} — {medication.form}</Text>
          {medication.instructions && (
            <Text style={styles.instructions}>{medication.instructions}</Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={styles.statusIcon}>{cfg.icon}</Text>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.takenBtn]} onPress={handleTaken}>
            <Text style={styles.takenBtnText}>✅ Taken</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.snoozeBtn]} onPress={handleSnooze}>
            <Text style={styles.snoozeBtnText}>⏰ Snooze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  timeBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  timeText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  info: { flex: 1, gap: 3 },
  medName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  dosage: { fontSize: 13, color: Colors.textSecondary },
  instructions: { fontSize: 12, color: Colors.textTertiary, fontStyle: 'italic' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusIcon: { fontSize: 14 },
  statusText: { fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  takenBtn: { backgroundColor: Colors.secondary },
  takenBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  snoozeBtn: { backgroundColor: Colors.purpleLight },
  snoozeBtnText: { color: Colors.purple, fontWeight: '700', fontSize: 13 },
  skipBtn: { backgroundColor: Colors.surfaceVariant },
  skipBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
});
