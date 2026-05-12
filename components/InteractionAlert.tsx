import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import type { DrugInteraction } from '../types';

interface Props {
  interactions: DrugInteraction[];
}

const SEVERITY_CONFIG = {
  mild:     { bg: Colors.warningLight, text: Colors.warning,  icon: '⚠️',  label: 'Mild' },
  moderate: { bg: '#FFF7ED',          text: Colors.orange,   icon: '🔶',  label: 'Moderate' },
  severe:   { bg: Colors.errorLight,  text: Colors.error,    icon: '🚨',  label: 'Severe' },
} as const;

export function InteractionAlert({ interactions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (interactions.length === 0) return null;

  const hasSevere = interactions.some(i => i.severity === 'severe');

  return (
    <View style={[styles.container, { borderColor: hasSevere ? Colors.error : Colors.warning }]}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{hasSevere ? '🚨' : '⚠️'}</Text>
        <Text style={[styles.headerText, { color: hasSevere ? Colors.error : Colors.warning }]}>
          {interactions.length} Drug Interaction{interactions.length > 1 ? 's' : ''} Detected
        </Text>
      </View>
      {interactions.map((interaction, i) => {
        const cfg = SEVERITY_CONFIG[interaction.severity];
        const key = `${interaction.drug1}-${interaction.drug2}`;
        const isExpanded = expanded === key;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.interaction, { backgroundColor: cfg.bg }]}
            onPress={() => setExpanded(isExpanded ? null : key)}
            activeOpacity={0.85}
          >
            <View style={styles.interactionHeader}>
              <Text style={styles.interactionIcon}>{cfg.icon}</Text>
              <Text style={[styles.severity, { color: cfg.text }]}>{cfg.label}</Text>
              <Text style={styles.drugNames}>
                {interaction.drug1} + {interaction.drug2}
              </Text>
              <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
            {isExpanded && (
              <Text style={styles.description}>{interaction.description}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIcon: { fontSize: 16 },
  headerText: { fontWeight: '700', fontSize: 14 },
  interaction: { borderRadius: 8, padding: 10, gap: 6 },
  interactionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interactionIcon: { fontSize: 14 },
  severity: { fontWeight: '700', fontSize: 12, width: 60 },
  drugNames: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500', textTransform: 'capitalize' },
  chevron: { fontSize: 10, color: Colors.textTertiary },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
