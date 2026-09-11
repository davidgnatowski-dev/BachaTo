"use client";

import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { CATEGORY_LABELS, categoryStyle, eventHref, formatEventDateRange, relativeEventLabel } from "@/lib/events";
import { DateBadge } from "@/components/DateBadge";
import { PinIcon, TicketIcon } from "@/components/icons";
import { EventPlanControls } from "@/components/EventPlanControls";
import { EventCoverImage } from "@/components/EventCoverImage";
import { OrganizerBadge } from "@/components/OrganizerBadge";

export function EventCard({ row, onRequireAuth }: { row: EventRow; onRequireAuth?: () => void }) {
  const colors = categoryStyle(row.category);
  const href = eventHref(row);
  const relative = relativeEventLabel(row.startDate);
  const registrationLabel = row.registrationStatus === "open"
    ? "Zapisy otwarte"
    : row.registrationStatus === "closed"
      ? "Zapisy zamknięte"
      : row.registrationStatus === "pending"
        ? "Zapisy wkrótce"
        : row.registrationStatus === "through_qualifiers"
          ? "Wybierz eliminację"
          : undefined;

  return (
    <article className="relative overflow-hidden rounded-xl border border-line bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600">
      <div className="relative aspect-[5/4] w-full bg-zinc-800 sm:aspect-[7/5]">
        <Link href={href} className="block h-full w-full" aria-label={`Zobacz wydarzenie: ${row.title}`}>
          {row.coverImage ? (
            <EventCoverImage src={row.coverImage} />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${colors.bg}`}>
              <TicketIcon className={`h-12 w-12 opacity-60 ${colors.text}`} />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10">
          <DateBadge isoDate={row.startDate} />
        </div>
        {relative && <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 rounded-full bg-zinc-950/85 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur">{relative}</span>}
        <div className="absolute right-2.5 top-2.5 z-10">
          <EventPlanControls row={row} compact onRequireAuth={onRequireAuth} />
        </div>
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10">
          <OrganizerBadge organizer={row.organizer} competitionSeries={row.competitionSeries} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
            {CATEGORY_LABELS[row.category]}
          </span>
          {row.competitionStage && (
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${row.competitionStage === "final" ? "bg-amber-950/70 text-amber-300 ring-amber-700/60" : "bg-sky-950/70 text-sky-300 ring-sky-700/60"}`}>
              {row.competitionStage === "final" ? "Finał" : "Eliminacje"}
            </span>
          )}
          {registrationLabel && (
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${row.registrationStatus === "open" ? "bg-emerald-950/70 text-emerald-300 ring-emerald-700/60" : row.registrationStatus === "closed" ? "bg-rose-950/70 text-rose-300 ring-rose-800/60" : "bg-violet/10 text-violet ring-violet/40"}`}>
              {registrationLabel}
            </span>
          )}
        </div>
        <h2 className="mt-2 font-heading text-base font-semibold leading-snug text-foreground">
          <Link href={href} className="hover:text-accent">{row.title}</Link>
        </h2>
        <p className="mt-1 text-xs text-muted">{formatEventDateRange(row)}</p>
        {row.registrationPrice && <p className="mt-0.5 text-xs text-zinc-300">Opłata konkursowa: {row.registrationPrice}</p>}
        {row.city && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
            <PinIcon className="h-3.5 w-3.5" />
            {row.city}
          </p>
        )}
        {row.organizer && <p className="mt-0.5 text-xs text-muted/70">{row.organizer}</p>}
        {row.qualifiesFor && <p className="mt-2 text-xs leading-5 text-sky-300">Awans do: {row.qualifiesFor}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Link href={href} className="inline-flex text-xs font-semibold text-accent hover:text-accent-peach">
            Szczegóły →
          </Link>
          {/^https?:\/\//.test(row.sourceUrl) && (
            <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-xs font-semibold text-zinc-400 hover:text-zinc-100">
              Oryginalna strona ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
