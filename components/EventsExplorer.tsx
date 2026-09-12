"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EventCategory, EventRow } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_SECTION_TITLES, eventCountry, groupByCategory, groupCompetitionSeries, pluralizeEvents } from "@/lib/events";
import { EventCard } from "@/components/EventCard";
import { EventMap } from "@/components/EventMap";
import { ChevronDownIcon } from "@/components/icons";

/** Collapsed by default once a list gets long enough that scrolling past it is annoying. */
const COLLAPSE_THRESHOLD = 6;

const ALL = "all";
/** The country filter opens scoped to Poland — most visitors care about local events; "Wszystkie" is one click away. */
const DEFAULT_COUNTRY = "Polska";
type DateFilter = "all" | "today" | "tomorrow" | "weekend" | "week" | "month";

const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function EventGrid({ rows }: { rows: EventRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => <EventCard key={`${row.source}-${row.id}`} row={row} />)}
    </div>
  );
}

function qualifierCountLabel(count: number): string {
  if (count === 1) return "1 eliminacja";
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${count} eliminacje`;
  return `${count} eliminacji`;
}

function CompetitionListing({ rows }: { rows: EventRow[] }) {
  const grouped = groupCompetitionSeries(rows);

  return (
    <div className="flex flex-col gap-7">
      {grouped.series.map((series) => (
        <section key={series.name} className="overflow-hidden rounded-2xl border border-sky-800/50 bg-sky-950/20">
          <header className="border-b border-sky-900/60 bg-sky-950/35 px-5 py-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Cykl konkursowy · droga do finału</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <h3 className="font-heading text-xl font-semibold text-zinc-50">{series.name}</h3>
              <p className="text-xs text-zinc-400">
                {qualifierCountLabel(series.qualifiers.length)} · {series.finals.length} {series.finals.length === 1 ? "finał" : "finałów"}
              </p>
            </div>
          </header>
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            {series.qualifiers.length > 0 && (
              <details className="group" open={series.qualifiers.length <= COLLAPSE_THRESHOLD}>
                <summary className="mb-3 flex cursor-pointer list-none items-center gap-3 select-none [&::-webkit-details-marker]:hidden">
                  <span className="rounded-full bg-sky-950/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-300 ring-1 ring-sky-700/50">Eliminacje</span>
                  <span className="h-px flex-1 bg-sky-900/50" />
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-sky-300">
                    {qualifierCountLabel(series.qualifiers.length)}
                    <ChevronDownIcon className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <EventGrid rows={series.qualifiers} />
              </details>
            )}
            {series.finals.length > 0 && (
              <details className="group" open>
                <summary className="mb-3 flex cursor-pointer list-none items-center gap-3 select-none [&::-webkit-details-marker]:hidden">
                  <span className="rounded-full bg-amber-950/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-700/50">Finał</span>
                  <span className="h-px flex-1 bg-amber-900/50" />
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-amber-300">
                    {series.finals.length}
                    <ChevronDownIcon className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <EventGrid rows={series.finals} />
              </details>
            )}
          </div>
        </section>
      ))}
      {grouped.standalone.length > 0 && (
        <section>
          {grouped.series.length > 0 && <h3 className="mb-3 font-heading text-lg font-semibold text-zinc-50">Pozostałe konkursy</h3>}
          <EventGrid rows={grouped.standalone} />
        </section>
      )}
    </div>
  );
}

export function EventsExplorer({ rows, lockedCategory }: { rows: EventRow[]; lockedCategory?: EventCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("kategoria");
  const category = (
    lockedCategory ??
      (initialCategory && (CATEGORY_ORDER as string[]).includes(initialCategory) ? initialCategory : ALL)
  );
  const city = searchParams.get("city") ?? ALL;
  const country = searchParams.get("country") ?? DEFAULT_COUNTRY;
  const source = searchParams.get("source") ?? ALL;
  const seriesFilter = searchParams.get("series") ?? ALL;
  const query = searchParams.get("q") ?? "";
  const initialDate = searchParams.get("date");
  const dateFilter: DateFilter = initialDate === "today" || initialDate === "tomorrow" || initialDate === "weekend" || initialDate === "week" || initialDate === "month" ? initialDate : "all";
  const view = searchParams.get("view") === "map" ? "map" : "list";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const isDefaultCountry = key === "country" && value === DEFAULT_COUNTRY;
    if ((value === ALL && key !== "country") || value === "" || (key === "view" && value === "list") || isDefaultCountry) params.delete(key);
    else params.set(key, value);
    if (key === "kategoria" && value !== "competition") params.delete("series");
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  const scopedRows = useMemo(
    () => (lockedCategory ? rows.filter((r) => r.category === lockedCategory) : rows),
    [rows, lockedCategory]
  );

  const cities = useMemo(
    () =>
      Array.from(new Set(scopedRows.map((r) => r.city).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "pl")
      ),
    [scopedRows]
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(scopedRows.map((r) => eventCountry(r)).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "pl")
      ),
    [scopedRows]
  );

  const sources = useMemo(
    () => Array.from(new Set(scopedRows.map((r) => r.source))).sort((a, b) => a.localeCompare(b, "pl")),
    [scopedRows]
  );

  const competitionSeries = useMemo(
    () => Array.from(new Set(scopedRows.map((r) => r.competitionSeries).filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b, "pl")),
    [scopedRows]
  );

  const filteredResult = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 6);
    const monthEnd = new Date(today); monthEnd.setMonth(monthEnd.getMonth() + 1);
    const saturday = new Date(today); saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
    const monday = new Date(saturday); monday.setDate(monday.getDate() + 2);
    const matchesNonCategory = (r: EventRow) => {
      if (city !== ALL && r.city !== city) return false;
      if (country !== ALL && eventCountry(r) !== country) return false;
      if (source !== ALL && r.source !== source) return false;
      if ((category === "competition" || lockedCategory === "competition") && seriesFilter !== ALL && r.competitionSeries !== seriesFilter) return false;
      if (q && !`${r.title} ${r.city ?? ""} ${r.organizer ?? ""} ${r.source} ${r.description ?? ""} ${r.competitionSeries ?? ""} ${r.qualifiesFor ?? ""}`.toLowerCase().includes(q)) return false;
      const start = new Date(`${r.startDate}T00:00:00`);
      const end = new Date(`${r.endDate ?? r.startDate}T23:59:59`);
      if (dateFilter === "today" && !(start <= today && end >= today)) return false;
      if (dateFilter === "tomorrow" && !(start <= tomorrow && end >= tomorrow)) return false;
      if (dateFilter === "weekend" && !(end >= saturday && start < monday)) return false;
      if (dateFilter === "week" && !(end >= today && start <= weekEnd)) return false;
      if (dateFilter === "month" && !(end >= today && start <= monthEnd)) return false;
      return true;
    };
    const byNonCategory = scopedRows.filter(matchesNonCategory);
    return {
      rows: byNonCategory.filter((r) => category === ALL || r.category === (category as EventCategory)),
      byNonCategory,
    };
  }, [scopedRows, category, city, country, source, seriesFilter, query, dateFilter, lockedCategory]);

  const filtered = filteredResult.rows;

  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { festival: 0, trip: 0, social: 0, competition: 0 };
    for (const r of filteredResult.byNonCategory) counts[r.category]++;
    return counts;
  }, [filteredResult]);

  const groups = groupByCategory(filtered);
  const hasActiveFilters = category !== (lockedCategory ?? ALL) || city !== ALL || country !== DEFAULT_COUNTRY || source !== ALL || seriesFilter !== ALL || query !== "" || dateFilter !== "all";

  function resetFilters() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      {!lockedCategory && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {([[ALL, "Wszystkie"], ...CATEGORY_ORDER.map((c) => [c, CATEGORY_LABELS[c]] as const)] as const).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateParam("kategoria", key)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  category === key
                    ? "border-accent bg-accent text-white"
                    : "border-line text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                }`}
              >
                {label}
                {key !== ALL && categoryCounts[key as EventCategory] > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">{categoryCounts[key as EventCategory]}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[
            ["all", "Wszystkie"], ["today", "Dzisiaj"], ["tomorrow", "Jutro"], ["weekend", "Weekend"], ["week", "7 dni"], ["month", "Miesiąc"],
          ].map(([key, label]) => <button key={key} type="button" onClick={() => updateParam("date", key)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold ${dateFilter === key ? "border-accent bg-accent text-white" : "border-line text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"}`}>{label}</button>)}
        </div>
        <div className="flex rounded-full border border-line bg-zinc-950/60 p-1">
          <button type="button" onClick={() => updateParam("view", "list")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "list" ? "bg-zinc-800 text-zinc-100" : "text-muted"}`}>Lista</button>
          <button type="button" onClick={() => updateParam("view", "map")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "map" ? "bg-zinc-800 text-zinc-100" : "text-muted"}`}>Mapa</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Szukaj
          <input
            type="text"
            value={query}
            onChange={(e) => updateParam("q", e.target.value)}
            placeholder="Nazwa, organizator..."
            className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Miasto
          <select value={city} onChange={(e) => updateParam("city", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Wszystkie</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {countries.length > 0 && (
          <label className="flex flex-col gap-1 text-xs text-muted">
            Kraj
            <select value={country} onChange={(e) => updateParam("country", e.target.value)} className={SELECT_CLASS}>
              <option value={ALL}>Wszystkie</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs text-muted">
          Źródło danych
          <select value={source} onChange={(e) => updateParam("source", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Wszystkie</option>
            {sources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {competitionSeries.length > 0 && (category === "competition" || lockedCategory === "competition") && (
          <label className="flex flex-col gap-1 text-xs text-muted">
            Cykl konkursowy
            <select value={seriesFilter} onChange={(e) => updateParam("series", e.target.value)} className={SELECT_CLASS}>
              <option value={ALL}>Wszystkie</option>
              {competitionSeries.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        )}

        {hasActiveFilters && (
          <button onClick={resetFilters} className="rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:text-accent-peach">
            Wyczyść filtry
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-zinc-50">
            {filtered.length} {pluralizeEvents(filtered.length)}
          </span>
          {categoryCounts.festival > 0 && <span>{categoryCounts.festival} festiwale</span>}
          {categoryCounts.trip > 0 && <span>{categoryCounts.trip} wyjazdy</span>}
          {categoryCounts.social > 0 && <span>{categoryCounts.social} praktyka taneczna</span>}
          {categoryCounts.competition > 0 && <span>{categoryCounts.competition} zawody</span>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak wydarzeń spełniających wybrane kryteria.
        </p>
      ) : view === "map" ? <EventMap rows={filtered} /> : (
        CATEGORY_ORDER.map((c) => {
          const items = groups.get(c) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={c} className="flex flex-col gap-3">
              {!lockedCategory && (
                <h2 className="font-heading text-lg font-semibold text-zinc-50">{CATEGORY_SECTION_TITLES[c]}</h2>
              )}
              {c === "competition" && category === "competition" ? <CompetitionListing rows={items} /> : <EventGrid rows={items} />}
            </div>
          );
        })
      )}
    </div>
  );
}
