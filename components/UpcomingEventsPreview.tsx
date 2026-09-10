"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";

export function UpcomingEventsPreview({ events, onRequireAuth }: { events: EventRow[]; onRequireAuth?: () => void }) {
  const top = events.slice(0, 4);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (top.length === 0) return null;

  function scrollToIndex(i: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cardWidth = (scroller.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1;
    setActive(Math.round(scroller.scrollLeft / (cardWidth + 16)));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-zinc-50">Najbliższe wydarzenia</h2>
        <Link href="/eventy" className="text-xs font-semibold text-accent hover:text-accent-peach">
          Zobacz wszystkie →
        </Link>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {top.map((row) => (
          <div key={`${row.source}-${row.id}`} className="w-64 shrink-0 snap-start sm:w-72">
            <EventCard row={row} onRequireAuth={onRequireAuth} />
          </div>
        ))}
      </div>
      {top.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {top.map((row, i) => (
            <button
              key={`${row.source}-${row.id}-dot`}
              type="button"
              aria-label={`Wydarzenie ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${active === i ? "w-4 bg-accent" : "w-1.5 bg-zinc-700"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
