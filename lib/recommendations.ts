import type { ClassRow } from "./types";
import type { UserPreferences } from "./db";
import { classifyLevel } from "./level";
import { displayDayOfWeek, nextOccurrences, type UpcomingClass } from "./schedule";

/** True as soon as any dimension is set — used to decide whether the recommendations section is worth showing at all. */
export function hasAnyPreference(prefs: UserPreferences): boolean {
  return prefs.levels.length > 0 || prefs.formats.length > 0 || prefs.days.length > 0 || Boolean(prefs.timeFrom);
}

function matches(row: ClassRow, prefs: UserPreferences, opts: { ignoreDays: boolean; ignoreTime: boolean }): boolean {
  // A recommendation without a known start time isn't actionable — exclude it regardless of which tier this is.
  if (!row.startTime) return false;
  if (prefs.levels.length > 0 && !prefs.levels.includes(classifyLevel(row.level))) return false;
  if (prefs.formats.length > 0 && !prefs.formats.includes(row.format)) return false;
  if (!opts.ignoreDays && prefs.days.length > 0) {
    const day = displayDayOfWeek(row);
    if (day === undefined || !prefs.days.includes(day)) return false;
  }
  if (!opts.ignoreTime && prefs.timeFrom) {
    if (!row.startTime || row.startTime < prefs.timeFrom) return false;
  }
  return true;
}

export interface RecommendationResult {
  items: UpcomingClass[];
  /** False when the chosen days had to be dropped to find any match — the UI should say so rather than implying every shown class falls on a chosen day. */
  matchedDays: boolean;
  /** False when the start-time floor had to be dropped to find any match. */
  matchedTime: boolean;
}

/**
 * Filters by every set preference at once; if that's too strict to find
 * anything, progressively relaxes (first the start-time floor, then the
 * chosen days) before giving up. Never invents matches — an empty result
 * means the section simply doesn't render — and always reports which
 * constraints actually held, so the caller can be honest about it instead
 * of silently showing classes that don't match what the user picked.
 */
export function recommendClasses(rows: ClassRow[], prefs: UserPreferences, now: Date, count: number): RecommendationResult {
  if (!hasAnyPreference(prefs)) return { items: [], matchedDays: false, matchedTime: false };

  const tiers = [
    { ignoreDays: false, ignoreTime: false },
    { ignoreDays: false, ignoreTime: true },
    { ignoreDays: true, ignoreTime: true },
  ];

  for (const tier of tiers) {
    const pool = rows.filter((r) => matches(r, prefs, tier));
    if (pool.length > 0) {
      return { items: nextOccurrences(pool, now, count), matchedDays: !tier.ignoreDays, matchedTime: !tier.ignoreTime };
    }
  }
  return { items: [], matchedDays: false, matchedTime: false };
}
