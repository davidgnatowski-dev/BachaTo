import type { ClassRow } from "@/lib/types";
import type { UserPreferences } from "@/lib/db";
import { recommendClasses, hasAnyPreference } from "@/lib/recommendations";
import { LEVEL_BUCKET_LABELS, type LevelBucket } from "@/lib/level";
import { FORMAT_LABELS } from "@/lib/format";
import { DAY_LABELS } from "@/lib/schedule";
import { UpcomingClassList } from "@/components/UpcomingClassList";

const PREVIEW_COUNT = 5;

/** Hidden entirely for a user with no saved preferences, or if none of their preferred classes exist in the current schedule. */
export function RecommendedClasses({ schedule, prefs }: { schedule: ClassRow[]; prefs: UserPreferences }) {
  if (!hasAnyPreference(prefs)) return null;

  const { items, matchedDays, matchedTime } = recommendClasses(schedule, prefs, new Date(), PREVIEW_COUNT);
  if (items.length === 0) return null;

  const reasonParts: string[] = [];
  if (prefs.levels.length > 0) {
    reasonParts.push(prefs.levels.map((l) => LEVEL_BUCKET_LABELS[l as LevelBucket]).join(", "));
  }
  if (prefs.formats.length > 0) {
    reasonParts.push(prefs.formats.map((f) => FORMAT_LABELS[f as keyof typeof FORMAT_LABELS]).join(", "));
  }
  if (matchedDays && prefs.days.length > 0) {
    reasonParts.push(prefs.days.map((d) => DAY_LABELS[d - 1]).join(", "));
  }
  if (matchedTime && prefs.timeFrom) reasonParts.push(`od ${Number(prefs.timeFrom.slice(0, 2))}:00`);

  // Only worth calling out when the user actually asked for a day/time and we couldn't honor it — not when they never set one.
  const droppedDays = !matchedDays && prefs.days.length > 0;
  const droppedTime = !matchedTime && Boolean(prefs.timeFrom);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
      <div>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Polecane dla Ciebie</h2>
        {reasonParts.length > 0 && <p className="mt-0.5 text-xs text-muted">Na podstawie: {reasonParts.join(" · ")}</p>}
        {(droppedDays || droppedTime) && (
          <p className="mt-0.5 text-xs text-muted">
            Brak zajęć spełniających {droppedDays && droppedTime ? "wybrane dni i godzinę" : droppedDays ? "wybrane dni" : "wybraną godzinę"} —
            pokazujemy najbliższe pasujące do reszty Twoich preferencji.
          </p>
        )}
      </div>
      <UpcomingClassList items={items} allRows={schedule} />
    </section>
  );
}
