"use client";

import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";

export function EventDiscoveryShelves({ events, onRequireAuth }: { events: EventRow[]; onRequireAuth?: () => void }) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekendEnd = new Date(today); weekendEnd.setDate(weekendEnd.getDate() + 7);
  const weekendIso = `${weekendEnd.getFullYear()}-${String(weekendEnd.getMonth() + 1).padStart(2, "0")}-${String(weekendEnd.getDate()).padStart(2, "0")}`;
  const near = events.filter((event) => event.startDate <= weekendIso && (event.endDate ?? event.startDate) >= todayIso).slice(0, 6);
  const shelves = [
    { title: near.length ? "Dzisiaj i w najbliższych dniach" : "Najbliższe wydarzenia", href: "/eventy?date=week", rows: near.length ? near : events.slice(0, 6) },
    { title: "Praktisy i sociale", href: "/imprezy", rows: events.filter((event) => event.category === "social").slice(0, 6) },
    { title: "Festiwale i wyjazdy", href: "/festiwale", rows: events.filter((event) => event.category === "festival" || event.category === "trip").slice(0, 6) },
    { title: "Konkursy", href: "/konkursy", rows: events.filter((event) => event.category === "competition").slice(0, 6) },
  ].filter((shelf) => shelf.rows.length > 0);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-violet">Odkrywaj taniec</p><h2 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Znajdź swój następny event</h2></div><Link href="/eventy" className="text-xs font-semibold text-accent hover:text-accent-peach">Wszystkie wydarzenia i mapa →</Link></div>
      {shelves.map((shelf) => (
        <div key={shelf.title}>
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-heading text-lg font-semibold text-zinc-100">{shelf.title}</h3><Link href={shelf.href} className="shrink-0 text-xs font-semibold text-zinc-400 hover:text-accent">Zobacz wszystkie →</Link></div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shelf.rows.map((row) => <div key={`${shelf.title}-${row.source}-${row.id}`} className="w-64 shrink-0 snap-start sm:w-72"><EventCard row={row} onRequireAuth={onRequireAuth} /></div>)}
          </div>
        </div>
      ))}
    </section>
  );
}
