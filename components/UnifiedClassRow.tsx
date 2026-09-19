"use client";

import { useState } from "react";
import type { ClassRow } from "@/lib/types";
import { formatDuration, splitInstructors } from "@/lib/schedule";
import { classifyLevel, levelShortCode, levelStyle } from "@/lib/level";
import { ChevronDownIcon } from "@/components/icons";
import { PlusButton } from "@/components/PlusButton";
import { HeartButton } from "@/components/HeartButton";

export function UnifiedClassRow({
  row,
  dateLabel,
  showTime = true,
  planned,
  liked,
  onPlan,
  onLike,
  onOpenDetails,
  planLabel,
  tone = "neutral",
}: {
  row: ClassRow;
  dateLabel?: string;
  showTime?: boolean;
  planned?: boolean;
  liked?: boolean;
  onPlan?: () => void;
  onLike?: () => void;
  onOpenDetails: () => void;
  planLabel?: string;
  tone?: "neutral" | "accent";
}) {
  const [expanded, setExpanded] = useState(false);
  const bucket = classifyLevel(row.level);
  const duration = formatDuration(row.startTime, row.endTime);
  const instructors = splitInstructors(row.instructor);

  return (
    <article className="py-2.5">
      <div className={`grid items-center gap-2.5 ${showTime ? "grid-cols-[3.2rem_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"}`}>
        {showTime && (
          <div className="shrink-0">
            {dateLabel && <p className="mb-0.5 truncate text-[9px] font-semibold uppercase text-accent">{dateLabel}</p>}
            <p className="font-heading text-sm font-semibold tabular-nums text-zinc-50">{row.startTime ?? "?"}</p>
            {row.endTime && <p className="mt-0.5 text-[9px] tabular-nums text-muted">{row.endTime}</p>}
          </div>
        )}

        <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 text-left" aria-expanded={expanded}>
          <p className="truncate font-heading text-sm font-semibold leading-snug text-zinc-50">{row.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {row.school}
            {row.level ? <span className={`font-semibold ${levelStyle(bucket).text}`}> · {levelShortCode(row.level, bucket)}</span> : null}
            {duration ? ` · ${duration}` : ""}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {onPlan && <PlusButton active={Boolean(planned)} onToggle={onPlan} label={planLabel} tone={tone} className={planLabel ? "" : tone === "accent" ? "!h-9 !w-9" : ""} />}
          {onLike && <HeartButton active={Boolean(liked)} onToggle={onLike} />}
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-label="Pokaż szczegóły zajęć" aria-expanded={expanded} className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-black/30 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-100">
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className={`${showTime ? "ml-[3.8rem]" : "ml-0"} mt-2 flex flex-col gap-1.5 border-l-2 border-accent/70 bg-zinc-950/40 px-3 py-2 text-xs text-muted`}>
          <p><span className="text-zinc-500">Godziny:</span> {row.startTime ?? "?"}{row.endTime ? `–${row.endTime}` : ""}</p>
          {instructors.length > 0 && <p><span className="text-zinc-500">Instruktorzy:</span> {instructors.join(", ")}</p>}
          {row.level && <p><span className="text-zinc-500">Poziom:</span> {row.level}</p>}
          {row.location && <p><span className="text-zinc-500">Sala:</span> {row.location}</p>}
          <button type="button" onClick={onOpenDetails} className="mt-1 self-start rounded-full border border-line px-3 py-1.5 font-semibold text-zinc-200 hover:border-accent hover:text-accent">Pełne informacje</button>
        </div>
      )}
    </article>
  );
}
