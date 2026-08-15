import type { ClassRow } from "./types";
import { schoolAddress } from "./schedule";
import { toLocalIsoDate } from "./format";

/** 1 = Monday ... 7 = Sunday, matching displayDayOfWeek(). */
function weekdayOf(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

/**
 * Next upcoming start moment for a class — today if it hasn't started yet,
 * otherwise the next matching weekday. Used for "add to calendar" (you're
 * scheduling ahead). Past one-off (specificDate) classes have nothing left
 * to add, so this returns undefined for those.
 */
export function nextClassOccurrence(row: ClassRow, now: Date): Date | undefined {
  const time = row.startTime ?? "00:00";
  if (row.specificDate) {
    const when = new Date(`${row.specificDate}T${time}:00`);
    return when.getTime() >= now.getTime() ? when : undefined;
  }
  if (!row.dayOfWeek) return undefined;
  let daysAhead = (row.dayOfWeek - weekdayOf(now) + 7) % 7;
  if (daysAhead === 0 && time < now.toTimeString().slice(0, 5)) daysAhead = 7;
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  return new Date(`${toLocalIsoDate(d)}T${time}:00`);
}

/**
 * This calendar week's (Mon-Sun) occurrence of a recurring class — may be
 * before or after `now` within the week. Used for attendance gating: unlike
 * nextClassOccurrence (which always projects forward, skipping to next week
 * once today's time has passed), this must stay pinned to the current
 * week's instance so a class later this week reports as not-yet-started
 * instead of silently resolving to last week's already-finished one.
 */
export function recentClassOccurrence(row: ClassRow, now: Date): Date | undefined {
  const time = row.startTime ?? "00:00";
  if (row.specificDate) return new Date(`${row.specificDate}T${time}:00`);
  if (!row.dayOfWeek) return undefined;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - (weekdayOf(now) - 1));
  const occurrence = new Date(monday);
  occurrence.setDate(occurrence.getDate() + (row.dayOfWeek - 1));
  return new Date(`${toLocalIsoDate(occurrence)}T${time}:00`);
}

function classEnd(row: ClassRow, start: Date): Date {
  if (row.endTime) {
    const [h, m] = row.endTime.split(":").map(Number);
    const end = new Date(start);
    end.setHours(h, m, 0, 0);
    if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
    return end;
  }
  return new Date(start.getTime() + 60 * 60 * 1000);
}

function classLocation(row: ClassRow): string {
  return [row.location, schoolAddress(row.school, row.location)].filter(Boolean).join(", ");
}

function toUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** A Google Calendar "quick add" link — no login/OAuth on our side, opens Calendar's own add-event screen pre-filled. */
export function googleCalendarUrlForClass(row: ClassRow, start: Date): string {
  const end = classEnd(row, start);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: row.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    details: [row.description, row.sourceUrl].filter(Boolean).join("\n\n"),
    location: classLocation(row),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook.com's equivalent "compose event" deep link. */
export function outlookCalendarUrlForClass(row: ClassRow, start: Date): string {
  const end = classEnd(row, start);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: row.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: classLocation(row),
    body: [row.description, row.sourceUrl].filter(Boolean).join("\n\n"),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** A standalone .ics file — opens directly in Apple Calendar, Outlook desktop, or any calendar app. */
export function icsForClass(row: ClassRow, start: Date): string {
  const end = classEnd(row, start);
  const location = classLocation(row);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BachaTo//PL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${row.school}-${row.id}-${toLocalIsoDate(start)}@bachato.pl`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(row.title)}`,
    row.description ? `DESCRIPTION:${escapeIcs(row.description)}` : undefined,
    location ? `LOCATION:${escapeIcs(location)}` : undefined,
    `URL:${row.sourceUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
