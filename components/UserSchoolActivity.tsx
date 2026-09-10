import Link from "next/link";
import type { ActivityStats } from "@/lib/activityStats";

/**
 * Purely presentational — the page computes `stats` (via computeActivityStats
 * over this user's account activity, filtered to this school) and passes the
 * finished numbers in. Nods toward the future "BachaTo Wrapped" styling
 * (accent/violet gradient tile) without owning any data-fetching itself.
 */
export function UserSchoolActivity({ stats }: { stats: ActivityStats }) {
  if (stats.totalClasses === 0) return null;

  const tiles: { value: string; label: string }[] = [
    { value: String(stats.thisMonthCount), label: `${stats.thisMonthCount === 1 ? "zajęcie" : "zajęć"} w tym miesiącu` },
    { value: `${stats.totalHours} h`, label: "tańca" },
  ];
  if (stats.favoriteDanceStyle) tiles.push({ value: stats.favoriteDanceStyle, label: "najczęstszy styl" });
  if (stats.favoriteInstructor) tiles.push({ value: stats.favoriteInstructor, label: "najczęściej wybierani instruktorzy" });

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-gradient-to-br from-accent/10 via-transparent to-violet/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Twoja aktywność tutaj</h2>
        <Link href="/podsumowanie" className="shrink-0 text-xs font-semibold text-accent hover:text-accent-peach">
          Pełne podsumowanie →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line bg-background/40 p-3">
            <p className="truncate font-heading text-lg font-bold text-foreground">{tile.value}</p>
            <p className="mt-0.5 text-xs text-muted">{tile.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
