import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import type { Medication } from '../types';
import * as storage from '../services/storageService';
import { scheduleMedicationNotifications, cancelMedicationNotifications } from '../services/notificationService';

interface MedicationStore {
  medications: Medication[];
  loading: boolean;
  hydrated: boolean;
  load: () => Promise<void>;
  add: (med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Medication>;
  update: (id: string, updates: Partial<Medication>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  decrementPillCount: (id: string, by: number) => Promise<void>;
  getById: (id: string) => Medication | undefined;
}

export const useMedicationStore = create<MedicationStore>((set, get) => ({
  medications: [],
  loading: false,
  hydrated: false,

  load: async () => {
    set({ loading: true });
    try {
      const medications = await storage.loadMedications();
      set({ medications, hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  add: async (med) => {
    const now = new Date().toISOString();
    const newMed: Medication = {
      ...med,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    await storage.saveMedication(newMed);
    set(s => ({ medications: [newMed, ...s.medications] }));
    await scheduleMedicationNotifications(newMed);
    return newMed;
  },

  update: async (id, updates) => {
    const { medications } = get();
    const existing = medications.find(m => m.id === id);
    if (!existing) return;
    const updated: Medication = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await storage.saveMedication(updated);
    set(s => ({ medications: s.medications.map(m => m.id === id ? updated : m) }));
    await cancelMedicationNotifications(id);
    if (updated.isActive) await scheduleMedicationNotifications(updated);
  },

  remove: async (id) => {
    await storage.deleteMedication(id);
    await cancelMedicationNotifications(id);
    set(s => ({ medications: s.medications.filter(m => m.id !== id) }));
  },

  decrementPillCount: async (id, by) => {
    const { medications } = get();
    const med = medications.find(m => m.id === id);
    if (!med || med.pillCount === undefined) return;
    const newCount = Math.max(0, med.pillCount - by);
    await get().update(id, { pillCount: newCount });
  },

  getById: (id) => get().medications.find(m => m.id === id),
}));
