"use client";

import { useEffect } from "react";
import type { EventRow } from "@/lib/types";
import { CATEGORY_LABELS, categoryStyle, formatEventDateRange, googleCalendarUrl } from "@/lib/events";
import { DateBadge } from "@/components/DateBadge";
import { PinIcon, CalendarIcon } from "@/components/icons";

export function EventDetailModal({ row, onClose }: { row: EventRow; onClose: () => void }) {
  const colors = categoryStyle(row.category);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addressLine = [row.venue, row.address, row.city].filter(Boolean).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      >
        {row.coverImage && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per event */}
            <img src={row.coverImage} alt="" className="aspect-[16/9] w-full object-cover" />
            <div className="absolute left-3 top-3">
              <DateBadge isoDate={row.startDate} />
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-sm text-white backdrop-blur-sm hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
              >
                {CATEGORY_LABELS[row.category]}
              </span>
              <h2 className="mt-1.5 font-heading text-lg font-semibold leading-snug text-zinc-50">{row.title}</h2>
            </div>
            {!row.coverImage && (
              <button
                onClick={onClose}
                aria-label="Zamknij"
                className="shrink-0 rounded-full border border-line px-2.5 py-1 text-sm text-muted hover:text-zinc-100"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-black/30 px-3 py-1.5 text-sm text-zinc-200">
              <CalendarIcon className="h-4 w-4 text-muted" />
              {formatEventDateRange(row)}
            </span>
            <a
              href={googleCalendarUrl(row)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              <CalendarIcon className="h-4 w-4" />
              Dodaj do kalendarza
            </a>
          </div>

          {addressLine && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Miejsce</p>
              <p className="mt-1 inline-flex items-start gap-1.5 text-sm text-zinc-300">
                <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                <span>{addressLine}</span>
              </p>
            </div>
          )}

          {row.organizer && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Organizator</p>
              <p className="mt-1 text-sm text-zinc-300">{row.organizer}</p>
            </div>
          )}

          {row.description && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Opis</p>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">{row.description}</p>
            </div>
          )}

          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-500"
          >
            Zobacz źródło ↗
          </a>
        </div>
      </div>
    </div>
  );
}
