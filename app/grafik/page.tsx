import { getCurrentSchedule, getLastRunPerSchool } from "@/lib/db";
import { ScheduleExplorer } from "@/components/ScheduleExplorer";
import { RefreshButton } from "@/components/RefreshButton";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";
import { pluralizeClasses } from "@/lib/schedule";
import { formatRelative } from "@/lib/format";
import { EVENT_SOURCES } from "@/lib/events";

export const dynamic = "force-dynamic";

const EVENT_SOURCE_SET = new Set<string>(EVENT_SOURCES);

export default function GrafikPage() {
  const schedule = getCurrentSchedule();
  const lastRuns = getLastRunPerSchool();
  const schools = Object.keys(lastRuns).filter((s) => !EVENT_SOURCE_SET.has(s));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Grafik bachaty — Warszawa</h1>
          <p className="mt-1 text-sm text-muted">Cotygodniowy grafik zajęć bachaty, aktualizowany automatycznie.</p>
        </div>
        <RefreshButton />
      </header>

      <TabNav active="zajecia" />

      <section className="flex flex-wrap gap-3 text-xs text-muted">
        {schools.length === 0 && <p>Baza jest pusta — kliknij &quot;Odśwież teraz&quot; albo uruchom `npm run scrape`.</p>}
        {schools.map((school) => {
          const run = lastRuns[school];
          return (
            <span
              key={school}
              className={`rounded-full border px-3 py-1 ${
                run?.ok ? "border-line bg-zinc-900" : "border-rose-900/60 bg-rose-950/40 text-rose-300"
              }`}
            >
              {school}: {run?.ok ? `${run.foundCount} ${pluralizeClasses(run.foundCount)}` : "błąd"} · ostatnia
              aktualizacja {formatRelative(run?.finishedAt)}
            </span>
          );
        })}
      </section>

      {schedule.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak danych do wyświetlenia. Uruchom scraping, żeby zobaczyć grafik.
        </p>
      ) : (
        <ScheduleExplorer rows={schedule} />
      )}
    </div>
  );
}
