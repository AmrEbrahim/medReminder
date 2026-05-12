import { format, parseISO, isToday, isTomorrow, isYesterday, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatDate(iso: string): string {
  const date = parseISO(iso);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

export function formatTimeFromHHMM(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function todayISO(): string {
  return new Date().toISOString();
}

export function startOfTodayISO(): string {
  return startOfDay(new Date()).toISOString();
}

export function endOfTodayISO(): string {
  return endOfDay(new Date()).toISOString();
}

export function minutesFromNow(iso: string): number {
  return differenceInMinutes(parseISO(iso), new Date());
}

export function nowHHMM(): string {
  return format(new Date(), 'HH:mm');
}

export function buildScheduledTime(dateISO: string, timeHHMM: string): string {
  const [hours, minutes] = timeHHMM.split(':').map(Number);
  const date = parseISO(dateISO);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
