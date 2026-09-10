"use client";

import { useEffect, useRef, useState } from "react";
import type { EventRow } from "@/lib/types";
import { googleCalendarUrl, icsForEvent, outlookCalendarUrl } from "@/lib/events";
import { downloadIcs } from "@/lib/calendar";
import { CalendarIcon, ChevronDownIcon } from "@/components/icons";

export function AddEventToCalendarButton({ row }: { row: EventRow }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-zinc-950/70 px-3.5 py-2 text-sm font-semibold text-zinc-100 hover:border-violet/60 hover:text-violet"
        aria-expanded={open}
      >
        <CalendarIcon className="h-4 w-4" />
        Dodaj do kalendarza
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-zinc-950 shadow-2xl">
          <a href={googleCalendarUrl(row)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900">
            Google Calendar
          </a>
          <a href={outlookCalendarUrl(row)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900">
            Outlook
          </a>
          <button
            type="button"
            onClick={() => {
              downloadIcs(`${row.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.ics`, icsForEvent(row));
              setOpen(false);
            }}
            className="block w-full border-t border-line px-4 py-3 text-left text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Apple Calendar / plik .ics
          </button>
        </div>
      )}
    </div>
  );
}
