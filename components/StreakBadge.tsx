import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  streak: number;
  compact?: boolean;
}

export function StreakBadge({ streak, compact }: Props) {
  const label = streak === 1 ? 'day streak' : 'day streak';
  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.fire}>🔥</Text>
        <Text style={styles.compactText}>{streak}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.fire}>🔥</Text>
      <View>
        <Text style={styles.number}>{streak}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fire: { fontSize: 28 },
  number: { fontSize: 22, fontWeight: '800', color: Colors.warning },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactText: { fontSize: 13, fontWeight: '700', color: Colors.warning },
});
