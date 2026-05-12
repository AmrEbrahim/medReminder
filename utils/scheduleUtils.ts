import { addHours, addDays, parseISO, format, startOfDay, isSameDay } from 'date-fns';
import type { Medication, Schedule } from '../types';

export function getScheduledTimesToday(medication: Medication): string[] {
  const { schedule } = medication;
  const today = new Date();
  const dayOfWeek = today.getDay();

  if (schedule.type === 'as-needed') return [];

  if (schedule.type === 'specific-days' && schedule.daysOfWeek) {
    if (!schedule.daysOfWeek.includes(dayOfWeek)) return [];
  }

  if (schedule.type === 'every-x-hours' && schedule.intervalHours) {
    const times: string[] = [];
    const start = startOfDay(today);
    let current = new Date(start);
    while (isSameDay(current, today)) {
      times.push(format(current, 'HH:mm'));
      current = addHours(current, schedule.intervalHours);
    }
    return times;
  }

  return schedule.times || [];
}

export function buildScheduledDatetime(date: Date, timeHHMM: string): Date {
  const [hours, minutes] = timeHHMM.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function describeSchedule(schedule: Schedule): string {
  switch (schedule.type) {
    case 'daily':
      if (schedule.times.length === 1) {
        return `Once daily at ${formatHHMM(schedule.times[0])}`;
      }
      return `${schedule.times.length}x daily (${schedule.times.map(formatHHMM).join(', ')})`;
    case 'every-x-hours':
      return `Every ${schedule.intervalHours} hours`;
    case 'specific-days': {
      const days = (schedule.daysOfWeek || []).map(d => DAY_ABBREV[d]).join(', ');
      return `${days} at ${schedule.times.map(formatHHMM).join(', ')}`;
    }
    case 'as-needed':
      return 'As needed';
    default:
      return 'Custom schedule';
  }
}

function formatHHMM(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function daysUntilRefill(medication: Medication): number | null {
  if (!medication.pillCount || !medication.pillsPerDose) return null;
  const scheduledToday = getScheduledTimesToday(medication).length;
  if (scheduledToday === 0) return null;
  const dailyUsage = scheduledToday * (medication.pillsPerDose || 1);
  return Math.floor(medication.pillCount / dailyUsage);
}
