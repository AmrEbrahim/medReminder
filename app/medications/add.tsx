import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useMedicationStore } from '../../store/medicationStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { checkInteractions } from '../../constants/drugInteractions';
import { checkInteractionsOpenFDA, mergeInteractions } from '../../services/openFDAService';
import { InteractionAlert } from '../../components/InteractionAlert';
import { DAY_NAMES } from '../../utils/dateUtils';
import type { MedicationForm, DosageUnit, ScheduleType } from '../../types';

const FORMS: MedicationForm[] = ['tablet', 'capsule', 'liquid', 'injection', 'patch', 'cream', 'drops', 'inhaler', 'other'];
const UNITS: DosageUnit[] = ['mg', 'ml', 'mcg', 'g', 'IU', 'units', 'puff', 'drop'];
const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-x-hours', label: 'Every X Hours' },
  { value: 'specific-days', label: 'Specific Days' },
  { value: 'as-needed', label: 'As Needed' },
];
const MEAL_OPTIONS = [
  { value: 'before', label: 'Before meals' },
  { value: 'with', label: 'With meals' },
  { value: 'after', label: 'After meals' },
];
const ACCENT_COLORS = Colors.medicationColors;

function Chip({ label, active, onPress }: { readonly label: string; readonly active: boolean; readonly onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AddMedicationScreen() {
  const params = useLocalSearchParams<{
    prefill_name?: string; prefill_dosage?: string; prefill_unit?: string;
    prefill_instructions?: string; prefill_prescribedBy?: string;
    prefill_pharmacy?: string; prefill_rxNumber?: string;
  }>();

  const { add, medications } = useMedicationStore();
  const [saving, setSaving] = useState(false);

  // Basic info
  const [name, setName] = useState(params.prefill_name ?? '');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState(params.prefill_dosage ?? '');
  const [unit, setUnit] = useState<DosageUnit>((params.prefill_unit as DosageUnit) ?? 'mg');
  const [form, setForm] = useState<MedicationForm>('tablet');
  const [instructions, setInstructions] = useState(params.prefill_instructions ?? '');
  const [prescribedBy, setPrescribedBy] = useState(params.prefill_prescribedBy ?? '');
  const [pharmacy, setPharmacy] = useState(params.prefill_pharmacy ?? '');
  const [rxNumber, setRxNumber] = useState(params.prefill_rxNumber ?? '');
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0]);

  // Schedule
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [times, setTimes] = useState<{ id: string; value: string }[]>([{ id: '1', value: '08:00' }]);
  const [intervalHours, setIntervalHours] = useState('8');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [withMeals, setWithMeals] = useState(false);
  const [mealInstruction, setMealInstruction] = useState<'before' | 'with' | 'after'>('with');

  // Refill
  const [pillCount, setPillCount] = useState('');
  const [pillsPerDose, setPillsPerDose] = useState('1');
  const [refillReminderAt, setRefillReminderAt] = useState('7');

  // Caregiver
  const [escalatingAlerts, setEscalatingAlerts] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Drug interaction checks
  const [fdaInteractions, setFdaInteractions] = useState<import('../../types').DrugInteraction[]>([]);
  const [fdaLoading, setFdaLoading] = useState(false);
  const fdaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const localInteractions = checkInteractions([
    ...medications.filter(m => m.isActive).map(m => m.name),
    name,
  ]);
  const interactions = mergeInteractions(localInteractions, fdaInteractions);

  useEffect(() => {
    const medNames = [
      ...medications.filter(m => m.isActive).map(m => m.name),
      name,
    ].filter(n => n.length > 2);

    clearTimeout(fdaTimer.current);

    if (medNames.length < 2) {
      setFdaInteractions([]);
      return;
    }

    setFdaLoading(true);
    fdaTimer.current = setTimeout(() => {
      checkInteractionsOpenFDA(medNames)
        .then(r => { setFdaInteractions(r); setFdaLoading(false); })
        .catch(() => setFdaLoading(false));
    }, 800);

    return () => clearTimeout(fdaTimer.current);
  }, [name, medications]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Medication name is required.';
    if (!dosage.trim()) e.dosage = 'Dosage is required.';
    if (scheduleType !== 'as-needed' && scheduleType !== 'every-x-hours' && times.length === 0)
      e.times = 'At least one time is required.';
    if (scheduleType === 'every-x-hours' && (!intervalHours || Number.isNaN(Number(intervalHours))))
      e.intervalHours = 'Enter a valid interval.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await add({
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        dosage: dosage.trim(),
        unit,
        form,
        instructions: instructions.trim() || undefined,
        prescribedBy: prescribedBy.trim() || undefined,
        pharmacy: pharmacy.trim() || undefined,
        rxNumber: rxNumber.trim() || undefined,
        color_hex: accentColor,
        schedule: {
          type: scheduleType,
          times: scheduleType === 'every-x-hours' || scheduleType === 'as-needed' ? [] : times.map(t => t.value),
          intervalHours: scheduleType === 'every-x-hours' ? Number(intervalHours) : undefined,
          daysOfWeek: scheduleType === 'specific-days' ? selectedDays : undefined,
          withMeals,
          mealInstruction: withMeals ? mealInstruction : undefined,
        },
        startDate: new Date().toISOString(),
        pillCount: pillCount ? Number(pillCount) : undefined,
        pillsPerDose: pillsPerDose ? Number(pillsPerDose) : 1,
        refillReminderAt: refillReminderAt ? Number(refillReminderAt) : 7,
        caregiverAlerts: false,
        escalatingAlerts,
        escalateAfterMinutes: 30,
        isActive: true,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  }

  function addTime() {
    setTimes(prev => [...prev, { id: String(Date.now()), value: '12:00' }]);
  }

  function updateTime(index: number, value: string) {
    setTimes(prev => prev.map((t, i) => (i === index ? { ...t, value } : t)));
  }

  function removeTime(index: number) {
    setTimes(prev => prev.filter((_, i) => i !== index));
  }

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Interaction alert if new med conflicts */}
        {name.length > 2 && (
          <>
            {fdaLoading && (
              <View style={styles.fdaCheckingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.fdaCheckingText}>Checking FDA database...</Text>
              </View>
            )}
            {interactions.length > 0 && <InteractionAlert interactions={interactions} />}
          </>
        )}

        {/* Color */}
        <Text style={styles.sectionLabel}>ACCENT COLOR</Text>
        <Card style={styles.card}>
          <View style={styles.colorRow}>
            {ACCENT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, accentColor === c && styles.colorDotActive]}
                onPress={() => setAccentColor(c)}
              />
            ))}
          </View>
        </Card>

        {/* Basic Info */}
        <Text style={styles.sectionLabel}>MEDICATION INFO</Text>
        <Card style={styles.card}>
          <Input label="Medication Name *" value={name} onChangeText={setName}
            placeholder="e.g. Metformin" error={errors.name} />
          <View style={styles.row}>
            <Input label="Dosage *" value={dosage} onChangeText={setDosage}
              placeholder="500" keyboardType="numeric" error={errors.dosage}
              containerStyle={{ flex: 1 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.inputLabel}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {UNITS.map(u => (
                    <Chip key={u} label={u} active={unit === u} onPress={() => setUnit(u)} />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.inputLabel}>Form</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {FORMS.map(f => (
                  <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={form === f} onPress={() => setForm(f)} />
                ))}
              </View>
            </ScrollView>
          </View>
          <Input label="Instructions" value={instructions} onChangeText={setInstructions}
            placeholder="e.g. Take with food" multiline />
          <Input label="Prescribed By" value={prescribedBy} onChangeText={setPrescribedBy}
            placeholder="Doctor's name" />
        </Card>

        {/* Schedule */}
        <Text style={styles.sectionLabel}>SCHEDULE</Text>
        <Card style={styles.card}>
          <Text style={styles.inputLabel}>Schedule Type</Text>
          <View style={styles.chipRow}>
            {SCHEDULE_TYPES.map(s => (
              <Chip key={s.value} label={s.label} active={scheduleType === s.value} onPress={() => setScheduleType(s.value)} />
            ))}
          </View>

          {(scheduleType === 'daily' || scheduleType === 'specific-days') && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={styles.inputLabel}>Times</Text>
              {times.map((t, i) => (
                <View key={t.id} style={styles.timeRow}>
                  <Input
                    containerStyle={{ flex: 1 }}
                    value={t.value}
                    onChangeText={v => updateTime(i, v)}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                  />
                  {times.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeTime(i)}>
                      <Ionicons name="close" size={14} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}
              <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                <Text style={styles.addTimeBtnText}>+ Add Time</Text>
              </TouchableOpacity>
            </View>
          )}

          {scheduleType === 'every-x-hours' && (
            <Input
              label="Repeat every (hours)"
              value={intervalHours}
              onChangeText={setIntervalHours}
              keyboardType="numeric"
              placeholder="8"
              error={errors.intervalHours}
            />
          )}

          {scheduleType === 'specific-days' && (
            <View style={{ gap: 6, marginTop: 8 }}>
              <Text style={styles.inputLabel}>Days of Week</Text>
              <View style={styles.chipRow}>
                {DAY_NAMES.map((day, i) => (
                  <Chip key={day} label={day} active={selectedDays.includes(i)} onPress={() => toggleDay(i)} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>With meals</Text>
            <Switch value={withMeals} onValueChange={setWithMeals} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
          </View>

          {withMeals && (
            <View style={styles.chipRow}>
              {MEAL_OPTIONS.map(m => (
                <Chip key={m.value} label={m.label} active={mealInstruction === m.value}
                  onPress={() => setMealInstruction(m.value as any)} />
              ))}
            </View>
          )}
        </Card>

        {/* Refill */}
        <Text style={styles.sectionLabel}>REFILL MANAGEMENT</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Input label="Pill Count" value={pillCount} onChangeText={setPillCount}
              placeholder="e.g. 30" keyboardType="numeric" containerStyle={{ flex: 1 }} />
            <Input label="Pills Per Dose" value={pillsPerDose} onChangeText={setPillsPerDose}
              placeholder="1" keyboardType="numeric" containerStyle={{ flex: 1 }} />
          </View>
          <Input label="Remind when below" value={refillReminderAt} onChangeText={setRefillReminderAt}
            placeholder="7" keyboardType="numeric"
            rightElement={<Text style={styles.inputSuffix}>pills</Text>} />
        </Card>

        {/* Caregiver Alerts */}
        <Text style={styles.sectionLabel}>CAREGIVER ALERTS</Text>
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Escalating alerts</Text>
              <Text style={styles.switchDesc}>Re-alert if dose is not acknowledged after 30 min</Text>
            </View>
            <Switch value={escalatingAlerts} onValueChange={setEscalatingAlerts}
              trackColor={{ true: Colors.primary }} thumbColor="#fff" />
          </View>
        </Card>

        <Button label="Save Medication" onPress={handleSave} loading={saving} size="lg" style={styles.saveBtn} disabled={interactions.length > 0} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginTop: 8 },
  card: { gap: 12 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary, transform: [{ scale: 1.15 }] },
  row: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  addTimeBtn: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addTimeBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  switchDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  inputSuffix: { fontSize: 14, color: Colors.textSecondary, marginRight: 4 },
  saveBtn: { marginTop: 16 },
  errorText: { fontSize: 12, color: Colors.error },
  fdaCheckingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fdaCheckingText: { fontSize: 12, color: Colors.textSecondary },
});
