"use client";

import { useState } from "react";
import type { UpcomingClass } from "@/lib/schedule";
import type { ClassRow } from "@/lib/types";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { LevelDot } from "@/components/LevelDot";
import { useFavorites } from "@/lib/favorites";
import { schoolTextClass } from "@/lib/schedule";

/** Reused by instructor and school profile pages — a clickable upcoming-occurrences list that opens the same detail modal as the schedule. */
export function UpcomingClassList({ items, allRows }: { items: UpcomingClass[]; allRows: ClassRow[] }) {
  const [openRow, setOpenRow] = useState<ClassRow | null>(null);
  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();

  if (items.length === 0) {
    return <p className="text-sm text-muted">Brak nadchodzących zajęć w grafiku.</p>;
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-line">
        {items.map(({ row, label }) => {
          const favoriteId = `${row.school}-${row.id}`;
          return (
            <div
              key={favoriteId}
              role="button"
              tabIndex={0}
              onClick={() => setOpenRow(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenRow(row);
                }
              }}
              className="flex cursor-pointer items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-zinc-900/40"
            >
              <div className="w-16 shrink-0">
                <p className="text-base font-bold tabular-nums text-accent">{row.startTime ?? "?"}</p>
                <p className="text-[11px] text-muted/70">{label}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                  <LevelDot level={row.level} className="mr-1.5 align-middle" />
                  {row.title}
                </p>
                <p className="truncate text-xs text-muted/70">
                  <span className={schoolTextClass(row.school)}>{row.school}</span>
                  {row.instructor ? ` · ${row.instructor}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <PlusButton
                  active={plannedClassIds.has(favoriteId)}
                  onToggle={() => togglePlanClass(favoriteId)}
                  tooltip="Dodaj do mojego planu"
                  activeTooltip="Usuń z mojego planu"
                />
                <HeartButton active={likedClassIds.has(favoriteId)} onToggle={() => toggleLikeClass(favoriteId)} />
              </div>
            </div>
          );
        })}
      </div>
      {openRow && <ClassDetailModal row={openRow} allRows={allRows} onClose={() => setOpenRow(null)} />}
    </>
  );
}
