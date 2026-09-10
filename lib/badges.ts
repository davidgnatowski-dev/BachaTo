import { toLocalIsoDate } from "./format";

export interface BadgeInput {
  /** Confirmed class/practice/workshop attendances (auto-marked already filtered out). */
  activityDates: string[]; // ISO "YYYY-MM-DD"
  totalHours: number;
  schoolCount: number;
  /** Confirmed event attendances (festivals, socials, competitions) + manual "party" entries. */
  eventCount: number;
  /** Consecutive-week streak (from currentStreak). */
  streak: number;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  /** 0..1 — how close to earning it, for a subtle progress ring on locked badges. */
  progress: number;
}

const DEFAULT_WEEKLY_GOAL = 2;
export { DEFAULT_WEEKLY_GOAL };

function isoWeekKey(iso: string): string {
  // Monday-anchored week key, good enough for "distinct active weeks".
  const d = new Date(`${iso}T12:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toLocalIsoDate(d);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Consecutive-week streak ending this week or last week. Pure. */
export function weekStreak(dates: string[], now: Date = new Date()): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(dates.map(isoWeekKey));
  const cursor = new Date(now);
  const day = (cursor.getDay() + 6) % 7;
  cursor.setDate(cursor.getDate() - day);
  cursor.setHours(12, 0, 0, 0);
  if (!weeks.has(toLocalIsoDate(cursor))) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (weeks.has(toLocalIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

/** Pure — same result on the server (UserActivityRow[]) and client (ActivityEntry[]). */
export function computeBadges(input: BadgeInput): Badge[] {
  const activeWeeks = new Set(input.activityDates.map(isoWeekKey)).size;
  const totalActivities = input.activityDates.length;

  return [
    {
      id: "first-step",
      label: "Pierwszy krok",
      description: "Pierwsza potwierdzona aktywność.",
      icon: "👟",
      earned: totalActivities >= 1,
      progress: clamp01(totalActivities / 1),
    },
    {
      id: "first-party",
      label: "Pierwsza impreza",
      description: "Pierwsze potwierdzone wydarzenie lub impreza.",
      icon: "🎉",
      earned: input.eventCount >= 1,
      progress: clamp01(input.eventCount / 1),
    },
    {
      id: "ten-hours",
      label: "10 godzin",
      description: "10 godzin potwierdzonego tańca.",
      icon: "⏱️",
      earned: input.totalHours >= 10,
      progress: clamp01(input.totalHours / 10),
    },
    {
      id: "four-weeks",
      label: "Cztery aktywne tygodnie",
      description: "Aktywność w czterech różnych tygodniach.",
      icon: "🗓️",
      earned: activeWeeks >= 4,
      progress: clamp01(activeWeeks / 4),
    },
    {
      id: "streak-4",
      label: "Passa 4 tygodni",
      description: "Cztery tygodnie z rzędu z aktywnością.",
      icon: "🔥",
      earned: input.streak >= 4,
      progress: clamp01(input.streak / 4),
    },
    {
      id: "multi-school",
      label: "Wieloszkolność",
      description: "Zajęcia w trzech różnych szkołach.",
      icon: "🏫",
      earned: input.schoolCount >= 3,
      progress: clamp01(input.schoolCount / 3),
    },
    {
      id: "twenty-activities",
      label: "20 aktywności",
      description: "20 potwierdzonych aktywności w dzienniku.",
      icon: "💪",
      earned: totalActivities >= 20,
      progress: clamp01(totalActivities / 20),
    },
  ];
}
