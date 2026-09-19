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
  const local = (near.length ? near : events.filter((event) => event.category === "social")).slice(0, 6);
  const trips = events.filter((event) => event.category === "festival" || event.category === "trip").slice(0, 6);
  const competitions = events.filter((event) => event.category === "competition").slice(0, 6);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-violet">Odkrywaj taniec</p><h2 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Znajdź swój następny event</h2><p className="mt-2 max-w-xl text-sm text-muted">Wybierz lokalny wieczór, taneczny wyjazd albo sprawdź się w konkursie.</p></div><Link href="/eventy" className="text-xs font-semibold text-accent hover:text-accent-peach">Wszystkie wydarzenia i mapa →</Link></div>

      <EventShelf title="Wydarzenia w najbliższych dniach" eyebrow="Blisko Ciebie" href="/eventy?date=week" rows={local} tone="local" onRequireAuth={onRequireAuth} />

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <EventShelf title="Wyjazdy i festiwale" eyebrow="Tańcz dalej" href="/festiwale" rows={trips} tone="trip" onRequireAuth={onRequireAuth} />
        <EventShelf title="Konkursy" eyebrow="Sprawdź się" href="/konkursy" rows={competitions} tone="competition" onRequireAuth={onRequireAuth} />
      </div>
    </section>
  );
}

function EventShelf({ title, eyebrow, href, rows, tone, onRequireAuth }: { title: string; eyebrow: string; href: string; rows: EventRow[]; tone: "local" | "trip" | "competition"; onRequireAuth?: () => void }) {
  if (rows.length === 0) return null;
  const toneClass = tone === "trip" ? "border-accent/30 bg-accent/[0.055]" : tone === "competition" ? "border-violet/35 bg-violet/[0.06]" : "border-line bg-zinc-900/35";
  const eyebrowClass = tone === "trip" ? "text-accent" : tone === "competition" ? "text-violet" : "text-zinc-400";
  return (
    <section className={`flex h-full min-w-0 flex-col rounded-3xl border p-4 sm:p-5 ${toneClass}`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${eyebrowClass}`}>{eyebrow}</p><h3 className="mt-1 font-heading text-lg font-semibold text-zinc-100">{title}</h3></div>
        <Link href={href} className="shrink-0 text-xs font-semibold text-zinc-400 hover:text-accent">Zobacz wszystkie →</Link>
      </div>
      <div className="flex flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((row) => <div key={`${title}-${row.source}-${row.id}`} className="flex w-64 shrink-0 snap-start sm:w-72"><EventCard row={row} onRequireAuth={onRequireAuth} /></div>)}
      </div>
    </section>
  );
}
