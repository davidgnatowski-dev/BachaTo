import type { ClassRow } from "./types";
import { toLocalIsoDate } from "./format";

export const DAY_LABELS = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

/**
 * Co-taught classes store both names in one field ("Ola, Darek" or "Ola &
 * Darek" depending on the school). Split into individual instructor names so
 * picking one person surfaces both her solo classes and every class she
 * co-teaches, regardless of who the partner is.
 */
export function splitInstructors(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\s*,\s*|\s+&\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 1 = Monday ... 7 = Sunday, derived from dayOfWeek or specificDate. */
export function displayDayOfWeek(row: ClassRow): number | undefined {
  if (row.dayOfWeek) return row.dayOfWeek;
  if (row.specificDate) {
    const jsDay = new Date(`${row.specificDate}T00:00:00`).getDay(); // 0=Sun..6=Sat
    return ((jsDay + 6) % 7) + 1;
  }
  return undefined;
}

function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

/** True for rows that a school kept in its feed only to communicate a cancellation. */
export function isCancelledClass(row: Pick<ClassRow, "title" | "location" | "description">): boolean {
  const text = `${row.title} ${row.location ?? ""} ${row.description ?? ""}`
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
  return /\b(odwolane|odwolany|odwolana|cancelled|canceled)\b/.test(text);
}

/**
 * Some school feeds put a one-off date only in the title ("26.09" or
 * "17-18.10") while marking the row as weekly. Recover the first day so the
 * class is not repeated on every matching weekday.
 */
export function specificDateFromTitle(title: string, referenceDate: Date): string | undefined {
  const match = title.match(/\b([0-3]?\d)(?:\s*[-–]\s*[0-3]?\d)?[./]([01]?\d)(?:[./](20\d{2}))?\b/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : referenceDate.getFullYear();
  let candidate = new Date(year, month - 1, day, 12);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return undefined;

  if (!match[3]) {
    const reference = new Date(referenceDate);
    reference.setHours(12, 0, 0, 0);
    const daysInPast = (reference.getTime() - candidate.getTime()) / 86400000;
    if (daysInPast > 180) {
      year += 1;
      candidate = new Date(year, month - 1, day, 12);
    }
  }
  return toLocalIsoDate(candidate);
}

/**
 * Calendar dates covered by the schedule's quick filters. Unlike a weekday-only
 * filter this keeps one-off rows attached to their real date.
 */
export function scheduleDatesForFilter(dayFilter: string, today: Date): string[] {
  const base = addLocalDays(today, 0);
  if (dayFilter === "today") return [toLocalIsoDate(base)];
  if (dayFilter === "tomorrow") return [toLocalIsoDate(addLocalDays(base, 1))];
  if (dayFilter === "week") return Array.from({ length: 7 }, (_, index) => toLocalIsoDate(addLocalDays(base, index)));
  if (dayFilter === "weekend") {
    if (base.getDay() === 0) return [toLocalIsoDate(base)];
    const saturdayOffset = (6 - base.getDay() + 7) % 7;
    const saturday = addLocalDays(base, saturdayOffset);
    return [toLocalIsoDate(saturday), toLocalIsoDate(addLocalDays(saturday, 1))];
  }

  const weekday = Number(dayFilter);
  if (Number.isInteger(weekday) && weekday >= 1 && weekday <= 7) {
    const currentWeekday = ((base.getDay() + 6) % 7) + 1;
    return [toLocalIsoDate(addLocalDays(base, (weekday - currentWeekday + 7) % 7))];
  }
  return Array.from({ length: 7 }, (_, index) => toLocalIsoDate(addLocalDays(base, index)));
}

export interface ScheduleOccurrence {
  row: ClassRow;
  dateIso: string;
}

/** Expand recurring rows over the requested dates while keeping dated rows exact. */
export function scheduleOccurrencesForDates(rows: ClassRow[], dates: string[]): ScheduleOccurrence[] {
  const dateSet = new Set(dates);
  const occurrences: ScheduleOccurrence[] = [];
  for (const row of rows) {
    if (row.specificDate) {
      if (dateSet.has(row.specificDate)) occurrences.push({ row, dateIso: row.specificDate });
      continue;
    }
    if (!row.dayOfWeek) continue;
    for (const dateIso of dates) {
      const jsDay = new Date(`${dateIso}T12:00:00`).getDay();
      const weekday = ((jsDay + 6) % 7) + 1;
      if (weekday === row.dayOfWeek) occurrences.push({ row, dateIso });
    }
  }
  return occurrences.sort((a, b) =>
    a.dateIso.localeCompare(b.dateIso) || (a.row.startTime ?? "").localeCompare(b.row.startTime ?? "")
  );
}

export interface UpcomingClass {
  row: ClassRow;
  when: Date;
  label: string;
}

/**
 * Soonest-first upcoming occurrences, computed from `now`: dated classes use
 * their specific date directly, recurring weekly classes are projected
 * forward to the next matching weekday (this week if it hasn't started yet,
 * otherwise next week).
 */
export function nextOccurrences(rows: ClassRow[], now: Date, count: number): UpcomingClass[] {
  const todayIso = toLocalIsoDate(now);
  const todayWeekday = ((now.getDay() + 6) % 7) + 1; // 1=Mon..7=Sun

  const withDates: UpcomingClass[] = [];
  for (const row of rows) {
    const time = row.startTime ?? "00:00";
    let dateIso: string;
    if (row.specificDate) {
      dateIso = row.specificDate;
      if (dateIso === todayIso && time < now.toTimeString().slice(0, 5)) continue; // already passed today
    } else if (row.dayOfWeek) {
      let daysAhead = (row.dayOfWeek - todayWeekday + 7) % 7;
      if (daysAhead === 0 && time < now.toTimeString().slice(0, 5)) daysAhead = 7;
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      dateIso = toLocalIsoDate(d);
    } else {
      continue;
    }

    const when = new Date(`${dateIso}T${time}:00`);
    const diffDays = Math.round((when.getTime() - new Date(`${todayIso}T00:00:00`).getTime()) / 86400000);
    const label = diffDays === 0 ? "Dzisiaj" : diffDays === 1 ? "Jutro" : DAY_LABELS[((when.getDay() + 6) % 7)];

    withDates.push({ row, when, label });
  }

  withDates.sort((a, b) => a.when.getTime() - b.when.getTime());
  return withDates.slice(0, count);
}

export function groupByDay(rows: ClassRow[]): Map<number, ClassRow[]> {
  const groups = new Map<number, ClassRow[]>();
  for (const row of rows) {
    const day = displayDayOfWeek(row);
    if (!day) continue;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(row);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }
  return groups;
}

/** Polish plural forms for "zajęcie" (class/session): 1 / 2-4 / 5+. */
export function pluralizeClasses(n: number): string {
  if (n === 1) return "zajęcie";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "zajęcia";
  return "zajęć";
}

/** "55 min" / "1 godz." / "1 godz. 25 min" from start/end times, or undefined if either is missing. */
export function formatDuration(startTime?: string, endTime?: string): string | undefined {
  if (!startTime || !endTime) return undefined;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) return undefined;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} godz.`;
  return `${hours} godz. ${minutes} min`;
}

export function formatDatePl(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** A stable color identity for each Warsaw school, reused wherever its name is shown. */
export function schoolTextClass(school?: string | null): string {
  if (school === "Salsa Libre") return "text-red-400";
  if (school === "Warsaw Salsa Club") return "text-emerald-400";
  if (school === "Abra Studio") return "text-amber-300";
  if (school === "Oye!") return "text-sky-400";
  if (school === "Viva Cuba") return "text-fuchsia-400";
  return "text-violet";
}

export function schoolStyle(school?: string | null) {
  return { bg: "bg-zinc-900", text: schoolTextClass(school) };
}

/**
 * Full studio addresses, verified directly against each school's own
 * contact page. The scraped `location` field is often just a short label
 * (or, for Warsaw Salsa Club, sometimes a status like "ZAJĘCIA ODWOŁANE"
 * instead of a room name), so it's matched loosely and falls back to the
 * school's primary address rather than trusting it verbatim.
 */
export function schoolAddress(school: string, location?: string): string | undefined {
  const loc = (location ?? "").toLowerCase();
  if (school === "Abra Studio") {
    if (loc.includes("długa")) return "ul. Długa 44/50 (wejście od ul. Bohaterów Getta), 00-241 Warszawa";
    return "al. Jana Pawła II 11, 00-823 Warszawa";
  }
  if (school === "Salsa Libre") {
    if (loc.includes("chłodna") || loc.includes("wszechświata")) {
      return "ul. Chłodna 29 (wejście od ul. Krochmalnej), Warszawa";
    }
    return "ul. Żelazna 59, 00-848 Warszawa";
  }
  if (school === "Warsaw Salsa Club") return "ul. Nowowiejska 37B, 02-010 Warszawa";
  if (school === "Oye!") return "ul. Kłopotowskiego 5, Warszawa";
  if (school === "Viva Cuba") return "ul. Marszałkowska 115 (wejście od ul. Przechodniej), Warszawa";
  return undefined;
}
