import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
} from "./calendar.constants";

export type CalendarSlot = {
  minutes: number;
  label: string;
};

export function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateAtMinutes(day: Date, minutes: number): Date {
  const next = new Date(day);
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return next;
}

export function buildWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index): Date =>
    addDays(weekStart, index),
  );
}

export function buildSlots(): CalendarSlot[] {
  const count = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  return Array.from({ length: count }, (_, index): CalendarSlot => {
    const minutes = DAY_START_HOUR * 60 + index * SLOT_MINUTES;
    return { minutes, label: minutesToLabel(minutes) };
  });
}

export function minutesToLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function timeRange(start: string, end: string): string {
  return `${formatTime(start)}-${formatTime(end)}`;
}

export function weekday(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

export function monthDay(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatWeekRange(start: Date, end: Date): string {
  const lastVisibleDay = addDays(end, -1);
  return `${monthDay(start)} - ${monthDay(lastVisibleDay)}`;
}
