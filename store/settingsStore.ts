import { create } from 'zustand';
import type { UserSettings } from '../types';
import { loadSettings, saveSetting } from '../services/storageService';

interface SettingsStore {
  settings: UserSettings;
  hydrated: boolean;
  load: () => Promise<void>;
  update: (updates: Partial<UserSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeMinutes: 10,
  escalateAfterMinutes: 30,
  theme: 'light',
  firstLaunch: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  load: async () => {
    const settings = await loadSettings();
    set({ settings, hydrated: true });
  },

  update: async (updates) => {
    const updated = { ...get().settings, ...updates };
    set({ settings: updated });
    await saveSetting('user_settings', JSON.stringify(updated));
  },
}));
