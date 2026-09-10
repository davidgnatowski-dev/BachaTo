import Link from "next/link";
import { getCurrentSchedule, getInstructors, getSchoolProfiles, getUpcomingEvents } from "@/lib/db";
import { pluralizeClasses, schoolTextClass } from "@/lib/schedule";
import { pluralizeEvents, formatEventDateRange } from "@/lib/events";
import { Header } from "@/components/Header";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { nextOccurrences } from "@/lib/schedule";
import { eventHref } from "@/lib/events";

export const dynamic = "force-dynamic";

const RESULT_LIMIT = 6;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: rawQuery } = await searchParams;
  const query = (rawQuery ?? "").trim();
  const q = query.toLowerCase();

  const classMatches = q
    ? getCurrentSchedule().filter((r) => `${r.title} ${r.instructor ?? ""} ${r.school} ${r.danceStyle}`.toLowerCase().includes(q))
    : [];
  const eventMatches = q
    ? getUpcomingEvents().filter((r) => `${r.title} ${r.city ?? ""} ${r.organizer ?? ""}`.toLowerCase().includes(q))
    : [];
  const instructorMatches = q ? getInstructors().filter((i) => i.name.toLowerCase().includes(q)) : [];
  const schoolMatches = q ? getSchoolProfiles().filter((s) => s.name.toLowerCase().includes(q)) : [];

  const totalMatches = classMatches.length + eventMatches.length + instructorMatches.length + schoolMatches.length;
  const classOccurrences = nextOccurrences(classMatches, new Date(), RESULT_LIMIT);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Szukaj</h1>
        <form action="/szukaj" className="mt-3">
          <SearchAutocomplete defaultValue={query} />
        </form>
      </header>

      {!q ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Wpisz czego szukasz — zajęć, szkoły, instruktora albo wydarzenia.
        </p>
      ) : totalMatches === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak wyników dla &quot;{query}&quot;.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {classMatches.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-zinc-50">
                  Zajęcia · {classMatches.length} {pluralizeClasses(classMatches.length)}
                </h2>
                <Link href={`/grafik?q=${encodeURIComponent(query)}`} className="text-sm text-accent hover:text-accent-peach">
                  Zobacz w grafiku →
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-zinc-900/60 px-4">
                {classOccurrences.map(({ row, when }) => (
                  <Link
                    key={`${row.school}-${row.id}`}
                    href={`/grafik?q=${encodeURIComponent(row.title)}&school=${encodeURIComponent(row.school)}`}
                    className="flex items-center gap-3 py-2.5 first:pt-3.5 last:pb-3.5 hover:opacity-80"
                  >
                    <span className="w-24 shrink-0 text-xs font-semibold tabular-nums text-accent">{when.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}<span className="mt-0.5 block text-zinc-400">{row.startTime ?? "?"}</span></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{row.title}</p>
                      <p className="truncate text-xs text-muted">
                        <span className={schoolTextClass(row.school)}>{row.school}</span>
                        {row.instructor ? ` · ${row.instructor}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {eventMatches.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-zinc-50">
                  Wydarzenia · {eventMatches.length} {pluralizeEvents(eventMatches.length)}
                </h2>
                <Link href={`/eventy?q=${encodeURIComponent(query)}`} className="text-sm text-accent hover:text-accent-peach">
                  Zobacz w wydarzeniach →
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-zinc-900/60 px-4">
                {eventMatches.slice(0, RESULT_LIMIT).map((row) => (
                  <Link
                    key={`${row.source}-${row.id}`}
                    href={eventHref(row)}
                    className="flex items-center gap-3 py-2.5 first:pt-3.5 last:pb-3.5 hover:opacity-80"
                  >
                    <span className="w-24 shrink-0 text-xs font-semibold text-accent">{formatEventDateRange(row)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{row.title}</p>
                      {row.city && <p className="truncate text-xs text-muted">{row.city}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {instructorMatches.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold text-zinc-50">
                Instruktorzy · {instructorMatches.length}
              </h2>
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-zinc-900/60 px-4">
                {instructorMatches.slice(0, RESULT_LIMIT).map((i) => (
                  <Link
                    key={i.name}
                    href={`/instruktorzy/${encodeURIComponent(i.name)}`}
                    className="flex items-center gap-3 py-2.5 first:pt-3.5 last:pb-3.5 hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{i.name}</p>
                      <p className="truncate text-xs text-violet">{i.schools.join(", ")}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {i.classCount} {pluralizeClasses(i.classCount)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {schoolMatches.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold text-zinc-50">Szkoły · {schoolMatches.length}</h2>
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-zinc-900/60 px-4">
                {schoolMatches.map((s) => (
                  <Link
                    key={s.name}
                    href={`/szkoly/${encodeURIComponent(s.name)}`}
                    className="flex items-center gap-3 py-2.5 first:pt-3.5 last:pb-3.5 hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{s.name}</p>
                      <p className="truncate text-xs text-muted">{s.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
