import { parseISO, startOfDay, eachDayOfInterval, format } from 'date-fns';
import type { DoseLog, AdherenceReport } from '../types';

export function calculateAdherence(logs: DoseLog[], startISO: string, endISO: string): AdherenceReport {
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  const inRange = logs.filter(l => {
    const t = parseISO(l.scheduledTime);
    return t >= start && t <= end;
  });

  const total = inRange.length;
  const taken = inRange.filter(l => l.status === 'taken').length;
  const skipped = inRange.filter(l => l.status === 'skipped').length;
  const missed = inRange.filter(l => l.status === 'missed').length;
  const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

  const days = eachDayOfInterval({ start, end });
  const dailyRates = days.map(day => {
    const dayLogs = inRange.filter(l => {
      return startOfDay(parseISO(l.scheduledTime)).getTime() === startOfDay(day).getTime();
    });
    const dayTotal = dayLogs.length;
    const dayTaken = dayLogs.filter(l => l.status === 'taken').length;
    return {
      date: format(day, 'yyyy-MM-dd'),
      rate: dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : -1, // -1 = no doses
    };
  });

  const byMedication: Record<string, { taken: number; total: number; rate: number }> = {};
  for (const log of inRange) {
    if (!byMedication[log.medicationId]) {
      byMedication[log.medicationId] = { taken: 0, total: 0, rate: 0 };
    }
    byMedication[log.medicationId].total++;
    if (log.status === 'taken') byMedication[log.medicationId].taken++;
  }
  for (const key of Object.keys(byMedication)) {
    const m = byMedication[key];
    m.rate = m.total > 0 ? Math.round((m.taken / m.total) * 100) : 0;
  }

  const streak = calculateStreak(logs);

  return {
    period: 'week',
    startDate: startISO,
    endDate: endISO,
    totalDoses: total,
    takenDoses: taken,
    skippedDoses: skipped,
    missedDoses: missed,
    rate,
    streak,
    byMedication,
    dailyRates,
  };
}

export function calculateStreak(logs: DoseLog[]): number {
  const sortedLogs = [...logs].sort(
    (a, b) => parseISO(b.scheduledTime).getTime() - parseISO(a.scheduledTime).getTime()
  );

  let streak = 0;
  let checkDate = startOfDay(new Date());

  while (true) {
    const dayLogs = sortedLogs.filter(
      l => startOfDay(parseISO(l.scheduledTime)).getTime() === checkDate.getTime()
    );
    if (dayLogs.length === 0) break;
    const allTaken = dayLogs.every(l => l.status === 'taken');
    if (!allTaken) break;
    streak++;
    checkDate = new Date(checkDate.getTime() - 86400000);
  }

  return streak;
}

export function getAdherenceLabel(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: 'Excellent', color: '#10B981' };
  if (rate >= 75) return { label: 'Good', color: '#84CC16' };
  if (rate >= 50) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Improvement', color: '#EF4444' };
}
