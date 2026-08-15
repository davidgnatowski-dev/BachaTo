"use client";

import { useEffect, useRef, useState } from "react";
import type { ClassRow } from "@/lib/types";
import { downloadIcs, googleCalendarUrlForClass, icsForClass, nextClassOccurrence, outlookCalendarUrlForClass } from "@/lib/calendar";
import { CalendarIcon, ChevronDownIcon } from "@/components/icons";

export function AddToCalendarButton({ row }: { row: ClassRow }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const occurrence = nextClassOccurrence(row, new Date());
  if (!occurrence) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-black/40 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:border-violet/50 hover:text-violet"
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        Dodaj do kalendarza
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <a
            href={googleCalendarUrlForClass(row, occurrence)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Google Calendar
          </a>
          <a
            href={outlookCalendarUrlForClass(row, occurrence)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-3.5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Outlook
          </a>
          <button
            type="button"
            onClick={() => {
              downloadIcs(`${row.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.ics`, icsForClass(row, occurrence));
              setOpen(false);
            }}
            className="block w-full border-t border-line px-3.5 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Apple Calendar / plik .ics
          </button>
        </div>
      )}
    </div>
  );
}
