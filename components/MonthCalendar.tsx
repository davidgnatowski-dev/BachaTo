"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { toLocalIsoDate } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const MONTH_LABELS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

/** Every ISO date an event spans (inclusive start..end), capped so a months-long festival doesn't blanket the calendar. */
function datesForEvent(row: Pick<EventRow, "startDate" | "endDate">): string[] {
  const start = new Date(`${row.startDate}T00:00:00`);
  const end = row.endDate ? new Date(`${row.endDate}T00:00:00`) : start;
  const dates: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 14) {
    dates.push(toLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return dates;
}

export function MonthCalendar({ events }: { events: EventRow[] }) {
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const row of events) {
      for (const date of datesForEvent(row)) {
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(row);
      }
    }
    return map;
  }, [events]);

  const todayIso = toLocalIsoDate(today);
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toLocalIsoDate(new Date(year, month, i + 1))),
  ];

  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  function selectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
    setShowList(false);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Kalendarz</h2>
        <div className="flex items-center gap-1 text-xs text-zinc-300">
          <button
            type="button"
            aria-label="Poprzedni miesiąc"
            onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
            className="rounded-full p-1 hover:bg-zinc-800"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="w-20 text-center font-medium">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            type="button"
            aria-label="Następny miesiąc"
            onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
            className="rounded-full p-1 hover:bg-zinc-800"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-muted">
            {label}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const dayEvents = eventsByDate.get(date);
          const isToday = date === todayIso;
          const isSelected = date === selectedDate;
          const dayNum = Number(date.slice(-2));
          const hasSocial = dayEvents?.some((e) => e.category === "social");
          const hasOther = dayEvents?.some((e) => e.category !== "social");
          return (
            <button
              key={date}
              type="button"
              onClick={() => selectDate(date)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                isSelected
                  ? "bg-accent text-white"
                  : isToday
                    ? "border border-accent text-accent"
                    : "text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {dayNum}
              {(hasOther || hasSocial) && !isSelected && (
                <span className="absolute bottom-0.5 flex gap-0.5" aria-hidden="true">
                  {hasOther && <span className="h-1 w-1 rounded-full bg-violet" />}
                  {hasSocial && <span className="h-1 w-1 rounded-full bg-pink" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedDate}
        onClick={() => setShowList((v) => !v)}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {showList ? "Ukryj wydarzenia z dnia" : "Pokaż wydarzenia z dnia"}
      </button>

      {showList && selectedDate && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted">Brak wydarzeń tego dnia.</p>
          ) : (
            selectedEvents.map((row) => (
              <Link
                key={`${row.source}-${row.id}`}
                href="/eventy"
                className="truncate text-xs text-zinc-300 hover:text-accent"
              >
                {row.title}
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  );
}
