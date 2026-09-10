"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EventCategory, EventRow } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_SECTION_TITLES, groupByCategory, pluralizeEvents } from "@/lib/events";
import { EventCard } from "@/components/EventCard";
import { EventMap } from "@/components/EventMap";

const ALL = "all";
type DateFilter = "all" | "today" | "tomorrow" | "weekend" | "week" | "month";

const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function EventsExplorer({ rows, lockedCategory }: { rows: EventRow[]; lockedCategory?: EventCategory }) {
  // Read once as the initial value so a link like /eventy?city=Gdańsk (from the Miasta directory) or
  // /eventy?q=... (from search) preselects the filter.
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("kategoria");
  const [category, setCategory] = useState<string>(
    lockedCategory ??
      (initialCategory && (CATEGORY_ORDER as string[]).includes(initialCategory) ? initialCategory : ALL)
  );
  const [city, setCity] = useState<string>(searchParams.get("city") ?? ALL);
  const [query, setQuery] = useState<string>(searchParams.get("q") ?? "");
  const initialDate = searchParams.get("date");
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialDate === "today" || initialDate === "tomorrow" || initialDate === "weekend" || initialDate === "week" || initialDate === "month" ? initialDate : "all");
  const [view, setView] = useState<"list" | "map">(searchParams.get("view") === "map" ? "map" : "list");

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

  const filteredResult = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today); monthEnd.setMonth(monthEnd.getMonth() + 1);
    const saturday = new Date(today); saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
    const monday = new Date(saturday); monday.setDate(monday.getDate() + 2);
    const matchesNonCategory = (r: EventRow) => {
      if (city !== ALL && r.city !== city) return false;
      if (q && !`${r.title} ${r.city ?? ""} ${r.organizer ?? ""}`.toLowerCase().includes(q)) return false;
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
  }, [scopedRows, category, city, query, dateFilter]);

  const filtered = filteredResult.rows;

  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { festival: 0, trip: 0, social: 0, competition: 0 };
    for (const r of filteredResult.byNonCategory) counts[r.category]++;
    return counts;
  }, [filteredResult]);

  const groups = groupByCategory(filtered);
  const hasActiveFilters = category !== (lockedCategory ?? ALL) || city !== ALL || query !== "" || dateFilter !== "all";

  function resetFilters() {
    setCategory(lockedCategory ?? ALL);
    setCity(ALL);
    setQuery("");
    setDateFilter("all");
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
                onClick={() => setCategory(key)}
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
          ].map(([key, label]) => <button key={key} type="button" onClick={() => setDateFilter(key as DateFilter)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold ${dateFilter === key ? "border-accent bg-accent text-white" : "border-line text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"}`}>{label}</button>)}
        </div>
        <div className="flex rounded-full border border-line bg-zinc-950/60 p-1">
          <button type="button" onClick={() => setView("list")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "list" ? "bg-zinc-800 text-zinc-100" : "text-muted"}`}>Lista</button>
          <button type="button" onClick={() => setView("map")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === "map" ? "bg-zinc-800 text-zinc-100" : "text-muted"}`}>Mapa</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Szukaj
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nazwa, organizator..."
            className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Miasto
          <select value={city} onChange={(e) => setCity(e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Wszystkie</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((row) => (
                  <EventCard key={`${row.source}-${row.id}`} row={row} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
