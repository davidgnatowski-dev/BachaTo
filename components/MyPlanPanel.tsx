"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ClassRow, EventRow } from "@/lib/types";
import { DAY_LABELS, nextOccurrences, schoolTextClass, splitInstructors } from "@/lib/schedule";
import { useFavorites } from "@/lib/favorites";
import { PlusButton } from "@/components/PlusButton";
import { LevelBadge } from "@/components/LevelDot";

interface PlanItem {
  key: string;
  when: Date;
  label: string;
  title: string;
  /** Class items carry school/instructor separately so they can link to profiles; event items fall back to a plain sublabel. */
  school?: string;
  instructorNames?: string[];
  sublabel?: string;
  level?: string;
  onRemove: () => void;
}

function eventLabel(startDate: string, now: Date): string {
  const diffDays = Math.round((new Date(`${startDate}T00:00:00`).getTime() - new Date(now.toDateString()).getTime()) / 86400000);
  if (diffDays === 0) return "Dzisiaj";
  if (diffDays === 1) return "Jutro";
  const d = new Date(`${startDate}T00:00:00`);
  return DAY_LABELS[(d.getDay() + 6) % 7];
}

export function MyPlanPanel({ schedule, events }: { schedule: ClassRow[]; events: EventRow[] }) {
  const { plannedClassIds, plannedEventIds, togglePlanClass, togglePlanEvent } = useFavorites();

  const items = useMemo<PlanItem[]>(() => {
    const now = new Date();

    const plannedClasses = schedule.filter((r) => plannedClassIds.has(`${r.school}-${r.id}`));
    const classItems: PlanItem[] = nextOccurrences(plannedClasses, now, 50).map(({ row, when, label }) => ({
      key: `class-${row.school}-${row.id}`,
      when,
      label,
      title: row.title,
      school: row.school,
      instructorNames: splitInstructors(row.instructor),
      level: row.level,
      onRemove: () => togglePlanClass(`${row.school}-${row.id}`),
    }));

    const eventItems: PlanItem[] = events
      .filter((r) => plannedEventIds.has(`${r.source}-${r.id}`))
      .map((row) => ({
        key: `event-${row.source}-${row.id}`,
        when: new Date(`${row.startDate}T00:00:00`),
        label: eventLabel(row.startDate, now),
        title: row.title,
        sublabel: [row.city, row.organizer].filter(Boolean).join(" · "),
        onRemove: () => togglePlanEvent(`${row.source}-${row.id}`),
      }));

    return [...classItems, ...eventItems].sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [schedule, events, plannedClassIds, plannedEventIds, togglePlanClass, togglePlanEvent]);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
      <div className="flex items-center gap-2">
        <Image src="/brand/icons/plan.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Mój plan</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted">
          Kliknij <span className="text-violet">+</span> przy zajęciach lub wydarzeniu, żeby dodać je do planu — zapisuje
          się w tej przeglądarce, bez konta.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="w-14 shrink-0">
                <p className="text-xs font-semibold uppercase text-accent">{item.label}</p>
                {item.when.getHours() + item.when.getMinutes() > 0 && (
                  <p className="text-[11px] tabular-nums text-muted">
                    {item.when.getHours().toString().padStart(2, "0")}:{item.when.getMinutes().toString().padStart(2, "0")}
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                {item.school ? (
                  <p className="truncate text-xs text-muted">
                    <Link href={`/szkoly/${encodeURIComponent(item.school)}`} className={`${schoolTextClass(item.school)} hover:underline`}>
                      {item.school}
                    </Link>
                    {item.instructorNames && item.instructorNames.length > 0 && (
                      <>
                        {" · "}
                        {item.instructorNames.map((name, i) => (
                          <span key={name}>
                            {i > 0 && ", "}
                            <Link href={`/instruktorzy/${encodeURIComponent(name)}`} className="hover:text-zinc-200 hover:underline">
                              {name}
                            </Link>
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                ) : (
                  item.sublabel && <p className="truncate text-xs text-muted">{item.sublabel}</p>
                )}
              </div>
              <LevelBadge level={item.level} className="shrink-0" />
              <PlusButton active onToggle={item.onRemove} />
            </div>
          ))}
        </div>
      )}

      <Link
        href="/grafik"
        className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-semibold text-violet hover:text-violet/80"
      >
        + Dodaj do planu
      </Link>
    </section>
  );
}
