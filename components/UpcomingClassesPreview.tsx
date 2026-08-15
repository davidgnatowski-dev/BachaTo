"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { DAY_LABELS, groupByDay, nextOccurrences, splitInstructors } from "@/lib/schedule";
import { useFavorites } from "@/lib/favorites";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { PersonIcon } from "@/components/icons";

const VIEWS = [
  { key: "lista", label: "Lista" },
  { key: "tydzien", label: "Tydzień" },
] as const;
type View = (typeof VIEWS)[number]["key"];

const PREVIEW_COUNT = 5;

export function UpcomingClassesPreview({ schedule }: { schedule: ClassRow[] }) {
  const [view, setView] = useState<View>("lista");
  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();

  const listItems = useMemo(() => nextOccurrences(schedule, new Date(), PREVIEW_COUNT), [schedule]);
  const weekGroups = useMemo(() => groupByDay(schedule), [schedule]);

  if (schedule.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Najbliższe zajęcia</h2>
        <div className="flex gap-1 rounded-full border border-line p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                view === v.key ? "bg-accent text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "lista" ? (
        <div className="flex flex-col divide-y divide-line">
          {listItems.map(({ row, label }) => {
            const favoriteId = `${row.school}-${row.id}`;
            const instructorNames = splitInstructors(row.instructor);
            const firstInstructorPhoto = row.instructorPhotos?.[instructorNames[0]];
            return (
              <div key={favoriteId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-14 shrink-0">
                  <p className="text-sm font-semibold tabular-nums text-accent">{row.startTime}</p>
                  <p className="text-[11px] text-muted">{label}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{row.title}</p>
                  <p className="truncate text-xs text-muted">
                    <Link href={`/szkoly/${encodeURIComponent(row.school)}`} className="hover:underline">
                      {row.school}
                    </Link>
                  </p>
                </div>
                {instructorNames.length > 0 && (
                  <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted sm:flex">
                    {firstInstructorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
                      <img src={firstInstructorPhoto} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <PersonIcon className="h-4 w-4" />
                    )}
                    {instructorNames.map((name, i) => (
                      <span key={name}>
                        {i > 0 && ", "}
                        <Link href={`/instruktorzy/${encodeURIComponent(name)}`} className="hover:text-zinc-200 hover:underline">
                          {name}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
                {row.level && (
                  <span className="hidden shrink-0 rounded-full border border-violet/50 px-1.5 py-0.5 text-[10px] font-semibold text-violet sm:inline-block">
                    {row.level}
                  </span>
                )}
                <div className="flex shrink-0 gap-1.5">
                  <PlusButton active={plannedClassIds.has(favoriteId)} onToggle={() => togglePlanClass(favoriteId)} />
                  <HeartButton active={likedClassIds.has(favoriteId)} onToggle={() => toggleLikeClass(favoriteId)} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {DAY_LABELS.map((label, idx) => {
            const dayRows = weekGroups.get(idx + 1) ?? [];
            return (
              <div key={label} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                <span className="w-16 shrink-0 pt-0.5 text-xs font-semibold text-zinc-300">{label}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {dayRows.length === 0 ? "brak zajęć" : `${dayRows.length} zajęć`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Link href="/grafik" className="text-xs font-semibold text-accent hover:text-accent-peach">
        Zobacz pełny grafik zajęć →
      </Link>
    </section>
  );
}
