"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventCategory, EventRow } from "@/lib/types";
import { CATEGORY_LABELS, eventHref, formatEventDateRange } from "@/lib/events";
import { EventCard } from "@/components/EventCard";
import { EventCoverImage } from "@/components/EventCoverImage";
import { EventPlanControls } from "@/components/EventPlanControls";
import { EventMap } from "@/components/EventMap";
import { DateBadge } from "@/components/DateBadge";
import { PinIcon, SearchIcon } from "@/components/icons";

type CategoryFilter = "all" | EventCategory;

const FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "social", label: "Sociale" },
  { value: "festival", label: "Festiwale" },
  { value: "trip", label: "Wyjazdy" },
  { value: "competition", label: "Konkursy" },
];

export function EventsV2Explorer({ rows }: { rows: EventRow[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<"list" | "map">("list");

  const cities = useMemo(() => Array.from(new Set(rows.map((row) => row.city).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "pl")), [rows]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pl");
    return rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (city !== "all" && row.city !== city) return false;
      if (normalized && !`${row.title} ${row.city ?? ""} ${row.organizer ?? ""}`.toLocaleLowerCase("pl").includes(normalized)) return false;
      return true;
    });
  }, [category, city, query, rows]);

  const featured = filtered[0];
  const remaining = filtered.slice(1, 7);

  return (
    <main className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-accent">Odkrywaj taniec</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-white sm:text-4xl">Znajdź swoje <span className="text-accent">wydarzenie</span></h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted">Sociale, festiwale, wyjazdy i konkursy w jednym miejscu. Wybierz termin i dodaj wydarzenie do swojego planu.</p>
      </header>

      <section className="grid gap-2 rounded-2xl border border-line bg-zinc-900/60 p-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-black/30 px-3 text-sm text-zinc-300">
          <SearchIcon className="h-4 w-4 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj wydarzeń, miast, organizatorów…" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-600" />
        </label>
        <select value={city} onChange={(event) => setCity(event.target.value)} className="min-h-12 rounded-xl border border-line bg-black/30 px-3 text-sm text-zinc-200 outline-none focus:border-accent">
          <option value="all">Wszystkie miasta</option>
          {cities.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="flex rounded-xl border border-line bg-black/30 p-1">
          <button type="button" onClick={() => setView("list")} className={`rounded-lg px-4 text-xs font-semibold ${view === "list" ? "bg-accent text-white" : "text-muted"}`}>Lista</button>
          <button type="button" onClick={() => setView("map")} className={`rounded-lg px-4 text-xs font-semibold ${view === "map" ? "bg-accent text-white" : "text-muted"}`}>Mapa</button>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Kategorie wydarzeń">
        {FILTERS.map((filter) => <button key={filter.value} type="button" onClick={() => setCategory(filter.value)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${category === filter.value ? "border-accent bg-accent text-white" : "border-line text-zinc-300"}`}>{filter.label}</button>)}
      </nav>

      {filtered.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">Nie znaleziono wydarzeń pasujących do filtrów.</p> : view === "map" ? <EventMap rows={filtered} /> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
          <section className="overflow-hidden rounded-3xl border border-line bg-zinc-900">
            {featured && <article className="grid md:grid-cols-[1.08fr_.92fr]">
              <div className="relative min-h-72 bg-zinc-800 md:min-h-[390px]">
                {featured.coverImage && <EventCoverImage src={featured.coverImage} />}
                <div className="absolute left-4 top-4"><DateBadge isoDate={featured.startDate} /></div>
                <div className="absolute right-4 top-4"><EventPlanControls row={featured} compact /></div>
              </div>
              <div className="flex flex-col p-5 sm:p-7">
                <span className="w-fit rounded-full border border-violet/40 bg-violet/10 px-2.5 py-1 text-[10px] font-semibold text-violet">{CATEGORY_LABELS[featured.category]}</span>
                <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-white">{featured.title}</h2>
                <p className="mt-3 text-sm text-zinc-300">{formatEventDateRange(featured)}</p>
                {featured.city && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><PinIcon className="h-4 w-4" />{[featured.venue, featured.city].filter(Boolean).join(" · ")}</p>}
                {featured.description && <p className="mt-5 line-clamp-4 text-sm leading-6 text-muted">{featured.description}</p>}
                <Link href={eventHref(featured)} className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white">Zobacz wydarzenie →</Link>
              </div>
            </article>}
            <div className="border-t border-line p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-lg font-semibold text-white">Nadchodzące wydarzenia</h2><span className="text-xs text-muted">{filtered.length} wyników</span></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{remaining.map((row) => <EventCard key={`${row.source}-${row.id}`} row={row} />)}</div>
            </div>
          </section>
          <aside className="flex flex-col gap-4">
            <section className="rounded-3xl border border-line bg-zinc-900 p-5"><h2 className="font-heading text-lg font-semibold text-white">Odkrywaj po swojemu</h2><div className="mt-3 divide-y divide-line">{FILTERS.slice(1).map((filter) => <button key={filter.value} type="button" onClick={() => setCategory(filter.value)} className="flex w-full items-center justify-between py-3 text-sm text-zinc-300"><span>{filter.label}</span><span className="font-semibold text-accent">{rows.filter((row) => row.category === filter.value).length}</span></button>)}</div></section>
            <button type="button" onClick={() => setView("map")} className="min-h-14 rounded-2xl border border-accent/40 bg-accent/10 text-sm font-semibold text-accent">Zobacz wydarzenia na mapie →</button>
            <Link href="/dla-organizatorow" className="rounded-2xl border border-line p-5 text-sm text-zinc-300 hover:border-accent"><strong className="block text-white">Organizujesz wydarzenie?</strong><span className="mt-1 block text-muted">Dodaj je do BachaTo →</span></Link>
          </aside>
        </div>
      )}
    </main>
  );
}
