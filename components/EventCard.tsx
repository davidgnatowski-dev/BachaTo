"use client";

import { useState } from "react";
import type { EventRow } from "@/lib/types";
import { CATEGORY_LABELS, categoryStyle, formatEventDateRange } from "@/lib/events";
import { EventDetailModal } from "@/components/EventDetailModal";
import { DateBadge } from "@/components/DateBadge";
import { PinIcon } from "@/components/icons";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { useFavorites } from "@/lib/favorites";

export function EventCard({ row }: { row: EventRow }) {
  const [open, setOpen] = useState(false);
  const colors = categoryStyle(row.category);
  const { likedEventIds, plannedEventIds, toggleLikeEvent, togglePlanEvent } = useFavorites();
  const favoriteId = `${row.source}-${row.id}`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="relative block w-full cursor-pointer overflow-hidden rounded-xl border border-line bg-zinc-900 text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600"
      >
        <div className="relative aspect-[16/9] w-full bg-zinc-800">
          {row.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per event
            <img src={row.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
          <div className="absolute left-2 top-2">
            <DateBadge isoDate={row.startDate} />
          </div>
          <div className="absolute right-2 top-2 flex gap-1.5">
            <PlusButton active={plannedEventIds.has(favoriteId)} onToggle={() => togglePlanEvent(favoriteId)} />
            <HeartButton active={likedEventIds.has(favoriteId)} onToggle={() => toggleLikeEvent(favoriteId)} />
          </div>
        </div>
        <div className="p-3">
          <span
            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
          >
            {CATEGORY_LABELS[row.category]}
          </span>
          <p className="mt-1.5 font-heading text-sm font-semibold leading-snug text-zinc-50">{row.title}</p>
          <p className="mt-1 text-xs text-muted">{formatEventDateRange(row)}</p>
          {row.city && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
              <PinIcon className="h-3.5 w-3.5" />
              {row.city}
            </p>
          )}
          {row.organizer && <p className="mt-0.5 text-xs text-zinc-500">{row.organizer}</p>}
        </div>
      </div>
      {open && <EventDetailModal row={row} onClose={() => setOpen(false)} />}
    </>
  );
}
