"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { DAY_LABELS, groupByDay, nextOccurrences, scheduleDatesForFilter, scheduleOccurrencesForDates } from "@/lib/schedule";
import { useFavorites } from "@/lib/favorites";
import { AddToPlanModal } from "@/components/AddToPlanModal";
import { ScheduleWeekGrid } from "@/components/ScheduleWeekGrid";
import { UnifiedClassRow } from "@/components/UnifiedClassRow";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { UnifiedClassDayGroup } from "@/components/UnifiedClassDayGroup";
import { toLocalIsoDate } from "@/lib/format";

const VIEWS = [
  { key: "lista", label: "Lista" },
  { key: "tydzien", label: "Tydzień" },
] as const;
type View = (typeof VIEWS)[number]["key"];

const PREVIEW_COUNT = 5;

/**
 * Two looks in one component (extending rather than forking, per the
 * homepage's logged-in/anonymous split): logged-in keeps the original
 * compact icon-only row with the Lista/Tydzień toggle; anonymous gets a
 * more prominent labeled "Dodaj do planu" button and an always-visible
 * level badge, and adding a class prompts login instead of saving silently.
 */
export function UpcomingClassesPreview({ schedule, loggedIn }: { schedule: ClassRow[]; loggedIn: boolean }) {
  const [view, setView] = useState<View>("lista");
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ClassRow | null>(null);
  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();

  const listItems = useMemo(() => nextOccurrences(schedule, new Date(), PREVIEW_COUNT), [schedule]);
  const homeGroups = useMemo(() => {
    const grouped = new Map<string, { date: Date; rows: ClassRow[] }>();
    for (const item of nextOccurrences(schedule, new Date(), 16)) {
      const key = toLocalIsoDate(item.when);
      const group = grouped.get(key) ?? { date: item.when, rows: [] };
      if (!group.rows.some((row) => row.id === item.row.id && row.school === item.row.school)) group.rows.push(item.row);
      grouped.set(key, group);
    }
    return Array.from(grouped.entries()).slice(0, 4);
  }, [schedule]);
  const weekGroups = useMemo(() => groupByDay(schedule), [schedule]);
  const homeWeekDates = useMemo(() => scheduleDatesForFilter("week", new Date()), []);
  const homeWeekGroups = useMemo(() => {
    const grouped = new Map<string, ClassRow[]>();
    for (const iso of homeWeekDates) grouped.set(iso, []);
    for (const occurrence of scheduleOccurrencesForDates(schedule, homeWeekDates)) {
      grouped.get(occurrence.dateIso)?.push(occurrence.row);
    }
    return grouped;
  }, [homeWeekDates, schedule]);

  if (schedule.length === 0) return null;

  function handleTogglePlan(favoriteId: string) {
    if (!loggedIn && !plannedClassIds.has(favoriteId)) {
      setAuthPromptOpen(true);
      return;
    }
    togglePlanClass(favoriteId);
  }

  if (!loggedIn) {
    return (
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-[radial-gradient(circle_at_top_right,rgba(255,106,24,.08),transparent_34%),rgba(24,24,27,.6)] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Najbliższe zajęcia</h2>
          <Link href="/grafik" className="shrink-0 text-xs font-semibold text-accent hover:text-accent-peach">Zobacz wszystkie →</Link>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          {homeGroups.map(([key, group], index) => <UnifiedClassDayGroup key={key} date={group.date} count={group.rows.length} defaultOpen={index === 0}>{group.rows.map((row) => { const favoriteId = `${row.school}-${row.id}`; return <UnifiedClassRow key={favoriteId} row={row} planned={plannedClassIds.has(favoriteId)} onPlan={() => handleTogglePlan(favoriteId)} tone="accent" onOpenDetails={() => setSelectedRow(row)} />; })}</UnifiedClassDayGroup>)}
        </div>

        <div className="hidden lg:block">
          <ScheduleWeekGrid
            activeDates={homeWeekDates}
            groups={homeWeekGroups}
            allRows={schedule}
            todayIso={homeWeekDates[0]}
            onPlanToggle={(row) => handleTogglePlan(`${row.school}-${row.id}`)}
          />
        </div>

        {authPromptOpen && <AddToPlanModal onClose={() => setAuthPromptOpen(false)} />}
        {selectedRow && <ClassDetailModal row={selectedRow} allRows={schedule} onClose={() => setSelectedRow(null)} />}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-[radial-gradient(circle_at_top_right,rgba(255,106,24,.08),transparent_34%),rgba(24,24,27,.6)] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Najbliższe zajęcia</h2>
        {loggedIn ? (
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
        ) : (
          <Link href="/grafik" className="shrink-0 text-xs font-semibold text-accent hover:text-accent-peach">
            Zobacz wszystkie →
          </Link>
        )}
      </div>

      {!loggedIn || view === "lista" ? (
        <div className="flex flex-col divide-y divide-line">
          {listItems.map(({ row, label }) => {
            const favoriteId = `${row.school}-${row.id}`;
            return <UnifiedClassRow key={favoriteId} row={row} dateLabel={label} planned={plannedClassIds.has(favoriteId)} liked={likedClassIds.has(favoriteId)} onPlan={() => togglePlanClass(favoriteId)} onLike={() => toggleLikeClass(favoriteId)} onOpenDetails={() => setSelectedRow(row)} />;
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

      {loggedIn && (
        <Link href="/grafik" className="text-xs font-semibold text-accent hover:text-accent-peach">
          Zobacz pełny grafik zajęć →
        </Link>
      )}

      {authPromptOpen && <AddToPlanModal onClose={() => setAuthPromptOpen(false)} />}
      {selectedRow && <ClassDetailModal row={selectedRow} allRows={schedule} onClose={() => setSelectedRow(null)} />}
    </section>
  );
}
