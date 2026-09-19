"use client";

import { useState } from "react";
import type { ClassRow } from "@/lib/types";
import { pluralizeClasses } from "@/lib/schedule";
import { classifyLevel, levelStyle, levelShortCode } from "@/lib/level";
import { ChevronDownIcon } from "@/components/icons";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { useFavorites } from "@/lib/favorites";
import { UnifiedClassRow } from "@/components/UnifiedClassRow";

const DAY_LABELS_FULL = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const DAY_CHIP_LABELS = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];
const MONTH_GENITIVE = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

function joinPl(items: string[]): string {
  const unique = Array.from(new Set(items));
  if (unique.length <= 1) return unique[0] ?? "";
  if (unique.length === 2) return `${unique[0]} i ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")} i ${unique[unique.length - 1]}`;
}

function favoriteId(row: ClassRow) {
  return `${row.school}-${row.id}`;
}

function mobileLevelLabel(level: string | undefined, bucket: ReturnType<typeof classifyLevel>) {
  return bucket === "open" ? "Open" : levelShortCode(level, bucket);
}

/** A compact class card. The orange action adds it to the plan, while the arrow opens its details. */
function TimelineClassRow({ row, onOpen }: { row: ClassRow; onOpen: () => void }) {
  const { plannedClassIds, togglePlanClass } = useFavorites();
  return <UnifiedClassRow row={row} showTime={false} planned={plannedClassIds.has(favoriteId(row))} onPlan={() => togglePlanClass(favoriteId(row))} tone="accent" onOpenDetails={onOpen} />;
}

function GroupPreviewRow({ row }: { row: ClassRow }) {
  const bucket = classifyLevel(row.level);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-amber-900/20 bg-black/15 px-3 py-2">
      <p className="min-w-0 truncate text-xs font-semibold text-zinc-100">{row.title}</p>
      <p className="shrink-0 text-[10px] text-muted">
        {row.school}{row.level ? <span className={levelStyle(bucket).text}> · {mobileLevelLabel(row.level, bucket)}</span> : null}
      </p>
    </div>
  );
}

function TimeSlot({ time, rows, onOpen }: { time: string; rows: ClassRow[]; onOpen: (row: ClassRow) => void }) {
  const [expanded, setExpanded] = useState(false);
  const previewRows = rows.slice(0, 3);

  return (
    <section className="pb-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-heading text-xs font-bold tabular-nums text-accent">{time}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      {rows.length === 1 ? (
        <TimelineClassRow row={rows[0]} onOpen={() => onOpen(rows[0])} />
      ) : expanded ? (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <TimelineClassRow key={`${row.school}-${row.id}`} row={row} onOpen={() => onOpen(row)} />
          ))}
          <button type="button" onClick={() => setExpanded(false)} className="py-1 text-xs font-semibold text-accent">
            Zwiń listę ↑
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-amber-900/40 bg-amber-950/10">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-50">
                {rows.length} {pluralizeClasses(rows.length)} do wyboru
              </p>
              <p className="truncate text-xs text-muted">{joinPl(rows.map((r) => r.school))}</p>
            </div>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
          <div>
            {previewRows.map((row) => <GroupPreviewRow key={`${row.school}-${row.id}`} row={row} />)}
          </div>
          {rows.length > previewRows.length && (
            <button type="button" onClick={() => setExpanded(true)} className="w-full border-t border-amber-900/20 bg-amber-950/20 px-3 py-2 text-xs font-semibold text-accent">
              Pokaż wszystkie {rows.length} ↓
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function DayScheduleSlots({ rows, allRows }: { rows: ClassRow[]; allRows: ClassRow[] }) {
  const [modalRow, setModalRow] = useState<ClassRow | null>(null);
  const byTime = new Map<string, ClassRow[]>();

  for (const row of rows) {
    const key = row.startTime ?? "?";
    byTime.set(key, [...(byTime.get(key) ?? []), row]);
  }

  return (
    <>
      <div className="flex flex-col">
        {Array.from(byTime.entries()).map(([time, timeRows]) => (
          <TimeSlot key={time} time={time} rows={timeRows} onOpen={setModalRow} />
        ))}
      </div>
      {modalRow && <ClassDetailModal row={modalRow} allRows={allRows} onClose={() => setModalRow(null)} />}
    </>
  );
}

export function DayTimeline({
  weekDates,
  selectedIso,
  groups,
  allRows,
  todayIso,
  tomorrowIso,
  onSelectWeekday,
}: {
  weekDates: string[];
  selectedIso: string;
  groups: Map<string, ClassRow[]>;
  allRows: ClassRow[];
  todayIso: string;
  tomorrowIso: string;
  onSelectWeekday: (weekday: number) => void;
}) {
  const dayRows = groups.get(selectedIso) ?? [];
  const date = new Date(`${selectedIso}T12:00:00`);
  const weekday = ((date.getDay() + 6) % 7) + 1;
  const prefix = selectedIso === todayIso ? "Dzisiaj, " : selectedIso === tomorrowIso ? "Jutro, " : "";
  const heading = `${prefix}${DAY_LABELS_FULL[weekday - 1]} ${date.getDate()} ${MONTH_GENITIVE[date.getMonth()]}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {weekDates.map((iso) => {
          const d = new Date(`${iso}T12:00:00`);
          const wd = ((d.getDay() + 6) % 7) + 1;
          const active = iso === selectedIso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectWeekday(wd)}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 text-center transition-colors ${
                active ? "border-accent bg-accent/15 text-accent" : "border-line text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase">{DAY_CHIP_LABELS[wd - 1]}</span>
              <span className="text-base font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <h2 className="font-heading text-lg font-bold text-zinc-50">
        {heading} <span className="text-sm font-normal text-muted">· {dayRows.length} {pluralizeClasses(dayRows.length)}</span>
      </h2>

      {dayRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Brak zajęć tego dnia.</p>
      ) : (
        <DayScheduleSlots rows={dayRows} allRows={allRows} />
      )}

      <p className="text-xs text-muted">Kolor skrótu oznacza poziom zajęć.</p>

    </div>
  );
}
