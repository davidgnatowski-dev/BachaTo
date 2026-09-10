"use client";

import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { CATEGORY_LABELS, categoryStyle, eventHref, formatEventDateRange, relativeEventLabel } from "@/lib/events";
import { DateBadge } from "@/components/DateBadge";
import { PinIcon, TicketIcon } from "@/components/icons";
import { EventPlanControls } from "@/components/EventPlanControls";

export function EventCard({ row, onRequireAuth }: { row: EventRow; onRequireAuth?: () => void }) {
  const colors = categoryStyle(row.category);
  const href = eventHref(row);
  const relative = relativeEventLabel(row.startDate);

  return (
    <article className="relative overflow-hidden rounded-xl border border-line bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600">
      <div className="relative aspect-[5/4] w-full bg-zinc-800 sm:aspect-[7/5]">
        <Link href={href} className="block h-full w-full" aria-label={`Zobacz wydarzenie: ${row.title}`}>
          {row.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per event
            <img src={row.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${colors.bg}`}>
              <TicketIcon className={`h-12 w-12 opacity-60 ${colors.text}`} />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5">
          <DateBadge isoDate={row.startDate} />
        </div>
        {relative && <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-zinc-950/85 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur">{relative}</span>}
        <div className="absolute right-2.5 top-2.5">
          <EventPlanControls row={row} compact onRequireAuth={onRequireAuth} />
        </div>
      </div>

      <div className="p-4">
        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
          {CATEGORY_LABELS[row.category]}
        </span>
        <h2 className="mt-2 font-heading text-base font-semibold leading-snug text-foreground">
          <Link href={href} className="hover:text-accent">{row.title}</Link>
        </h2>
        <p className="mt-1 text-xs text-muted">{formatEventDateRange(row)}</p>
        {row.city && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
            <PinIcon className="h-3.5 w-3.5" />
            {row.city}
          </p>
        )}
        {row.organizer && <p className="mt-0.5 text-xs text-muted/70">{row.organizer}</p>}
        <Link href={href} className="mt-3 inline-flex text-xs font-semibold text-accent hover:text-accent-peach">
          Szczegóły wydarzenia →
        </Link>
      </div>
    </article>
  );
}
