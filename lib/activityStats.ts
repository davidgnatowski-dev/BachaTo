import { toLocalIsoDate } from "./format";

export interface ActivityStatsInput {
  school: string;
  instructor?: string | null;
  level?: string | null;
  danceStyle?: string | null;
  durationMinutes?: number | null;
  dateIso: string;
}

export interface ActivityStats {
  totalClasses: number;
  totalHours: number;
  favoriteInstructor?: string;
  favoriteSchool?: string;
  favoriteLevel?: string;
  favoriteDanceStyle?: string;
  thisMonthCount: number;
  thisWeekCount: number;
}

function mostCommon(values: (string | null | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Auto-marked ("added from your plan") attendances are provisional — they
 * wait for the user to confirm they actually showed up. Until then they must
 * not move any number: stats, hours, streaks or (future) points. Every
 * stat/streak call site runs its input through this first.
 */
export function confirmedActivityOnly<T extends { autoMarked?: boolean | null }>(entries: T[]): T[] {
  return entries.filter((entry) => !entry.autoMarked);
}

/** Pure — works the same over localStorage ActivityEntry[] (anonymous) and server UserActivityRow[] (logged in). */
export function computeActivityStats(entries: ActivityStatsInput[], now: Date = new Date()): ActivityStats {
  const todayIso = toLocalIsoDate(now);
  const monthPrefix = todayIso.slice(0, 7);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoIso = toLocalIsoDate(weekAgo);

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);

  return {
    totalClasses: entries.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    favoriteInstructor: mostCommon(entries.map((e) => e.instructor)),
    favoriteSchool: mostCommon(entries.map((e) => e.school)),
    favoriteLevel: mostCommon(entries.map((e) => e.level)),
    favoriteDanceStyle: mostCommon(entries.map((e) => e.danceStyle)),
    thisMonthCount: entries.filter((e) => e.dateIso.startsWith(monthPrefix)).length,
    thisWeekCount: entries.filter((e) => e.dateIso >= weekAgoIso && e.dateIso <= todayIso).length,
  };
}
