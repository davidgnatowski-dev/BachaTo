import type { ClassFormat } from "./types";
import type { ClassRow } from "./types";
import { classifyLevel } from "./level";
import { displayDayOfWeek } from "./schedule";

export interface UserPreferences {
  /** Kept for backwards compatibility with preferences saved before multi-level selection was added. */
  level: string | null;
  levels: string[];
  formats: ClassFormat[];
  styles: string[];
  days: number[];
  timeFrom: string | null;
}

export const EMPTY_PREFERENCES: UserPreferences = {
  level: null,
  levels: [],
  formats: [],
  styles: [],
  days: [],
  timeFrom: null,
};

export function parseUserPreferences(raw: string | null | undefined): UserPreferences {
  if (!raw) return EMPTY_PREFERENCES;
  try {
    const value = JSON.parse(raw) as Partial<UserPreferences>;
    const level = typeof value.level === "string" && value.level.trim() ? value.level.trim() : null;
    const levels = Array.isArray(value.levels)
      ? value.levels.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : level
        ? [classifyLevel(level)]
        : [];
    return {
      level,
      levels,
      formats: Array.isArray(value.formats)
        ? value.formats.filter((item): item is ClassFormat => ["partner", "solo", "unknown"].includes(item))
        : [],
      styles: Array.isArray(value.styles) ? value.styles.filter((item): item is string => typeof item === "string") : [],
      days: Array.isArray(value.days)
        ? value.days.map(Number).filter((item) => Number.isInteger(item) && item >= 1 && item <= 7)
        : [],
      timeFrom: typeof value.timeFrom === "string" && /^\d{2}:\d{2}$/.test(value.timeFrom) ? value.timeFrom : null,
    };
  } catch {
    return EMPTY_PREFERENCES;
  }
}

export function hasUserPreferences(preferences: UserPreferences) {
  return Boolean(
    preferences.levels.length ||
      preferences.level ||
      preferences.formats.length ||
      preferences.styles.length ||
      preferences.days.length ||
      preferences.timeFrom
  );
}

function normalized(value?: string | null) {
  return (value ?? "").toLocaleLowerCase("pl").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Strict matching used by the schedule's “moje preferencje” filter. */
export function matchesUserPreferences(row: ClassRow, preferences: UserPreferences) {
  const levels = preferences.levels.length
    ? preferences.levels
    : preferences.level
      ? [classifyLevel(preferences.level)]
      : [];
  if (levels.length > 0 && !levels.includes(classifyLevel(row.level))) return false;
  if (preferences.formats.length > 0 && !preferences.formats.includes(row.format)) return false;
  if (preferences.days.length > 0) {
    const day = displayDayOfWeek(row);
    if (day === undefined || !preferences.days.includes(day)) return false;
  }
  if (preferences.timeFrom && (!row.startTime || row.startTime < preferences.timeFrom)) return false;
  if (preferences.styles.length > 0) {
    const haystack = normalized(`${row.title} ${row.danceStyle}`);
    if (!preferences.styles.some((style) => haystack.includes(normalized(style)))) return false;
  }
  return true;
}
