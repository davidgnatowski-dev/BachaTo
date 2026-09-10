"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setEventProgramAttendance } from "@/app/actions/events";
import { CalendarIcon, CheckIcon, PersonIcon, PinIcon, PlusIcon } from "@/components/icons";
import { useFavorites } from "@/lib/favorites";
import { cleanEventDescription, eventProgramFavoriteId } from "@/lib/events";
import type { EventProgramItem, EventRow } from "@/lib/types";

type DetailTab = "info" | "program" | "people";

function formatProgramTime(value: string) {
  return new Date(value).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function formatProgramDay(value: string) {
  return new Date(value).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
}

function programCalendarUrl(event: EventRow, item: EventProgramItem) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${item.title} — ${event.title}`,
    dates: `${new Date(item.startAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${new Date(item.endAt ?? new Date(new Date(item.startAt).getTime() + 3600000)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    details: [item.instructors.join(", "), item.description, event.sourceUrl].filter(Boolean).join("\n\n"),
    location: [item.room, event.venue, event.address, event.city].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function ProgramAttendance({ event, item, loggedIn, initialAttended }: { event: EventRow; item: EventProgramItem; loggedIn: boolean; initialAttended: boolean }) {
  const [attended, setAttended] = useState(initialAttended);
  const [pending, startTransition] = useTransition();
  if (new Date(item.startAt) > new Date()) return null;
  if (!loggedIn) return <Link href="/logowanie" className="text-xs font-semibold text-zinc-400 hover:text-accent">Zaloguj się, aby potwierdzić udział</Link>;
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={attended}
      onClick={() => {
        const next = !attended;
        setAttended(next);
        startTransition(async () => {
          const saved = await setEventProgramAttendance(event.source, event.id, item.id, next);
          if (!saved) setAttended(!next);
        });
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${attended ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-line text-zinc-300 hover:border-emerald-500/40"}`}
    >
      <CheckIcon className="h-3.5 w-3.5" /> {pending ? "Zapisuję…" : attended ? "Byłem/am ✓" : "Byłem/am"}
    </button>
  );
}

function Program({ event, loggedIn, attendedSessionIds }: { event: EventRow; loggedIn: boolean; attendedSessionIds: string[] }) {
  const favorites = useFavorites();
  const groups = useMemo(() => {
    const map = new Map<string, EventProgramItem[]>();
    for (const item of event.programItems ?? []) {
      const key = item.startAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([day, items]) => [day, items.sort((a, b) => a.startAt.localeCompare(b.startAt))] as const);
  }, [event.programItems]);
  const [selectedDay, setSelectedDay] = useState(groups[0]?.[0] ?? "");
  const items = groups.find(([day]) => day === selectedDay)?.[1] ?? [];

  if (groups.length === 0) return (
    <div className="rounded-2xl border border-dashed border-line bg-zinc-950/25 p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/10 text-violet"><CalendarIcon className="h-5 w-5" /></span>
      <h3 className="mt-3 font-heading text-base font-semibold text-zinc-100">Program jeszcze nie został opublikowany</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Gdy organizator udostępni harmonogram, będzie można dodać pojedyncze warsztaty i atrakcje do planu.</p>
      <Link href={`/dla-organizatorow?kind=correction&event=${encodeURIComponent(`${event.source}-${event.id}`)}&title=${encodeURIComponent(event.title)}`} className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent-peach">Znasz program? Zgłoś go →</Link>
    </div>
  );

  return (
    <div id="program">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {groups.map(([day]) => (
          <button key={day} type="button" onClick={() => setSelectedDay(day)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold capitalize ${selectedDay === day ? "border-accent bg-accent text-white" : "border-line text-zinc-300 hover:border-zinc-500"}`}>
            {formatProgramDay(`${day}T12:00:00`)}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-zinc-950/35">
        {items.map((item) => {
          const favoriteId = eventProgramFavoriteId(event.source, event.id, item.id);
          const planned = favorites.plannedEventSessionIds.has(favoriteId);
          return (
            <article key={item.id} className="grid gap-3 p-4 sm:grid-cols-[90px_minmax(0,1fr)] sm:p-5">
              <div>
                <p className="font-heading text-lg font-semibold text-zinc-50">{formatProgramTime(item.startAt)}</p>
                {item.endAt && <p className="text-xs text-muted">do {formatProgramTime(item.endAt)}</p>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-zinc-100">{item.title}</h3>
                    {item.instructors.length > 0 && <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-300"><PersonIcon className="h-3.5 w-3.5" />{item.instructors.join(", ")}</p>}
                    {item.room && <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted"><PinIcon className="h-3.5 w-3.5" />{item.room}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => favorites.togglePlanEventSession(favoriteId)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${planned ? "border-violet/50 bg-violet/10 text-violet" : "border-line text-zinc-300 hover:border-violet/50"}`}>
                      <PlusIcon className="h-3.5 w-3.5" /> {planned ? "W planie ✓" : "Dodaj do planu"}
                    </button>
                    <a href={programCalendarUrl(event, item)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-accent">
                      <CalendarIcon className="h-3.5 w-3.5" /> Kalendarz
                    </a>
                  </div>
                </div>
                {item.description && <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>}
                {item.levels.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{item.levels.map((level) => <span key={level} className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300">{level}</span>)}</div>}
                <div className="mt-3"><ProgramAttendance event={event} item={item} loggedIn={loggedIn} initialAttended={attendedSessionIds.includes(item.id)} /></div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function EventStructuredDetails({ event, loggedIn, attendedSessionIds }: { event: EventRow; loggedIn: boolean; attendedSessionIds: string[] }) {
  const hasProgram = Boolean(event.programItems?.length);
  const [tab, setTab] = useState<DetailTab>(hasProgram ? "program" : "info");
  const peopleLabel = event.category === "competition" ? "Jury" : "Prowadzący";
  const description = cleanEventDescription(event.description);
  const tabs: Array<{ key: DetailTab; label: string; count?: number }> = [
    { key: "info", label: "Informacje" },
    { key: "program", label: "Program", count: event.programItems?.length ?? 0 },
    { key: "people", label: peopleLabel, count: event.people?.length ?? 0 },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-zinc-900/45">
      <div className="flex gap-1 overflow-x-auto border-b border-line p-2 [scrollbar-width:none]">
        {tabs.map((item) => (
          <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === item.key ? "bg-accent text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"}`}>
            {item.label}{item.count !== undefined && <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${tab === item.key ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>{item.count}</span>}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        {tab === "info" && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">O wydarzeniu</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Najważniejsze informacje</h2>
            {description ? <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-300">{description}</p> : <p className="mt-4 text-sm text-muted">Organizator nie udostępnił jeszcze szerszego opisu.</p>}
          </div>
        )}
        {tab === "program" && <Program event={event} loggedIn={loggedIn} attendedSessionIds={attendedSessionIds} />}
        {tab === "people" && (
          (event.people?.length ?? 0) > 0 ? <div className="grid gap-4 sm:grid-cols-2">
            {event.people!.map((person) => (
              <article key={person.id} className="rounded-2xl border border-line bg-zinc-950/35 p-4">
                <div className="flex items-center gap-3">
                  {person.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external event artist photos use unpredictable hosts
                    <img src={person.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-500"><PersonIcon className="h-6 w-6" /></span>}
                  <div><h3 className="font-heading text-base font-semibold text-zinc-100">{person.name}</h3><p className="text-xs text-muted">{person.role === "jury" ? "Jury" : person.role === "dj" ? "DJ" : "Prowadzący"}</p></div>
                </div>
                {person.bio && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-accent">Poznaj prowadzącego</summary><p className="mt-2 text-xs leading-6 text-muted">{person.bio}</p></details>}
              </article>
            ))}
          </div> : <div className="rounded-2xl border border-dashed border-line bg-zinc-950/25 p-6 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/10 text-violet"><PersonIcon className="h-5 w-5" /></span>
            <h3 className="mt-3 font-heading text-base font-semibold text-zinc-100">{peopleLabel} nie zostali jeszcze ogłoszeni</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Uzupełnimy tę sekcję, gdy tylko pojawi się oficjalna lista.</p>
          </div>
        )}
      </div>
    </section>
  );
}
