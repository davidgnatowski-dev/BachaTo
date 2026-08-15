"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { schoolStyle, formatDatePl, splitInstructors } from "@/lib/schedule";
import { classifyLevel, levelStyle, LEVEL_BUCKET_ICONS } from "@/lib/level";
import { FORMAT_LABELS, formatStyle } from "@/lib/format";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { PinIcon, PersonIcon } from "@/components/icons";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { useFavorites } from "@/lib/favorites";

export function ClassCard({ row, allRows }: { row: ClassRow; allRows: ClassRow[] }) {
  const [open, setOpen] = useState(false);
  const style = schoolStyle();
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
        className="relative block w-full cursor-pointer rounded-xl border border-line bg-zinc-900 p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600"
      >
        <div className="absolute right-2.5 top-2.5 flex gap-1.5">
          <PlusButton active={plannedClassIds.has(favoriteId)} onToggle={() => togglePlanClass(favoriteId)} />
          <HeartButton active={likedClassIds.has(favoriteId)} onToggle={() => toggleLikeClass(favoriteId)} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-accent">
          {row.startTime ?? "?"}
          {row.endTime ? ` – ${row.endTime}` : ""}
        </span>
        <p className="mt-1 pr-16 font-heading text-sm font-semibold leading-snug text-zinc-50">{row.title}</p>
        <p className={`mt-0.5 text-xs font-medium ${style.text}`}>
          <Link href={`/szkoly/${encodeURIComponent(row.school)}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
            {row.school}
          </Link>
          {row.specificDate ? ` · ${formatDatePl(row.specificDate)}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {row.level && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${levelColors.bg} ${levelColors.text} ${levelColors.ring}`}
            >
              <span aria-hidden="true">{LEVEL_BUCKET_ICONS[levelBucket]}</span>
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
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {instructorNames.length > 0 && (
            <span className="inline-flex items-center gap-1">
              {firstInstructorPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
                <img src={firstInstructorPhoto} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
              ) : (
                <PersonIcon className="h-3.5 w-3.5" />
              )}
              {instructorNames.map((name, i) => (
                <span key={name}>
                  {i > 0 && ", "}
                  <Link
                    href={`/instruktorzy/${encodeURIComponent(name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-zinc-200 hover:underline"
                  >
                    {name}
                  </Link>
                </span>
              ))}
            </span>
          )}
          {row.location && (
            <span className="inline-flex items-center gap-1">
              <PinIcon className="h-3.5 w-3.5" />
              {row.location}
            </span>
          )}
        </div>
      </div>
      {open && <ClassDetailModal row={row} allRows={allRows} onClose={() => setOpen(false)} />}
    </>
  );
}
