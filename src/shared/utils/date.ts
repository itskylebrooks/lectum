import type { DateFormatMode } from '@/shared/types';
import { format, parseISO } from 'date-fns';

export function formatDisplayDate(value: string | Date, mode: DateFormatMode) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, mode === 'DMY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy');
}

export function formatMonthLabel(value: string) {
  return format(parseISO(`${value}-01`), 'MMM yyyy');
}

export function formatYearLabel(value: string) {
  return format(parseISO(`${value}-01-01`), 'yyyy');
}

export function formatLongDate(value: string) {
  return format(parseISO(value), 'dd MMM yyyy');
}

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function currentYear() {
  return new Date().getFullYear();
}
