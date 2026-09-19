"use client";

import { Fragment, useMemo, useState } from "react";
import type { ClassRow } from "@/lib/types";
import { DAY_LABELS, pluralizeClasses, schoolTextClass, formatDuration, splitInstructors } from "@/lib/schedule";
import { classifyLevel, levelStyle, levelShortCode } from "@/lib/level";
import { PlusButton } from "@/components/PlusButton";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { useFavorites } from "@/lib/favorites";

const MAX_VISIBLE_PER_SLOT = 1;

function hourOf(time?: string): number | undefined {
  if (!time) return undefined;
  const h = Number(time.split(":")[0]);
  return Number.isFinite(h) ? h : undefined;
}

/**
 * Desktop-only hour-by-day grid for the "Tydzień" view: an hour axis on the
 * left, one column per active date, classes bucketed into their starting
 * hour (exact minutes still shown on the card). More than one class in the
 * same day+hour collapses into a "+N o HH:MM" chip you can expand. Clicking
 * a class selects it into the sticky bottom bar instead of opening the full
 * modal directly, which only opens from there.
 */
export function ScheduleWeekGrid({
  activeDates,
  groups,
  allRows,
  todayIso,
  onPlanToggle,
}: {
  activeDates: string[];
  groups: Map<string, ClassRow[]>;
  allRows: ClassRow[];
  todayIso: string;
  onPlanToggle?: (row: ClassRow) => void;
}) {
  const [selected, setSelected] = useState<ClassRow | null>(null);
  const [modalRow, setModalRow] = useState<ClassRow | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const { plannedClassIds, togglePlanClass } = useFavorites();

  const { hours, unscheduled } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const noTime: ClassRow[] = [];
    for (const iso of activeDates) {
      for (const row of groups.get(iso) ?? []) {
        const startH = hourOf(row.startTime);
        if (startH === undefined) {
          noTime.push(row);
          continue;
        }
        min = Math.min(min, startH);
        const [eh, em] = (row.endTime ?? row.startTime ?? "0:00").split(":").map(Number);
        const endH = em > 0 ? eh + 1 : eh;
        max = Math.max(max, endH, startH + 1);
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { hours: [] as number[], unscheduled: noTime };
    return { hours: Array.from({ length: max - min }, (_, i) => min + i), unscheduled: noTime };
  }, [activeDates, groups]);

  const favoriteId = (row: ClassRow) => `${row.school}-${row.id}`;
  const isSameRow = (a: ClassRow | null, b: ClassRow) => a !== null && a.school === b.school && a.id === b.id;

  if (hours.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 pb-20">
      <div className="overflow-x-auto rounded-2xl border border-line bg-black/15">
        <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `4.5rem repeat(${activeDates.length}, minmax(0, 1fr))` }}>
          <div className="border-b border-r border-line bg-zinc-950" />
          {activeDates.map((iso) => {
            const dayRows = groups.get(iso) ?? [];
            const date = new Date(`${iso}T12:00:00`);
            const weekday = ((date.getDay() + 6) % 7) + 1;
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`border-b-2 border-r border-line bg-zinc-950 px-3 py-2.5 text-center last:border-r-0 ${isToday ? "border-b-accent" : "border-b-line"}`}
              >
                <p className={`font-heading text-sm font-semibold ${isToday ? "text-accent" : "text-zinc-100"}`}>{DAY_LABELS[weekday - 1]}</p>
                <p className="text-xs text-muted">
                  {dayRows.length} {pluralizeClasses(dayRows.length)}
                </p>
              </div>
            );
          })}

          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="border-b border-r border-line bg-zinc-950 px-2 py-3 text-right text-xs font-semibold tabular-nums text-accent">
                {String(hour).padStart(2, "0")}:00
              </div>
              {activeDates.map((iso) => {
                const dayRows = (groups.get(iso) ?? []).filter((r) => hourOf(r.startTime) === hour);
                const slotKey = `${iso}-${hour}`;
                const isExpanded = expandedSlots.has(slotKey);
                const visible = isExpanded ? dayRows : dayRows.slice(0, MAX_VISIBLE_PER_SLOT);
                const hidden = dayRows.length - visible.length;
                return (
                  <div key={slotKey} className="flex flex-col gap-1.5 border-b border-r border-line p-1.5 last:border-r-0">
                    {visible.map((row) => (
                      <button
                        key={`${row.school}-${row.id}`}
                        type="button"
                        onClick={() => setSelected(row)}
                        className={`rounded-xl border px-2.5 py-2 text-left transition-colors ${
                          isSameRow(selected, row) ? "border-accent bg-accent/10" : "border-line bg-zinc-900 hover:border-zinc-600"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold tabular-nums text-accent">
                          {row.startTime}
                          {row.level && (
                            <span className={`font-semibold ${levelStyle(classifyLevel(row.level)).text}`}>
                              {levelShortCode(row.level, classifyLevel(row.level))}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-zinc-50">{row.title}</p>
                        <p className={`mt-0.5 truncate text-[10px] ${schoolTextClass(row.school)}`}>{row.school}</p>
                      </button>
                    ))}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedSlots((prev) => new Set(prev).add(slotKey))}
                        className="rounded-lg border border-dashed border-line px-2 py-1.5 text-center text-[11px] font-semibold text-muted hover:border-zinc-500 hover:text-zinc-200"
                      >
                        +{hidden} o {String(hour).padStart(2, "0")}:00
                      </button>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Bez podanej godziny:</span>
          {unscheduled.map((row) => (
            <button
              key={`${row.school}-${row.id}`}
              type="button"
              onClick={() => setSelected(row)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                isSameRow(selected, row) ? "border-accent text-accent" : "border-line text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {row.title}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="sticky bottom-3 z-20 flex items-center justify-between gap-4 rounded-2xl border border-line bg-zinc-950/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
          <button type="button" onClick={() => setModalRow(selected)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-zinc-50">
              {selected.startTime ? `${selected.startTime} · ` : ""}
              {selected.title}
            </p>
            <p className="truncate text-xs text-muted">
              <span className={schoolTextClass(selected.school)}>{selected.school}</span>
              {selected.level ? ` · ${selected.level}` : ""}
              {formatDuration(selected.startTime, selected.endTime) ? ` · ${formatDuration(selected.startTime, selected.endTime)}` : ""}
              {splitInstructors(selected.instructor).length > 0 ? ` · ${splitInstructors(selected.instructor).join(", ")}` : ""}
            </p>
          </button>
          <PlusButton
            label="Dodaj do planu"
            active={plannedClassIds.has(favoriteId(selected))}
            onToggle={() => onPlanToggle ? onPlanToggle(selected) : togglePlanClass(favoriteId(selected))}
            tone="accent"
          />
        </div>
      )}

      {modalRow && <ClassDetailModal row={modalRow} allRows={allRows} onClose={() => setModalRow(null)} />}
    </div>
  );
}
