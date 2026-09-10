import Link from "next/link";
import { getUpcomingEvents } from "@/lib/db";
import { EventsExplorer } from "@/components/EventsExplorer";
import { DataFreshnessBanner } from "@/components/DataFreshnessBanner";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";
import { EVENT_SOURCES } from "@/lib/events";

export const dynamic = "force-dynamic";

export default function EventyPage() {
  const events = getUpcomingEvents();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Wydarzenia bachatowe — cała Polska</h1>
          <p className="mt-1 text-sm text-muted">
            Praktyka taneczna, festiwale, wyjazdy i zawody w jednym kalendarzu. Przełącz kategorię, filtruj po mieście i dacie.
          </p>
        </div>
        <Link href="/dla-organizatorow" className="shrink-0 rounded-full border border-violet/50 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet/10">
          Dodaj wydarzenie
        </Link>
      </header>

      <TabNav active="eventy" />

      <DataFreshnessBanner sources={[...EVENT_SOURCES]} label="Kalendarz wydarzeń" />

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak danych do wyświetlenia.
        </p>
      ) : (
        <EventsExplorer rows={events} />
      )}
    </div>
  );
}
