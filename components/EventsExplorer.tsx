"use client";

import { useMemo, useState } from "react";
import type { EventCategory, EventRow } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_SECTION_TITLES, groupByCategory, pluralizeEvents } from "@/lib/events";
import { EventCard } from "@/components/EventCard";

const ALL = "all";

const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function EventsExplorer({ rows, lockedCategory }: { rows: EventRow[]; lockedCategory?: EventCategory }) {
  const [category, setCategory] = useState<string>(lockedCategory ?? ALL);
  const [city, setCity] = useState<string>(ALL);

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

  const filtered = useMemo(() => {
    return scopedRows.filter((r) => {
      if (category !== ALL && r.category !== (category as EventCategory)) return false;
      if (city !== ALL && r.city !== city) return false;
      return true;
    });
  }, [scopedRows, category, city]);

  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { festival: 0, trip: 0, social: 0, competition: 0 };
    for (const r of filtered) counts[r.category]++;
    return counts;
  }, [filtered]);

  const groups = groupByCategory(filtered);
  const hasActiveFilters = category !== (lockedCategory ?? ALL) || city !== ALL;

  function resetFilters() {
    setCategory(lockedCategory ?? ALL);
    setCity(ALL);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        {!lockedCategory && (
          <label className="flex flex-col gap-1 text-xs text-muted">
            Kategoria
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT_CLASS}>
              <option value={ALL}>Wszystkie</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        )}

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
          {categoryCounts.social > 0 && <span>{categoryCounts.social} socjale</span>}
          {categoryCounts.competition > 0 && <span>{categoryCounts.competition} zawody</span>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak wydarzeń spełniających wybrane kryteria.
        </p>
      ) : (
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
