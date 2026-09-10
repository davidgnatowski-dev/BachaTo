"use client";

import Link from "next/link";
import { useActivity } from "@/lib/activity";
import { useFavorites } from "@/lib/favorites";
import { computeActivityStats, confirmedActivityOnly } from "@/lib/activityStats";
import { classifyLevel, levelStyle, LEVEL_BUCKET_ICONS } from "@/lib/level";
import { ActivityList } from "@/components/ActivityList";

/** Logged-out equivalent of the server-rendered AccountStats — same layout, sourced from this browser's localStorage. */
export function LocalStatsSummary() {
  const { entries } = useActivity();
  const { likedClassIds, likedEventIds, plannedClassIds, plannedEventIds } = useFavorites();
  const stats = computeActivityStats(confirmedActivityOnly(entries));
  const levelBucket = stats.favoriteLevel ? classifyLevel(stats.favoriteLevel) : undefined;
  const levelColors = levelBucket ? levelStyle(levelBucket) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Godziny tańca", value: stats.totalHours },
          { label: "Odbyte zajęcia", value: stats.totalClasses },
          { label: "Ten miesiąc", value: stats.thisMonthCount },
          { label: "Ten tydzień", value: stats.thisWeekCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-zinc-900/60 p-4 text-center">
            <p className="font-heading text-2xl font-bold text-accent">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {(stats.favoriteInstructor || stats.favoriteSchool || stats.favoriteLevel) && (
        <div className="flex flex-wrap gap-2">
          {stats.favoriteInstructor && (
            <Link
              href={`/instruktorzy/${encodeURIComponent(stats.favoriteInstructor)}`}
              className="rounded-full border border-violet/40 bg-violet/10 px-3 py-1.5 text-xs font-semibold text-violet hover:bg-violet/20"
            >
              Ulubiony instruktor: {stats.favoriteInstructor}
            </Link>
          )}
          {stats.favoriteSchool && (
            <Link
              href={`/szkoly/${encodeURIComponent(stats.favoriteSchool)}`}
              className="rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
            >
              Ulubiona szkoła: {stats.favoriteSchool}
            </Link>
          )}
          {stats.favoriteLevel && levelColors && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${levelColors.bg} ${levelColors.text} ${levelColors.ring}`}
            >
              <span aria-hidden="true">{levelBucket ? LEVEL_BUCKET_ICONS[levelBucket] : ""}</span>
              Najczęstszy poziom: {stats.favoriteLevel}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Zajęcia w planie", value: plannedClassIds.size },
          { label: "Wydarzenia w planie", value: plannedEventIds.size },
          { label: "Polubione zajęcia", value: likedClassIds.size },
          { label: "Polubione wydarzenia", value: likedEventIds.size },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-zinc-900/60 p-4 text-center">
            <p className="font-heading text-xl font-bold text-zinc-100">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Ostatnia aktywność</h2>
        <ActivityList />
      </section>

      <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
        BachaTo Wrapped — Twoje roczne podsumowanie do udostępnienia na Instagram Stories — jest w planach. Wróć tu,
        gdy będzie gotowe.
      </p>
    </div>
  );
}
