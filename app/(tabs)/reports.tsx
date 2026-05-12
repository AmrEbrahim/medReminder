import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { Colors } from '../../constants/colors';
import { useDoseStore } from '../../store/doseStore';
import { useMedicationStore } from '../../store/medicationStore';
import { calculateAdherence, getAdherenceLabel } from '../../utils/adherenceUtils';
import { AdherenceChart } from '../../components/AdherenceChart';
import { StreakBadge } from '../../components/StreakBadge';
import { Card } from '../../components/ui/Card';

type Period = 'week' | 'month';

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const { logs } = useDoseStore();
  const { medications } = useMedicationStore();

  const { startISO, endISO } = useMemo(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), period === 'week' ? 6 : 29));
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [period]);

  const report = useMemo(
    () => calculateAdherence(logs, startISO, endISO),
    [logs, startISO, endISO]
  );

  const { label: adherenceLabel, color: adherenceColor } = getAdherenceLabel(report.rate);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Adherence Reports</Text>

        {/* Period Toggle */}
        <View style={styles.toggle}>
          {(['week', 'month'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                {p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall Rate */}
        <Card style={styles.rateCard}>
          <View style={styles.rateRow}>
            <View style={[styles.rateCircle, { borderColor: adherenceColor }]}>
              <Text style={[styles.rateNumber, { color: adherenceColor }]}>{report.rate}%</Text>
              <Text style={styles.rateLabel}>adherence</Text>
            </View>
            <View style={styles.rateDetails}>
              <View style={styles.rateDetail}>
                <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
                <Text style={styles.rateDetailText}>{report.takenDoses} doses taken</Text>
              </View>
              <View style={styles.rateDetail}>
                <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.rateDetailText}>{report.skippedDoses} doses skipped</Text>
              </View>
              <View style={styles.rateDetail}>
                <View style={[styles.dot, { backgroundColor: Colors.error }]} />
                <Text style={styles.rateDetailText}>{report.missedDoses} doses missed</Text>
              </View>
              <View style={styles.rateDetail}>
                <View style={[styles.dot, { backgroundColor: Colors.border }]} />
                <Text style={styles.rateDetailText}>{report.totalDoses} total scheduled</Text>
              </View>
            </View>
          </View>
          <View style={[styles.adherenceBanner, { backgroundColor: adherenceColor + '20' }]}>
            <Text style={[styles.adherenceBannerText, { color: adherenceColor }]}>
              {adherenceLabel}
            </Text>
            <Text style={styles.adherencePeriod}>
              {format(new Date(startISO), 'MMM d')} – {format(new Date(endISO), 'MMM d, yyyy')}
            </Text>
          </View>
        </Card>

        {/* Streak */}
        {report.streak > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge streak={report.streak} />
            <Text style={styles.streakCaption}>consecutive days with 100% adherence</Text>
          </View>
        )}

        {/* Chart */}
        <Card style={styles.chartCard}>
          <AdherenceChart
            data={report.dailyRates}
            label={`Daily adherence — ${period === 'week' ? 'last 7 days' : 'last 30 days'}`}
          />
        </Card>

        {/* Per-medication breakdown */}
        {Object.keys(report.byMedication).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Medication</Text>
            {Object.entries(report.byMedication).map(([medId, data]) => {
              const med = medications.find(m => m.id === medId);
              if (!med) return null;
              const { label, color } = getAdherenceLabel(data.rate);
              return (
                <Card key={medId} style={styles.medReport} variant="flat">
                  <View style={styles.medReportHeader}>
                    <View style={[styles.medColorDot, { backgroundColor: med.color_hex || Colors.primary }]} />
                    <Text style={styles.medReportName}>{med.name}</Text>
                    <Text style={[styles.medReportRate, { color }]}>{data.rate}%</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${data.rate}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.medReportSub}>
                    {data.taken}/{data.total} doses taken · {label}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}

        {report.totalDoses === 0 && (
          <Card style={styles.emptyCard} variant="flat">
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>Start logging doses to see your adherence reports.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surfaceVariant, borderRadius: 12, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: Colors.surface, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },
  rateCard: { gap: 12 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rateCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  rateNumber: { fontSize: 24, fontWeight: '800' },
  rateLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
  rateDetails: { flex: 1, gap: 6 },
  rateDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rateDetailText: { fontSize: 13, color: Colors.textSecondary },
  adherenceBanner: { borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adherenceBannerText: { fontWeight: '700', fontSize: 14 },
  adherencePeriod: { fontSize: 12, color: Colors.textTertiary },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakCaption: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  chartCard: {},
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  medReport: { gap: 6 },
  medReportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medColorDot: { width: 10, height: 10, borderRadius: 5 },
  medReportName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  medReportRate: { fontSize: 16, fontWeight: '800' },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  medReportSub: { fontSize: 12, color: Colors.textSecondary },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', maxWidth: 240 },
});
