import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { DoseLog, DoseStatus } from '../types';
import * as storage from '../services/storageService';

interface DoseStore {
  logs: DoseLog[];
  loading: boolean;
  hydrated: boolean;
  load: (fromISO?: string, toISO?: string) => Promise<void>;
  logDose: (medicationId: string, scheduledTime: string, status: DoseStatus, notes?: string) => Promise<DoseLog>;
  updateDoseStatus: (id: string, status: DoseStatus, takenTime?: string) => Promise<void>;
  snooze: (id: string, minutes: number) => Promise<void>;
  getTodayLogs: () => DoseLog[];
  getLogsForMedication: (medicationId: string) => DoseLog[];
  getLogBySchedule: (medicationId: string, scheduledTime: string) => DoseLog | undefined;
}

export const useDoseStore = create<DoseStore>((set, get) => ({
  logs: [],
  loading: false,
  hydrated: false,

  load: async (fromISO, toISO) => {
    set({ loading: true });
    try {
      const from = fromISO ?? subDays(new Date(), 30).toISOString();
      const to = toISO ?? endOfDay(new Date()).toISOString();
      const logs = await storage.loadDoseLogs(undefined, from, to);
      set({ logs, hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  logDose: async (medicationId, scheduledTime, status, notes) => {
    const now = new Date().toISOString();
    const existing = get().getLogBySchedule(medicationId, scheduledTime);
    if (existing) {
      await get().updateDoseStatus(existing.id, status, status === 'taken' ? now : undefined);
      return { ...existing, status };
    }

    const log: DoseLog = {
      id: randomUUID(),
      medicationId,
      scheduledTime,
      takenTime: status === 'taken' ? now : undefined,
      status,
      notes,
      createdAt: now,
    };
    await storage.saveDoseLog(log);
    set(s => ({ logs: [log, ...s.logs] }));
    return log;
  },

  updateDoseStatus: async (id, status, takenTime) => {
    const { logs } = get();
    const log = logs.find(l => l.id === id);
    if (!log) return;
    const updated: DoseLog = { ...log, status, takenTime };
    await storage.saveDoseLog(updated);
    set(s => ({ logs: s.logs.map(l => l.id === id ? updated : l) }));
  },

  snooze: async (id, minutes) => {
    const { logs } = get();
    const log = logs.find(l => l.id === id);
    if (!log) return;
    const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    const updated: DoseLog = { ...log, status: 'snoozed', snoozedUntil };
    await storage.saveDoseLog(updated);
    set(s => ({ logs: s.logs.map(l => l.id === id ? updated : l) }));
  },

  getTodayLogs: () => {
    const start = startOfDay(new Date()).getTime();
    const end = endOfDay(new Date()).getTime();
    return get().logs.filter(l => {
      const t = new Date(l.scheduledTime).getTime();
      return t >= start && t <= end;
    });
  },

  getLogsForMedication: (medicationId) =>
    get().logs.filter(l => l.medicationId === medicationId),

  getLogBySchedule: (medicationId, scheduledTime) =>
    get().logs.find(l => l.medicationId === medicationId && l.scheduledTime === scheduledTime),
}));
