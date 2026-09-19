"use client";

import { useState } from "react";
import type { ClassRow } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { UnifiedClassRow } from "@/components/UnifiedClassRow";
import { ClassDetailModal } from "@/components/ClassDetailModal";

/** Shared mobile schedule row using the same expandable pattern as My plan. */
export function ClassCard({ row, allRows }: { row: ClassRow; allRows: ClassRow[] }) {
  const [open, setOpen] = useState(false);
  const { plannedClassIds, togglePlanClass } = useFavorites();
  const id = `${row.school}-${row.id}`;
  return <><UnifiedClassRow row={row} planned={plannedClassIds.has(id)} onPlan={() => togglePlanClass(id)} tone="accent" onOpenDetails={() => setOpen(true)} />{open && <ClassDetailModal row={row} allRows={allRows} onClose={() => setOpen(false)} />}</>;
}
