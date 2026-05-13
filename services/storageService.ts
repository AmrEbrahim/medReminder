import * as SQLite from 'expo-sqlite';
import type { Medication, DoseLog, UserSettings } from '../types';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('medreminder.db');

  await db.execAsync(`PRAGMA journal_mode = WAL`);
  await db.execAsync(`PRAGMA busy_timeout = 5000`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id TEXT PRIMARY KEY,
      medicationId TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_dose_logs_med ON dose_logs(medicationId);
    CREATE INDEX IF NOT EXISTS idx_dose_logs_time ON dose_logs(scheduledTime);
  `);
}

// --- Medications ---

export async function saveMedication(med: Medication): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO medications (id, data, createdAt, updatedAt, isActive)
     VALUES (?, ?, ?, ?, ?)`,
    [med.id, JSON.stringify(med), med.createdAt, med.updatedAt, med.isActive ? 1 : 0]
  );
}

export async function loadMedications(): Promise<Medication[]> {
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM medications WHERE isActive = 1 ORDER BY createdAt DESC`
  );
  return rows.map(r => JSON.parse(r.data) as Medication);
}

export async function loadAllMedications(): Promise<Medication[]> {
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM medications ORDER BY createdAt DESC`
  );
  return rows.map(r => JSON.parse(r.data) as Medication);
}

export async function deleteMedication(id: string): Promise<void> {
  await db.runAsync(`UPDATE medications SET isActive = 0 WHERE id = ?`, [id]);
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM medications WHERE id = ?`, [id]
  );
  return row ? (JSON.parse(row.data) as Medication) : null;
}

// --- Dose Logs ---

export async function saveDoseLog(log: DoseLog): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO dose_logs (id, medicationId, scheduledTime, data, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [log.id, log.medicationId, log.scheduledTime, JSON.stringify(log), log.createdAt]
  );
}

export async function loadDoseLogs(
  medicationId?: string,
  fromISO?: string,
  toISO?: string
): Promise<DoseLog[]> {
  let query = `SELECT data FROM dose_logs WHERE 1=1`;
  const params: string[] = [];

  if (medicationId) {
    query += ` AND medicationId = ?`;
    params.push(medicationId);
  }
  if (fromISO) {
    query += ` AND scheduledTime >= ?`;
    params.push(fromISO);
  }
  if (toISO) {
    query += ` AND scheduledTime <= ?`;
    params.push(toISO);
  }

  query += ` ORDER BY scheduledTime DESC`;
  const rows = await db.getAllAsync<{ data: string }>(query, params);
  return rows.map(r => JSON.parse(r.data) as DoseLog);
}

export async function getDoseLogById(id: string): Promise<DoseLog | null> {
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM dose_logs WHERE id = ?`, [id]
  );
  return row ? (JSON.parse(row.data) as DoseLog) : null;
}

// --- Settings ---

export async function saveSetting(key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`, [key]
  );
  return row?.value ?? null;
}

export async function loadSettings(): Promise<UserSettings> {
  const raw = await getSetting('user_settings');
  if (raw) return JSON.parse(raw) as UserSettings;
  return {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    snoozeMinutes: 10,
    escalateAfterMinutes: 30,
    theme: 'light',
    firstLaunch: true,
  };
}
