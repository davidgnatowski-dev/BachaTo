"use client";

import { useMemo, useState } from "react";
import type { InstructorProfile } from "@/lib/db";
import { InstructorCard } from "@/components/InstructorCard";

const ALL = "all";

export function InstructorsExplorer({ instructors }: { instructors: InstructorProfile[] }) {
  const [school, setSchool] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const schools = useMemo(
    () => Array.from(new Set(instructors.flatMap((i) => i.schools))).sort((a, b) => a.localeCompare(b, "pl")),
    [instructors]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instructors.filter((i) => {
      if (school !== ALL && !i.schools.includes(school)) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [instructors, school, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Szkoła
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value={ALL}>Wszystkie</option>
            {schools.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Szukaj
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Imię i nazwisko"
            className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>

        <span className="ml-auto text-xs font-semibold text-zinc-50">{filtered.length} instruktorów</span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak instruktorów spełniających wybrane kryteria.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <InstructorCard key={i.name} instructor={i} />
          ))}
        </div>
      )}
    </div>
  );
}
