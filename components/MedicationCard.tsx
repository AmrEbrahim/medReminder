import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Badge } from './ui/Badge';
import { describeSchedule } from '../utils/scheduleUtils';
import type { Medication } from '../types';

interface Props {
  medication: Medication;
  onPress?: () => void;
  compact?: boolean;
}

const FORM_EMOJI: Record<string, string> = {
  tablet: '💊', capsule: '💉', liquid: '🧴', injection: '💉',
  patch: '🩹', cream: '🧴', drops: '💧', inhaler: '😮‍💨', other: '💊',
};

export function MedicationCard({ medication, onPress, compact }: Props) {
  const accentColor = medication.color_hex || Colors.primary;
  const emoji = FORM_EMOJI[medication.form] || '💊';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress();
    else router.push(`/medications/${medication.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={[styles.colorBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: accentColor + '20' }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>{medication.name}</Text>
            {medication.genericName && (
              <Text style={styles.generic} numberOfLines={1}>{medication.genericName}</Text>
            )}
          </View>
          <View style={styles.dosageBadge}>
            <Text style={[styles.dosageText, { color: accentColor }]}>
              {medication.dosage}{medication.unit}
            </Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.footer}>
            <Text style={styles.schedule}>{describeSchedule(medication.schedule)}</Text>
            {medication.pillCount !== undefined && (
              <Badge
                label={`${medication.pillCount} pills`}
                color={medication.pillCount <= (medication.refillReminderAt || 7) ? Colors.warningLight : Colors.secondaryLight}
                textColor={medication.pillCount <= (medication.refillReminderAt || 7) ? Colors.warning : Colors.secondary}
              />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  colorBar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  titleBlock: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  generic: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  dosageBadge: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dosageText: { fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  schedule: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
});
