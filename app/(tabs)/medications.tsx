import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useMedicationStore } from '../../store/medicationStore';
import { MedicationCard } from '../../components/MedicationCard';
import { checkInteractions } from '../../constants/drugInteractions';
import { InteractionAlert } from '../../components/InteractionAlert';

export default function MedicationsScreen() {
  const { medications, loading } = useMedicationStore();
  const [search, setSearch] = useState('');

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);

  const filtered = activeMeds.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(search.toLowerCase())
  );

  const interactions = checkInteractions(activeMeds.map(m => m.name));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Medications</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/medications/scan')}>
              <Text style={styles.scanBtnText}>📷 Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/medications/add')}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Interaction Alerts */}
        {interactions.length > 0 && (
          <View style={styles.section}>
            <InteractionAlert interactions={interactions} />
          </View>
        )}

        {/* Active Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active ({filtered.length})
          </Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>
                {search ? 'No medications match your search.' : 'No active medications. Tap + Add to get started!'}
              </Text>
            </View>
          ) : (
            filtered.map(med => <MedicationCard key={med.id} medication={med} />)
          )}
        </View>

        {/* Inactive / Completed */}
        {inactiveMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed / Stopped ({inactiveMeds.length})</Text>
            {inactiveMeds.map(med => (
              <View key={med.id} style={styles.inactiveWrap}>
                <MedicationCard medication={med} compact />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, gap: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  scanBtn: { backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  scanBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', maxWidth: 240 },
  inactiveWrap: { opacity: 0.5 },
});
