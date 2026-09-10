"use client";

import type { EventRow } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { PlusButton } from "@/components/PlusButton";
import { HeartButton } from "@/components/HeartButton";

export function EventPlanControls({ row, compact = false, onRequireAuth }: { row: EventRow; compact?: boolean; onRequireAuth?: () => void }) {
  const favorites = useFavorites();
  const id = `${row.source}-${row.id}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PlusButton
        active={favorites.plannedEventIds.has(id)}
        onToggle={() => {
          if (onRequireAuth && !favorites.plannedEventIds.has(id)) onRequireAuth();
          else favorites.togglePlanEvent(id);
        }}
        label={compact ? undefined : "Dodaj do planu"}
        tooltip="Dodaj wydarzenie do mojego planu"
        activeTooltip="Usuń wydarzenie z mojego planu"
        className={compact ? undefined : "!px-3.5 !py-2 !text-sm"}
      />
      <HeartButton
        active={favorites.likedEventIds.has(id)}
        onToggle={() => favorites.toggleLikeEvent(id)}
        label={compact ? undefined : "Dodaj do ulubionych"}
        className={compact ? undefined : "!px-3.5 !py-2 !text-sm"}
      />
    </div>
  );
}
