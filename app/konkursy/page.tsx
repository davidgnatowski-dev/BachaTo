import { getUpcomingEvents, getLastRunPerSchool } from "@/lib/db";
import { EventsExplorer } from "@/components/EventsExplorer";
import { RefreshButton } from "@/components/RefreshButton";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";
import { pluralizeEvents, EVENT_SOURCES } from "@/lib/events";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function KonkursyPage() {
  const events = getUpcomingEvents().filter((e) => e.category === "competition");
  const runs = getLastRunPerSchool();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Konkursy bachatowe</h1>
          <p className="mt-1 text-sm text-muted">Zawody i konkursy taneczne w całej Polsce.</p>
        </div>
        <RefreshButton />
      </header>

      <TabNav active="konkursy" />

      <section className="flex flex-wrap gap-3 text-xs text-muted">
        {EVENT_SOURCES.every((s) => !runs[s]) && (
          <p>Baza jest pusta — kliknij &quot;Odśwież teraz&quot; albo uruchom `npm run scrape`.</p>
        )}
        {EVENT_SOURCES.map((source) => {
          const run = runs[source];
          if (!run) return null;
          return (
            <span
              key={source}
              className={`rounded-full border px-3 py-1 ${
                run.ok ? "border-line bg-zinc-900" : "border-rose-900/60 bg-rose-950/40 text-rose-300"
              }`}
            >
              {source}: {run.ok ? `${run.foundCount} ${pluralizeEvents(run.foundCount)}` : "błąd"} · ostatnia
              aktualizacja {formatRelative(run.finishedAt)}
            </span>
          );
        })}
      </section>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak konkursów do wyświetlenia. Uruchom scraping, żeby je zobaczyć.
        </p>
      ) : (
        <EventsExplorer rows={events} lockedCategory="competition" />
      )}
    </div>
  );
}
