"use client";

import { useState } from "react";
import type { UpcomingClass } from "@/lib/schedule";
import type { ClassRow } from "@/lib/types";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { useFavorites } from "@/lib/favorites";
import { UnifiedClassRow } from "@/components/UnifiedClassRow";

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
            <UnifiedClassRow
              key={favoriteId}
              row={row}
              dateLabel={label}
              planned={plannedClassIds.has(favoriteId)}
              liked={likedClassIds.has(favoriteId)}
              onPlan={() => togglePlanClass(favoriteId)}
              onLike={() => toggleLikeClass(favoriteId)}
              onOpenDetails={() => setOpenRow(row)}
            />
          );
        })}
      </div>
      {openRow && <ClassDetailModal row={openRow} allRows={allRows} onClose={() => setOpenRow(null)} />}
    </>
  );
}
