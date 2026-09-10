import { getLastRunPerSchool } from "@/lib/db";
import { scrapeFreshness } from "@/lib/format";

/** Past this age the banner turns into a visible "may be out of date" warning. */
const STALE_AFTER_HOURS = 72;

/**
 * A visible line telling the visitor how fresh the scraped data is. Reads
 * the last finished scrape per source and reports the OLDEST of them (the
 * schedule is only as current as its stalest school). Turns amber once the
 * data crosses `STALE_AFTER_HOURS`.
 */
export function DataFreshnessBanner({
  sources,
  label = "Dane z grafików szkół",
}: {
  sources: string[];
  label?: string;
}) {
  const runs = getLastRunPerSchool();
  const finishedAts = sources
    .map((source) => runs[source]?.finishedAt)
    .filter((value): value is string => Boolean(value));
  if (finishedAts.length === 0) return null;

  const oldest = finishedAts.reduce((a, b) => (a < b ? a : b));
  const { relative, stale } = scrapeFreshness(oldest, STALE_AFTER_HOURS);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
        stale
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : "border-line bg-zinc-900/50 text-muted"
      }`}
      role={stale ? "status" : undefined}
    >
      <span aria-hidden="true">{stale ? "⚠️" : "🟢"}</span>
      <span>
        {stale
          ? `Dane mogą być nieaktualne — ostatni import ${relative}. Godziny i miejsca sprawdź u źródła.`
          : `${label} — ostatnia aktualizacja ${relative}.`}
      </span>
    </div>
  );
}
