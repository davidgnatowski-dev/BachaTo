"use client";

import { useState } from "react";
import type { ClassRow } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { UnifiedClassRow } from "@/components/UnifiedClassRow";
import { ClassDetailModal } from "@/components/ClassDetailModal";

/** Desktop schedule row kept as a wrapper so every schedule surface shares one visual language. */
export function CompactClassRow({ row, allRows }: { row: ClassRow; allRows: ClassRow[] }) {
  const [open, setOpen] = useState(false);
  const { plannedClassIds, togglePlanClass } = useFavorites();
  const id = `${row.school}-${row.id}`;
  return <><UnifiedClassRow row={row} planned={plannedClassIds.has(id)} onPlan={() => togglePlanClass(id)} onOpenDetails={() => setOpen(true)} />{open && <ClassDetailModal row={row} allRows={allRows} onClose={() => setOpen(false)} />}</>;
}
