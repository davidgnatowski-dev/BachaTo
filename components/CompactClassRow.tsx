"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { splitInstructors } from "@/lib/schedule";
import { classifyLevel, levelStyle } from "@/lib/level";
import { FORMAT_LABELS, formatStyle } from "@/lib/format";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { useFavorites } from "@/lib/favorites";

/**
 * One compact horizontal row (~72-90px) instead of the tall ClassCard —
 * time in a fixed left column, at most 2 badges, everything else (address,
 * description, room) only shown once you click through to the detail modal.
 */
export function CompactClassRow({ row, allRows }: { row: ClassRow; allRows: ClassRow[] }) {
  const [open, setOpen] = useState(false);
  const levelBucket = classifyLevel(row.level);
  const levelColors = levelStyle(levelBucket);
  const formatColors = formatStyle(row.format);
  const instructorNames = splitInstructors(row.instructor);
  const firstInstructorPhoto = row.instructorPhotos?.[instructorNames[0]];
  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();
  const favoriteId = `${row.school}-${row.id}`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 border-b border-line px-1 py-2.5 text-left transition-colors hover:bg-zinc-900/60 sm:gap-4"
      >
        <div className="w-16 shrink-0 sm:w-20">
          <p className="font-heading text-base font-bold tabular-nums text-accent sm:text-lg">{row.startTime ?? "?"}</p>
          {row.endTime && <p className="text-[11px] tabular-nums text-muted">–{row.endTime}</p>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-zinc-50 sm:text-[15px]">{row.title}</p>
          <p className="truncate text-xs text-muted">
            <Link
              href={`/szkoly/${encodeURIComponent(row.school)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-violet hover:underline"
            >
              {row.school}
            </Link>
            {instructorNames.length > 0 && (
              <>
                {" · "}
                {instructorNames.map((name, i) => (
                  <span key={name}>
                    {i > 0 && ", "}
                    <Link
                      href={`/instruktorzy/${encodeURIComponent(name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-zinc-300 hover:underline"
                    >
                      {name}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        </div>

        {firstInstructorPhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
          <img
            src={firstInstructorPhoto}
            alt=""
            className="hidden h-8 w-8 shrink-0 rounded-full object-cover sm:block"
          />
        )}

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {row.level && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${levelColors.bg} ${levelColors.text} ${levelColors.ring}`}
            >
              {row.level}
            </span>
          )}
          {row.format !== "unknown" && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${formatColors.bg} ${formatColors.text} ${formatColors.ring}`}
            >
              {FORMAT_LABELS[row.format]}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden sm:inline-flex">
            <PlusButton label="Dodaj do planu" active={plannedClassIds.has(favoriteId)} onToggle={() => togglePlanClass(favoriteId)} />
          </span>
          <span className="sm:hidden">
            <PlusButton active={plannedClassIds.has(favoriteId)} onToggle={() => togglePlanClass(favoriteId)} />
          </span>
          <HeartButton active={likedClassIds.has(favoriteId)} onToggle={() => toggleLikeClass(favoriteId)} />
        </div>
      </div>
      {open && <ClassDetailModal row={row} allRows={allRows} onClose={() => setOpen(false)} />}
    </>
  );
}
