import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { subDays, endOfDay, startOfDay } from 'date-fns';
import { Colors } from '../../constants/colors';
import { useMedicationStore } from '../../store/medicationStore';
import { useDoseStore } from '../../store/doseStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AdherenceChart } from '../../components/AdherenceChart';
import { calculateAdherence, getAdherenceLabel } from '../../utils/adherenceUtils';
import { describeSchedule, daysUntilRefill } from '../../utils/scheduleUtils';
import { lookupDrug } from '../../constants/drugInteractions';

const FORM_EMOJI: Record<string, string> = {
  tablet: '💊', capsule: '💉', liquid: '🧴', injection: '💉',
  patch: '🩹', cream: '🧴', drops: '💧', inhaler: '😮‍💨', other: '💊',
};

function InfoRow({ label, value }: { readonly label: string; readonly value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function mealLabel(instruction?: string): string {
  if (instruction === 'before') return 'Before meals';
  if (instruction === 'after') return 'After meals';
  return 'With meals';
}

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, remove, update } = useMedicationStore();
  const { logs } = useDoseStore();
  const [showDrugInfo, setShowDrugInfo] = useState(false);

  const medication = getById(id);

  // ── All hooks must run unconditionally, before any early return ──────────
  const medLogs = useMemo(
    () => logs.filter(l => l.medicationId === id),
    [logs, id]
  );

  const report = useMemo(() => {
    const end = endOfDay(new Date()).toISOString();
    const start = startOfDay(subDays(new Date(), 6)).toISOString();
    return calculateAdherence(medLogs, start, end);
  }, [medLogs]);
  // ─────────────────────────────────────────────────────────────────────────

  if (!medication) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Medication not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Capture a stable reference after the early-return guard so closures below
  // don't need non-null assertions (TypeScript can't narrow inside closures).
  const med = medication;

  const accent = med.color_hex || Colors.primary;
  const emoji = FORM_EMOJI[med.form] || '💊';
  const drugInfo = lookupDrug(med.name)
    ?? (med.genericName ? lookupDrug(med.genericName) : undefined);
  const { label: adherenceLabel, color: adherenceColor } = getAdherenceLabel(report.rate);
  const daysLeft = daysUntilRefill(med);

  function handleDelete() {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove ${med.name}? Your dose history will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => {
            // Navigate away first — the store update happens asynchronously
            // and the screen will already be unmounted, preventing the
            // "not found" flash and avoiding a hook-count mismatch crash.
            router.back();
            void remove(id);
          },
        },
      ]
    );
  }

  function handleToggleActive() {
    void update(id, { isActive: !med.isActive });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: accent + '15' }]}>
          <View style={[styles.heroIcon, { backgroundColor: accent + '30' }]}>
            <Text style={styles.heroEmoji}>{emoji}</Text>
          </View>
          <Text style={[styles.heroName, { color: accent }]}>{med.name}</Text>
          {med.genericName && (
            <Text style={styles.heroGeneric}>{med.genericName}</Text>
          )}
          <View style={styles.heroBadgeRow}>
            <Badge label={`${med.dosage}${med.unit}`} color={accent + '20'} textColor={accent} />
            <Badge
              label={med.form.charAt(0).toUpperCase() + med.form.slice(1)}
              color={Colors.surfaceVariant}
              textColor={Colors.textSecondary}
            />
            {!med.isActive && (
              <Badge label="Inactive" color={Colors.errorLight} textColor={Colors.error} />
            )}
          </View>
        </View>

        {/* Schedule */}
        <Card style={styles.card} variant="flat">
          <Text style={styles.cardTitle}>📅 Schedule</Text>
          <Text style={styles.scheduleText}>{describeSchedule(med.schedule)}</Text>
          {med.schedule.withMeals && (
            <Text style={styles.mealNote}>
              {mealLabel(med.schedule.mealInstruction)}
            </Text>
          )}
          {med.instructions && (
            <Text style={styles.instr}>{med.instructions}</Text>
          )}
        </Card>

        {/* Refill */}
        {med.pillCount !== undefined && (
          <Card
            style={med.pillCount <= (med.refillReminderAt ?? 7)
              ? [styles.card, styles.refillWarningCard]
              : styles.card}
            variant="flat"
          >
            <Text style={styles.cardTitle}>💊 Refill Status</Text>
            <View style={styles.refillRow}>
              <View style={styles.refillItem}>
                <Text style={styles.refillNumber}>{med.pillCount}</Text>
                <Text style={styles.refillLabel}>pills left</Text>
              </View>
              {daysLeft !== null && (
                <View style={styles.refillItem}>
                  <Text style={daysLeft <= 7 ? [styles.refillNumber, { color: Colors.warning }] : styles.refillNumber}>
                    {daysLeft}
                  </Text>
                  <Text style={styles.refillLabel}>days supply</Text>
                </View>
              )}
            </View>
            {med.pillCount <= (med.refillReminderAt ?? 7) && (
              <Text style={styles.refillWarning}>⚠️ Running low — time to refill!</Text>
            )}
          </Card>
        )}

        {/* 7-day Adherence */}
        <Card style={styles.card} variant="flat">
          <View style={styles.adherenceHeader}>
            <Text style={styles.cardTitle}>📊 Last 7 Days</Text>
            <Text style={[styles.adherenceRate, { color: adherenceColor }]}>
              {report.rate}% · {adherenceLabel}
            </Text>
          </View>
          <AdherenceChart data={report.dailyRates} />
          <View style={styles.adherenceStats}>
            <View style={styles.adherenceStat}>
              <Text style={[styles.adherenceStatNum, { color: Colors.secondary }]}>{report.takenDoses}</Text>
              <Text style={styles.adherenceStatLabel}>Taken</Text>
            </View>
            <View style={styles.adherenceStat}>
              <Text style={[styles.adherenceStatNum, { color: Colors.warning }]}>{report.skippedDoses}</Text>
              <Text style={styles.adherenceStatLabel}>Skipped</Text>
            </View>
            <View style={styles.adherenceStat}>
              <Text style={[styles.adherenceStatNum, { color: Colors.error }]}>{report.missedDoses}</Text>
              <Text style={styles.adherenceStatLabel}>Missed</Text>
            </View>
            <View style={styles.adherenceStat}>
              <Text style={styles.adherenceStatNum}>{report.totalDoses}</Text>
              <Text style={styles.adherenceStatLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Prescription Info */}
        {(med.prescribedBy || med.pharmacy || med.rxNumber) && (
          <Card style={styles.card} variant="flat">
            <Text style={styles.cardTitle}>📋 Prescription</Text>
            <InfoRow label="Prescribed By" value={med.prescribedBy} />
            <InfoRow label="Pharmacy" value={med.pharmacy} />
            <InfoRow label="Rx Number" value={med.rxNumber} />
          </Card>
        )}

        {/* Drug Info */}
        {drugInfo && (
          <Card style={styles.card} variant="flat">
            <TouchableOpacity style={styles.drugInfoHeader} onPress={() => setShowDrugInfo(!showDrugInfo)}>
              <Text style={styles.cardTitle}>🔬 Drug Information</Text>
              <Text style={styles.chevron}>{showDrugInfo ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showDrugInfo && (
              <View style={styles.drugInfoBody}>
                {drugInfo.category && (
                  <Badge label={drugInfo.category} color={Colors.primaryLight} textColor={Colors.primary} />
                )}
                {drugInfo.description && (
                  <Text style={styles.drugDesc}>{drugInfo.description}</Text>
                )}
                {drugInfo.commonSideEffects && drugInfo.commonSideEffects.length > 0 && (
                  <View style={styles.drugSection}>
                    <Text style={styles.drugSectionTitle}>Common Side Effects</Text>
                    {drugInfo.commonSideEffects.map((s) => (
                      <Text key={s} style={styles.drugItem}>• {s}</Text>
                    ))}
                  </View>
                )}
                {drugInfo.seriousSideEffects && drugInfo.seriousSideEffects.length > 0 && (
                  <View style={[styles.drugSection, styles.seriousSection]}>
                    <Text style={styles.seriousTitle}>⚠️ Serious Side Effects</Text>
                    {drugInfo.seriousSideEffects.map((s) => (
                      <Text key={s} style={styles.seriousItem}>• {s}</Text>
                    ))}
                  </View>
                )}
                {drugInfo.storageInfo && (
                  <View style={styles.drugSection}>
                    <Text style={styles.drugSectionTitle}>Storage</Text>
                    <Text style={styles.drugDesc}>{drugInfo.storageInfo}</Text>
                  </View>
                )}
                {drugInfo.pregnancy && (
                  <View style={styles.drugSection}>
                    <Text style={styles.drugSectionTitle}>Pregnancy</Text>
                    <Text style={styles.drugDesc}>{drugInfo.pregnancy}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Caregiver */}
        {med.caregiverAlerts && (
          <Card style={styles.card} variant="flat">
            <Text style={styles.cardTitle}>👥 Caregiver Alerts</Text>
            <InfoRow label="Caregiver" value={med.caregiverName} />
            <InfoRow label="Contact" value={med.caregiverPhone} />
            <InfoRow label="Email" value={med.caregiverEmail} />
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={med.isActive
              ? [styles.actionBtn, styles.pauseBtn]
              : [styles.actionBtn, styles.resumeBtn]}
            onPress={handleToggleActive}
          >
            <Text style={styles.pauseBtnText}>
              {med.isActive ? '⏸ Pause Medication' : '▶️ Resume Medication'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑 Remove Medication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  hero: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 8 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 36 },
  heroName: { fontSize: 24, fontWeight: '800' },
  heroGeneric: { fontSize: 14, color: Colors.textSecondary },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  card: { gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoLabel: { width: 120, fontSize: 13, color: Colors.textSecondary },
  infoValue: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  scheduleText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  mealNote: { fontSize: 13, color: Colors.textSecondary },
  instr: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  refillWarningCard: { borderColor: Colors.warning, borderWidth: 1.5 },
  refillRow: { flexDirection: 'row', gap: 24 },
  refillItem: { alignItems: 'center' },
  refillNumber: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  refillLabel: { fontSize: 12, color: Colors.textSecondary },
  refillWarning: { fontSize: 13, color: Colors.warning, fontWeight: '600' },
  adherenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adherenceRate: { fontSize: 14, fontWeight: '700' },
  adherenceStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  adherenceStat: { alignItems: 'center', gap: 2 },
  adherenceStatNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  adherenceStatLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  drugInfoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevron: { fontSize: 12, color: Colors.textTertiary },
  drugInfoBody: { gap: 10 },
  drugDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  drugSection: { gap: 4 },
  drugSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  drugItem: { fontSize: 13, color: Colors.textSecondary },
  seriousSection: { backgroundColor: Colors.errorLight, borderRadius: 8, padding: 10 },
  seriousTitle: { fontSize: 13, fontWeight: '700', color: Colors.error },
  seriousItem: { fontSize: 13, color: Colors.error },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  pauseBtn: { backgroundColor: Colors.warningLight },
  resumeBtn: { backgroundColor: Colors.secondaryLight },
  pauseBtnText: { color: Colors.warning, fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: Colors.errorLight },
  deleteBtnText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: Colors.textSecondary },
  backLink: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
});
