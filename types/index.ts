export type ScheduleType = 'daily' | 'every-x-hours' | 'specific-days' | 'as-needed';
export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'snoozed' | 'missed';
export type MedicationForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch' | 'cream' | 'drops' | 'inhaler' | 'other';
export type DosageUnit = 'mg' | 'ml' | 'mcg' | 'g' | 'IU' | 'units' | 'puff' | 'drop';

export interface Schedule {
  type: ScheduleType;
  times: string[]; // HH:mm
  intervalHours?: number;
  daysOfWeek?: number[]; // 0=Sun … 6=Sat
  withMeals?: boolean;
  mealInstruction?: 'before' | 'with' | 'after';
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  dosage: string;
  unit: DosageUnit;
  form: MedicationForm;
  schedule: Schedule;
  startDate: string; // ISO
  endDate?: string; // ISO
  pillCount?: number;
  pillsPerDose?: number;
  refillReminderAt?: number; // pills remaining threshold
  instructions?: string;
  color?: string;
  prescribedBy?: string;
  pharmacy?: string;
  rxNumber?: string;
  sideEffects?: string[];
  interactions?: string[];
  caregiverAlerts: boolean;
  caregiverName?: string;
  caregiverPhone?: string;
  caregiverEmail?: string;
  escalatingAlerts: boolean;
  escalateAfterMinutes?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  color_hex?: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // ISO
  takenTime?: string; // ISO
  status: DoseStatus;
  notes?: string;
  snoozedUntil?: string; // ISO
  notificationId?: string;
  createdAt: string;
}

export interface AdherenceReport {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  totalDoses: number;
  takenDoses: number;
  skippedDoses: number;
  missedDoses: number;
  rate: number; // 0–100
  streak: number;
  byMedication: Record<string, { taken: number; total: number; rate: number }>;
  dailyRates: { date: string; rate: number }[];
}

export interface DrugInfo {
  name: string;
  genericName?: string;
  category?: string;
  description?: string;
  commonSideEffects?: string[];
  seriousSideEffects?: string[];
  interactions?: string[];
  overdoseInfo?: string;
  storageInfo?: string;
  pregnancy?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface UserSettings {
  name?: string;
  email?: string;
  avatarUri?: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
  escalateAfterMinutes: number;
  defaultCaregiverEmail?: string;
  theme: 'light' | 'dark' | 'system';
  firstLaunch: boolean;
}

export interface ScannedPrescription {
  medicationName?: string;
  genericName?: string;
  dosage?: string;
  unit?: string;
  instructions?: string;
  prescribedBy?: string;
  pharmacy?: string;
  rxNumber?: string;
  refills?: string;
  quantity?: string;
  confidence?: number;
  rawText?: string;
}
