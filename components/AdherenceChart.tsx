import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface DayData {
  date: string;
  rate: number; // -1 = no doses, 0-100 = percentage
}

interface Props {
  data: DayData[];
  label?: string;
}

function rateColor(rate: number): string {
  if (rate < 0) return Colors.border;
  if (rate >= 90) return Colors.secondary;
  if (rate >= 75) return '#84CC16';
  if (rate >= 50) return Colors.warning;
  return Colors.error;
}

const DAY_ABBREV = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AdherenceChart({ data, label }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.bars}>
        {data.map((d, i) => {
          const date = new Date(d.date);
          const dayInitial = DAY_ABBREV[date.getDay()];
          const height = d.rate < 0 ? 4 : Math.max(4, (d.rate / 100) * 56);
          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { height, backgroundColor: rateColor(d.rate) }]} />
              </View>
              <Text style={styles.dayLabel}>{dayInitial}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.secondary }]} /><Text style={styles.legendText}>≥90%</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.warning }]} /><Text style={styles.legendText}>50–89%</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.error }]} /><Text style={styles.legendText}>{'<50%'}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 72,
    paddingBottom: 16,
  },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barContainer: { height: 56, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  dayLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary },
});
