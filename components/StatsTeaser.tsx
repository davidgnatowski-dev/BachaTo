import Link from "next/link";
import { pluralizeSchools } from "@/lib/events";

/**
 * Live catalog totals (real, not an example) as the pitch, plus what an
 * account adds on top.
 */
export function StatsTeaser({
  classCount,
  schoolCount,
  instructorCount,
  eventCount,
}: {
  classCount: number;
  schoolCount: number;
  instructorCount: number;
  eventCount: number;
}) {
  const tiles = [
    { value: classCount, label: "zajęć" },
    { value: schoolCount, label: pluralizeSchools(schoolCount) },
    { value: instructorCount, label: "instruktorów" },
    { value: eventCount, label: "wydarzeń" },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-5 sm:p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          W BachaTo <span className="text-accent">teraz</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cała warszawska bachata w jednym grafiku. Załóż konto, żeby budować plan i śledzić swoje postępy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line bg-black/30 p-3 text-center">
            <p className="font-heading text-lg font-bold text-violet">{tile.value}</p>
            <p className="mt-0.5 text-xs text-muted">{tile.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/rejestracja"
        className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Załóż konto i zacznij śledzić aktywność
      </Link>
    </section>
  );
}
