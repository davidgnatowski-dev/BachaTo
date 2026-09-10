"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ClassRow, EventRow } from "@/lib/types";
import { hasUserPreferences, type UserPreferences } from "@/lib/preferences";
import type { ActivityEntry } from "@/lib/activity";
import type { FavoritesSnapshot } from "@/lib/favorites";
import { attendanceKey, useActivity } from "@/lib/activity";
import { computeActivityStats, confirmedActivityOnly } from "@/lib/activityStats";
import { computeBadges, DEFAULT_WEEKLY_GOAL } from "@/lib/badges";
import { BadgesGrid } from "@/components/BadgesGrid";
import { LevelDot } from "@/components/LevelDot";
import { eventHref, eventProgramFavoriteId } from "@/lib/events";
import { toLocalIsoDate } from "@/lib/format";
import { nextOccurrences, pluralizeClasses, schoolTextClass, splitInstructors } from "@/lib/schedule";
import { useFavorites } from "@/lib/favorites";
import { HeartButton } from "@/components/HeartButton";
import { PlusButton } from "@/components/PlusButton";
import { ClassDetailModal } from "@/components/ClassDetailModal";
import { UpcomingEventsPreview } from "@/components/UpcomingEventsPreview";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  PersonIcon,
  PlusIcon,
} from "@/components/icons";
import { DashboardBottomNav, DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export interface DashboardUserClass {
  id: number;
  title: string;
  danceStyle: string | null;
  level: string | null;
  instructor: string | null;
  schoolName: string | null;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string | null;
  endTime: string | null;
}

type PlanFilter = "today" | "week" | "next";
type RecommendationFilter = "for-you" | "all" | "level";

interface PlanItem {
  key: string;
  when: Date;
  endTime?: string | null;
  title: string;
  school?: string | null;
  instructor?: string | null;
  level?: string | null;
  row?: ClassRow;
  favoriteId?: string;
  href?: string;
  kind: "class" | "event" | "session" | "custom";
}

interface RecommendedOccurrence {
  row: ClassRow;
  when: Date;
  matchReason: string | null;
}

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const MONTH_LABELS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -day);
}

function sameDay(a: Date, b: Date) {
  return toLocalIsoDate(a) === toLocalIsoDate(b);
}

function formatDayLabel(date: Date, now: Date) {
  if (sameDay(date, now)) return "Dziś";
  if (sameDay(date, addDays(now, 1))) return "Jutro";
  return date.toLocaleDateString("pl-PL", { weekday: "long" });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

function formatHours(hours: number) {
  return hours.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

function planPeriod(filter: PlanFilter, now: Date) {
  const today = startOfDay(now);
  const weekStart = startOfWeek(now);
  const nextWeekStart = addDays(weekStart, 7);
  const start = filter === "today" || filter === "week" ? today : nextWeekStart;
  const end = filter === "today" ? today : filter === "week" ? addDays(nextWeekStart, -1) : addDays(nextWeekStart, 6);
  const range = sameDay(start, end)
    ? start.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })
    : `${start.toLocaleDateString("pl-PL", { day: "numeric" })}–${end.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}`;

  if (filter === "today") return { eyebrow: "Dzisiaj w planie", title: "Twój dzień", shortLabel: "Dziś", range };
  if (filter === "next") return { eyebrow: "Następny tydzień", title: "Przyszły tydzień", shortLabel: "Następny tydzień", range };
  return { eyebrow: "Aktualny tydzień", title: "Twój tydzień", shortLabel: "Ten tydzień", range };
}

function durationMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return 60;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const duration = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return duration > 0 ? duration : 60;
}

function nextCustomOccurrence(row: DashboardUserClass, now: Date): Date | null {
  const time = row.startTime ?? "00:00";
  if (row.specificDate) {
    const occurrence = new Date(`${row.specificDate}T${time}:00`);
    return occurrence >= now ? occurrence : null;
  }
  if (!row.dayOfWeek) return null;
  const todayWeekday = ((now.getDay() + 6) % 7) + 1;
  let daysAhead = (row.dayOfWeek - todayWeekday + 7) % 7;
  if (daysAhead === 0 && time < now.toTimeString().slice(0, 5)) daysAhead = 7;
  const date = addDays(now, daysAhead);
  return new Date(`${toLocalIsoDate(date)}T${time}:00`);
}

function currentStreak(entries: ActivityEntry[]) {
  if (entries.length === 0) return 0;
  const weeks = new Set(entries.map((entry) => toLocalIsoDate(startOfWeek(new Date(`${entry.dateIso}T12:00:00`)))));
  let cursor = startOfWeek(new Date());
  if (!weeks.has(toLocalIsoDate(cursor))) cursor = addDays(cursor, -7);
  let streak = 0;
  while (weeks.has(toLocalIsoDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

function normalized(value?: string | null) {
  return (value ?? "").toLocaleLowerCase("pl").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function levelMatches(classLevel: string | null | undefined, preferred: string | null | undefined) {
  if (!preferred) return false;
  const row = normalized(classLevel);
  const target = normalized(preferred);
  if (!row) return false;
  if (target === "open") return row.includes("open") || row.includes("all");
  if (target === "beginner" || target === "poczatkujacy") return row.includes("poczat") || /\bp1\b/.test(row);
  if (target === "basic" || target === "podstawowy") return row.includes("podstaw") || /\bp[123]\b/.test(row);
  if (target === "intermediate" || target === "sredniozaawansowany") return row.includes("srednio") || /\bs[123]\b/.test(row);
  if (target === "advanced" || target === "zaawansowany") return row.includes("zaawans") || /\b[am][123]?\b/.test(row);
  return row.includes(target);
}

function recommendationScore(row: ClassRow, preferences: UserPreferences) {
  let score = 0;
  const reasons: string[] = [];
  if (preferences.levels.some((level) => levelMatches(row.level, level)) || levelMatches(row.level, preferences.level)) { score += 5; reasons.push("Twój poziom"); }
  if (preferences.formats.includes(row.format)) { score += 3; reasons.push(row.format === "solo" ? "lubisz solo" : "lubisz zajęcia w parach"); }
  if (preferences.days.includes(row.dayOfWeek ?? 0)) { score += 2; reasons.push("pasuje dzień"); }
  if (preferences.styles.some((style) => normalized(row.title).includes(normalized(style)) || normalized(row.danceStyle).includes(normalized(style)))) {
    score += 4;
    reasons.push("ulubiony styl");
  }
  return { score, reason: reasons.slice(0, 2).join(" · ") || null };
}

export function UserDashboard({
  schedule,
  events,
  customClasses,
  initialFavorites,
  initialActivity,
  attendedEvents,
  preferences,
}: {
  schedule: ClassRow[];
  events: EventRow[];
  customClasses: DashboardUserClass[];
  initialFavorites: FavoritesSnapshot;
  initialActivity: ActivityEntry[];
  attendedEvents: number;
  preferences: UserPreferences;
}) {
  const [planFilter, setPlanFilter] = useState<PlanFilter>("week");
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>("for-you");
  const [attendanceThanks, setAttendanceThanks] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);
  const favorites = useFavorites(initialFavorites);
  const activity = useActivity(initialActivity);
  const now = useMemo(() => new Date(), []);

  const allPlanItems = useMemo<PlanItem[]>(() => {
    const classItems = nextOccurrences(
      schedule.filter((row) => favorites.plannedClassIds.has(`${row.school}-${row.id}`)),
      now,
      100
    ).map(({ row, when }) => ({
      key: `class-${row.school}-${row.id}`,
      when,
      endTime: row.endTime,
      title: row.title,
      school: row.school,
      instructor: row.instructor,
      level: row.level,
      row,
      favoriteId: `${row.school}-${row.id}`,
      kind: "class" as const,
    }));

    const customItems = customClasses.flatMap((row) => {
      const when = nextCustomOccurrence(row, now);
      if (!when) return [];
      return [{
        key: `custom-${row.id}`,
        when,
        endTime: row.endTime,
        title: row.title,
        school: row.schoolName,
        instructor: row.instructor,
        level: row.level,
        kind: "custom" as const,
      }];
    });

    const eventItems = events
      .filter((event) => favorites.plannedEventIds.has(`${event.source}-${event.id}`))
      .map((event) => ({
        key: `event-${event.source}-${event.id}`,
        when: new Date(`${event.startDate}T00:00:00`),
        title: event.title,
        school: event.city,
        instructor: event.organizer,
        favoriteId: `${event.source}-${event.id}`,
        href: eventHref(event),
        kind: "event" as const,
      }))
      .filter((item) => item.when >= startOfDay(now));

    const sessionItems = events.flatMap((event) => (event.programItems ?? []).flatMap((item) => {
      const favoriteId = eventProgramFavoriteId(event.source, event.id, item.id);
      if (!favorites.plannedEventSessionIds.has(favoriteId)) return [];
      const when = new Date(item.startAt);
      if (when < startOfDay(now)) return [];
      return [{
        key: `session-${favoriteId}`,
        when,
        endTime: item.endAt ? new Date(item.endAt).toTimeString().slice(0, 5) : undefined,
        title: item.title,
        school: event.title,
        instructor: item.instructors.join(", ") || event.organizer,
        level: item.levels.join(", ") || undefined,
        favoriteId,
        href: `${eventHref(event)}#program`,
        kind: "session" as const,
      }];
    }));

    return [...classItems, ...customItems, ...eventItems, ...sessionItems].sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [customClasses, events, favorites.plannedClassIds, favorites.plannedEventIds, favorites.plannedEventSessionIds, now, schedule]);

  const visiblePlanItems = useMemo(() => {
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const nextWeekStart = addDays(weekStart, 7);
    const nextWeekEnd = addDays(nextWeekStart, 7);
    return allPlanItems.filter((item) => {
      if (planFilter === "today") return sameDay(item.when, today);
      if (planFilter === "week") return item.when >= today && item.when < nextWeekStart;
      return item.when >= nextWeekStart && item.when < nextWeekEnd;
    });
  }, [allPlanItems, now, planFilter]);

  const groupedPlanItems = useMemo(() => {
    const groups = new Map<string, PlanItem[]>();
    for (const item of visiblePlanItems) {
      const key = toLocalIsoDate(item.when);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [visiblePlanItems]);

  const recommendations = useMemo<RecommendedOccurrence[]>(() => {
    const all = nextOccurrences(schedule, now, 80).filter(
      ({ row }) => !favorites.plannedClassIds.has(`${row.school}-${row.id}`)
    );
    const nearTerm = all.filter(({ when }) => when < addDays(now, 3));
    const base = nearTerm.length >= 4 ? nearTerm : all;
    if (recommendationFilter === "all") return all.slice(0, 5).map((item) => ({ ...item, matchReason: null }));
    if (recommendationFilter === "level") {
      const preferredLevel = preferences.levels[0] ?? preferences.level ?? computeActivityStats(confirmedActivityOnly(activity.entries)).favoriteLevel;
      const matched = preferredLevel ? base.filter(({ row }) => levelMatches(row.level, preferredLevel)) : [];
      return (matched.length ? matched : base).slice(0, 5).map((item) => ({
        ...item,
        matchReason: preferredLevel && levelMatches(item.row.level, preferredLevel) ? `Poziom: ${preferredLevel}` : null,
      }));
    }
    return base
      .map((item) => ({ ...item, ...recommendationScore(item.row, preferences) }))
      .sort((a, b) => b.score - a.score || a.when.getTime() - b.when.getTime())
      .slice(0, 5)
      .map(({ reason, row, when }) => ({ row, when, matchReason: reason }));
  }, [activity.entries, favorites.plannedClassIds, now, preferences, recommendationFilter, schedule]);

  const favoriteClasses = useMemo(
    () => nextOccurrences(schedule.filter((row) => favorites.likedClassIds.has(`${row.school}-${row.id}`)), now, 6),
    [favorites.likedClassIds, now, schedule]
  );

  // Every planned-class occurrence from the last 14 days (up to today) — the
  // raw material for the "confirm you were there" prompt. Nothing is written
  // automatically: an occurrence only becomes attendance when the user says so.
  const recentPlannedOccurrences = useMemo(() => {
    const todayStart = startOfDay(now);
    const windowStart = addDays(todayStart, -14);
    const out: { row: ClassRow; occurrence: Date; key: string }[] = [];
    for (const row of schedule) {
      if (!favorites.plannedClassIds.has(`${row.school}-${row.id}`)) continue;
      if (row.specificDate) {
        const d = new Date(`${row.specificDate}T00:00:00`);
        if (d >= windowStart && d < todayStart) out.push({ row, occurrence: d, key: attendanceKey(row, d) });
        continue;
      }
      if (!row.dayOfWeek) continue;
      for (let d = addDays(todayStart, -1); d >= windowStart; d = addDays(d, -1)) {
        if (((d.getDay() + 6) % 7) + 1 === row.dayOfWeek) {
          out.push({ row, occurrence: d, key: attendanceKey(row, d) });
        }
      }
    }
    return out.sort((a, b) => b.occurrence.getTime() - a.occurrence.getTime());
  }, [favorites.plannedClassIds, now, schedule]);

  const pendingConfirmations = recentPlannedOccurrences
    .filter((item) => !activity.attendedKeys.has(item.key) && !activity.skippedKeys.has(item.key))
    .slice(0, 15);

  const selectedPlan = visiblePlanItems.filter((item) => item.kind !== "event");
  const selectedMinutes = selectedPlan.reduce((sum, item) => sum + durationMinutes(item.when.toTimeString().slice(0, 5), item.endTime), 0);
  const selectedHours = Math.round((selectedMinutes / 60) * 10) / 10;
  const selectedSchools = new Set(selectedPlan.map((item) => item.school).filter(Boolean));
  const selectedInstructors = new Set(selectedPlan.flatMap((item) => splitInstructors(item.instructor ?? undefined)));
  const selectedPeriod = planPeriod(planFilter, now);
  // Provisional auto-marked attendances are excluded from every number until confirmed.
  const confirmedEntries = confirmedActivityOnly(activity.entries);
  const stats = computeActivityStats(confirmedEntries);
  const schoolsDanced = new Set(confirmedEntries.map((entry) => entry.school));
  const instructorsDanced = new Set(confirmedEntries.flatMap((entry) => splitInstructors(entry.instructor)));
  const streak = currentStreak(confirmedEntries);
  const badges = computeBadges({
    activityDates: confirmedEntries.map((entry) => entry.dateIso),
    totalHours: stats.totalHours,
    schoolCount: schoolsDanced.size,
    eventCount: attendedEvents,
    streak,
  });
  const goalDone = stats.thisWeekCount;

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <DashboardSidebar streak={streak} />
      <main className="min-w-0 flex-1 pb-24 lg:pb-10">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10 px-4 py-6 sm:px-6 xl:px-8">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <MyPlanSection
              groups={groupedPlanItems}
              totalSaved={allPlanItems.length}
              filter={planFilter}
              setFilter={setPlanFilter}
              now={now}
              likedClassIds={favorites.likedClassIds}
              onLikeClass={favorites.toggleLikeClass}
              onRemoveClass={favorites.togglePlanClass}
              onRemoveEvent={favorites.togglePlanEvent}
              onRemoveSession={favorites.togglePlanEventSession}
              summaryLabel={selectedPeriod.shortLabel}
              summaryHours={selectedHours}
              summaryClasses={selectedPlan.length}
              shareItems={visiblePlanItems}
              onOpenClass={setSelectedClass}
            />

            <aside className="flex min-w-0 flex-col gap-4">
              {attendanceThanks && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  Dzięki! Twoje statystyki są zaktualizowane.
                </div>
              )}
              {pendingConfirmations.length > 0 && (
                <PendingConfirmationsCard
                  items={pendingConfirmations}
                  now={now}
                  onConfirm={(row, occurrence) => {
                    activity.setAttended(row, occurrence, true);
                    setAttendanceThanks(true);
                  }}
                  onSkip={(key) => activity.markEntrySkipped(key)}
                />
              )}
              <WeeklySummaryCard
                eyebrow={selectedPeriod.eyebrow}
                title={selectedPeriod.title}
                range={selectedPeriod.range}
                hours={selectedHours}
                classes={selectedPlan.length}
                schools={selectedSchools.size}
                instructors={selectedInstructors.size}
                streak={streak}
              />
              <section className="rounded-2xl border border-line bg-zinc-900/45 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet">Cel tygodnia</p>
                  <p className="text-xs text-muted">{goalDone} / {DEFAULT_WEEKLY_GOAL}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.round((goalDone / DEFAULT_WEEKLY_GOAL) * 100))}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  {goalDone >= DEFAULT_WEEKLY_GOAL ? "Cel osiągnięty 🎉" : `Jeszcze ${DEFAULT_WEEKLY_GOAL - goalDone} do celu tygodnia.`}
                </p>
                <div className="mt-4 border-t border-line pt-4">
                  <BadgesGrid badges={badges} compact />
                  <Link href="/podsumowanie" className="mt-3 inline-flex text-xs font-semibold text-accent hover:text-accent-peach">
                    Wszystkie odznaki →
                  </Link>
                </div>
              </section>
              <MiniCalendar items={allPlanItems} onOpenClass={setSelectedClass} />
            </aside>
          </div>

          <FavoriteClassesSection
            favorites={favoriteClasses}
            plannedClassIds={favorites.plannedClassIds}
            onPlan={favorites.togglePlanClass}
            onLike={favorites.toggleLikeClass}
            now={now}
            onOpenClass={setSelectedClass}
          />

          <RecommendedClassesSection
            recommendations={recommendations}
            activeFilter={recommendationFilter}
            onFilter={setRecommendationFilter}
            plannedClassIds={favorites.plannedClassIds}
            likedClassIds={favorites.likedClassIds}
            onPlan={favorites.togglePlanClass}
            onLike={favorites.toggleLikeClass}
            now={now}
            preferencesComplete={hasUserPreferences(preferences)}
            onOpenClass={setSelectedClass}
          />

          <UpcomingEventsPreview events={events} />

          <DashboardStatsSection
            totalClasses={stats.totalClasses}
            totalHours={stats.totalHours}
            schools={schoolsDanced.size}
            instructors={instructorsDanced.size}
            streak={streak}
            monthCount={stats.thisMonthCount}
            attendedEvents={attendedEvents}
          />
        </div>
      </main>
      {selectedClass && <ClassDetailModal row={selectedClass} allRows={schedule} onClose={() => setSelectedClass(null)} />}
      <DashboardBottomNav />
    </div>
  );
}

function MyPlanSection({
  groups,
  totalSaved,
  filter,
  setFilter,
  now,
  likedClassIds,
  onLikeClass,
  onRemoveClass,
  onRemoveEvent,
  onRemoveSession,
  summaryLabel,
  summaryHours,
  summaryClasses,
  shareItems,
  onOpenClass,
}: {
  groups: [string, PlanItem[]][];
  totalSaved: number;
  filter: PlanFilter;
  setFilter: (filter: PlanFilter) => void;
  now: Date;
  likedClassIds: Set<string>;
  onLikeClass: (id: string) => void;
  onRemoveClass: (id: string) => void;
  onRemoveEvent: (id: string) => void;
  onRemoveSession: (id: string) => void;
  summaryLabel: string;
  summaryHours: number;
  summaryClasses: number;
  shareItems: PlanItem[];
  onOpenClass: (row: ClassRow) => void;
}) {
  return (
    <section id="moj-plan" className="scroll-mt-4 overflow-hidden rounded-2xl border border-line bg-zinc-900/45 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Twój najbliższy plan</p>
            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-zinc-50">Mój plan</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
            <div className="flex items-center gap-3"><SharePlanButton items={shareItems} label={summaryLabel} /><Link href="/konto" className="text-xs font-semibold text-zinc-400 hover:text-accent sm:text-sm">Ustawienia →</Link></div>
            <span className="rounded-full border border-violet/35 bg-violet/10 px-2.5 py-1 text-[10px] font-semibold text-violet sm:text-xs">
              {summaryLabel}: {summaryClasses} {pluralizeClasses(summaryClasses)} · {formatHours(summaryHours)} h
            </span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-950/70 p-1 [scrollbar-width:none]">
          {[
            { key: "today", label: "Dziś" },
            { key: "week", label: "Ten tydzień" },
            { key: "next", label: "Następny tydzień" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as PlanFilter)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${
                filter === item.key ? "bg-accent text-white shadow-sm" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet/10 text-violet">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-heading text-lg font-semibold text-zinc-100">
            {totalSaved > 0 ? `Brak aktywności: ${summaryLabel.toLocaleLowerCase("pl")}` : "Twój plan jest jeszcze pusty"}
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
            {totalSaved > 0 ? `Masz ${totalSaved} zapisanych pozycji w innych terminach. Wybierz inny okres powyżej.` : "Dodaj pierwsze zajęcia albo wydarzenie taneczne."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2"><Link href="/grafik" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">Znajdź zajęcia</Link><Link href="/eventy" className="rounded-full border border-violet/50 px-5 py-2.5 text-sm font-semibold text-violet hover:bg-violet/10">Znajdź wydarzenia</Link></div>
        </div>
      ) : (
        <div>
          {groups.map(([date, items]) => {
            const day = new Date(`${date}T12:00:00`);
            return (
              <div key={date} className="grid border-b border-line last:border-b-0 sm:grid-cols-[92px_minmax(0,1fr)]">
                <div className="border-b border-line/70 bg-zinc-950/35 px-4 py-3 sm:border-b-0 sm:border-r sm:px-5 sm:py-4">
                  <p className={`text-sm font-semibold ${sameDay(day, now) ? "text-accent" : "text-zinc-200"}`}>{formatDayLabel(day, now)}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted">{formatShortDate(day)}</p>
                </div>
                <div className="divide-y divide-line">
                  {items.map((item) => (
                    <PlanClassRow
                      key={item.key}
                      item={item}
                      liked={Boolean(item.favoriteId && likedClassIds.has(item.favoriteId))}
                      onLike={() => item.favoriteId && onLikeClass(item.favoriteId)}
                      onRemove={() => {
                        if (!item.favoriteId) return;
                        if (item.kind === "event") onRemoveEvent(item.favoriteId);
                        else if (item.kind === "session") onRemoveSession(item.favoriteId);
                        else onRemoveClass(item.favoriteId);
                      }}
                      onOpenClass={onOpenClass}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
        <Link href="/grafik" className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 px-4 py-3 text-sm font-semibold text-accent hover:border-accent hover:bg-accent/5">
          <PlusIcon className="h-4 w-4" />
          Dodaj zajęcia do planu
        </Link>
        <Link href="/eventy" className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet/50 px-4 py-3 text-sm font-semibold text-violet hover:border-violet hover:bg-violet/5"><PlusIcon className="h-4 w-4" />Dodaj wydarzenie do planu</Link>
      </div>
    </section>
  );
}

function SharePlanButton({ items, label }: { items: PlanItem[]; label: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const lines = items.map((item) => `${item.when.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })} ${item.when.toTimeString().slice(0, 5)} — ${item.title}${item.school ? ` (${item.school})` : ""}`);
    const text = `Mój plan Bachato — ${label}\n${lines.length ? lines.join("\n") : "Brak zajęć w tym okresie."}`;
    try {
      if (navigator.share) await navigator.share({ title: "Mój plan Bachato", text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  return <button type="button" onClick={share} className="text-xs font-semibold text-zinc-400 hover:text-accent">{copied ? "Skopiowano ✓" : "Udostępnij"}</button>;
}

function PlanClassRow({ item, liked, onLike, onRemove, onOpenClass }: { item: PlanItem; liked: boolean; onLike: () => void; onRemove: () => void; onOpenClass: (row: ClassRow) => void }) {
  const names = splitInstructors(item.instructor ?? undefined);
  const photo = item.row?.instructorPhotos?.[names[0]];
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <div className="w-12 shrink-0 self-start pt-0.5">
        <p className="font-heading text-base font-semibold tabular-nums text-zinc-50">{item.when.toTimeString().slice(0, 5)}</p>
        {item.endTime && <p className="mt-0.5 text-[11px] tabular-nums text-muted">do {item.endTime}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LevelDot level={item.level} className="align-middle" />
          {item.href ? <Link href={item.href} className="truncate text-sm font-semibold text-zinc-100 hover:text-accent sm:text-base">{item.title}</Link> : item.row ? <button type="button" onClick={() => onOpenClass(item.row!)} className="truncate text-left text-sm font-semibold text-zinc-100 hover:text-accent sm:text-base" aria-label={`Otwórz szczegóły zajęć ${item.title}`}>{item.title}</button> : <p className="truncate text-sm font-semibold text-zinc-100 sm:text-base">{item.title}</p>}
          {item.level && <span className="rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[10px] font-semibold text-violet">{item.level}</span>}
        </div>
        <p className="mt-1 truncate text-xs text-muted">
          {item.school && <span className={schoolTextClass(item.school)}>{item.school}</span>}
          {item.school && item.instructor ? " · " : ""}
          {item.instructor}
        </p>
      </div>
      {names.length > 0 && (
        photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- source URLs come from the existing school data
          <img src={photo} alt="" className="hidden h-8 w-8 shrink-0 rounded-full object-cover sm:block" />
        ) : (
          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-muted sm:flex"><PersonIcon className="h-4 w-4" /></span>
        )
      )}
      {item.kind === "class" && <HeartButton active={liked} onToggle={onLike} />}
      <details className="relative shrink-0">
        <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 [&::-webkit-details-marker]:hidden" aria-label="Więcej opcji">•••</summary>
        <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-line bg-zinc-950 p-1 shadow-xl">
          {item.kind === "custom" ? (
            <Link href="/konto" className="block rounded-md px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-900">Edytuj w koncie</Link>
          ) : (
            <button type="button" onClick={onRemove} className="block w-full rounded-md px-2.5 py-2 text-left text-xs text-red-300 hover:bg-zinc-900">Usuń z planu</button>
          )}
        </div>
      </details>
    </div>
  );
}

function PendingConfirmationsCard({
  items,
  now,
  onConfirm,
  onSkip,
}: {
  items: { row: ClassRow; occurrence: Date; key: string }[];
  now: Date;
  onConfirm: (row: ClassRow, occurrence: Date) => void;
  onSkip: (key: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-accent/30 bg-accent/[0.07] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Do potwierdzenia ({items.length})</p>
      <h2 className="mt-1 font-heading text-base font-semibold text-zinc-50">Byłeś/aś na tych zajęciach?</h2>
      <p className="mt-1 text-xs text-muted">Z Twojego planu, ostatnie 14 dni. Liczą się tylko potwierdzone.</p>
      <ul className="mt-3 flex flex-col divide-y divide-accent/15">
        {items.map((item) => (
          <li key={item.key} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{item.row.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDayLabel(item.occurrence, now)} {formatShortDate(item.occurrence)}
                {item.row.startTime ? ` · ${item.row.startTime}` : ""} · <span className={schoolTextClass(item.row.school)}>{item.row.school}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onConfirm(item.row, item.occurrence)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark">Byłem/am</button>
              <button type="button" onClick={() => onSkip(item.key)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500">Nie byłem/am</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeeklySummaryCard({ eyebrow, title, range, hours, classes, schools, instructors, streak }: { eyebrow: string; title: string; range: string; hours: number; classes: number; schools: number; instructors: number; streak: number }) {
  const progress = Math.min(100, Math.round((hours / 8) * 100));
  return (
    <section className="rounded-2xl border border-line bg-zinc-900/45 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet">{eyebrow}</p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{range}</p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#9c4dff ${progress}%, #272b36 ${progress}% 100%)` }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#11141d] text-center">
            <span className="font-heading text-sm font-semibold text-zinc-100">{formatHours(hours)} h</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[{ value: classes, label: "zajęcia" }, { value: schools, label: "szkoły" }, { value: instructors, label: "instruktorzy" }].map((item) => (
          <div key={item.label} className="rounded-lg bg-zinc-950/60 px-2 py-2.5 text-center"><p className="font-heading text-lg font-semibold text-zinc-100">{item.value}</p><p className="text-[10px] text-muted">{item.label}</p></div>
        ))}
      </div>
      {streak > 0 && <p className="mt-3 text-xs font-medium text-accent">🔥 {streak} {streak === 1 ? "tydzień" : "tygodni"} z rzędu</p>}
    </section>
  );
}

function FavoriteClassesSection({ favorites, plannedClassIds, onPlan, onLike, now, onOpenClass }: { favorites: ReturnType<typeof nextOccurrences>; plannedClassIds: Set<string>; onPlan: (id: string) => void; onLike: (id: string) => void; now: Date; onOpenClass: (row: ClassRow) => void }) {
  return (
    <section id="ulubione" className="scroll-mt-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet"><HeartIcon className="h-3.5 w-3.5" filled />Polubione zajęcia</p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Zapisane na później</h2>
        </div>
        {favorites.length > 0 && <span className="text-xs font-medium text-muted">{favorites.length} {pluralizeClasses(favorites.length)}</span>}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-zinc-900/45">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-9 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet/10 text-violet"><HeartIcon className="h-5 w-5" /></span>
            <h3 className="mt-3 font-heading text-base font-semibold text-zinc-100">Tu pojawią się polubione zajęcia</h3>
            <p className="mt-1 max-w-md text-sm text-muted">Kliknij serduszko przy zajęciach, a łatwo wrócisz do nich i dodasz je do planu.</p>
            <Link href="/grafik" className="mt-4 rounded-full border border-violet/40 px-4 py-2 text-xs font-semibold text-violet hover:bg-violet/10">Przeglądaj zajęcia</Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {favorites.map(({ row, when }) => {
              const id = `${row.school}-${row.id}`;
              return (
                <div key={id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-5">
                  <div className="w-16 shrink-0">
                    <p className="text-xs font-semibold text-violet">{formatDayLabel(when, now)}</p>
                    <p className="font-heading text-base font-semibold tabular-nums text-zinc-100">{row.startTime}</p>
                  </div>
                  <div className="min-w-0 flex-[1_1_calc(100%-5rem)] sm:flex-1">
                    <button type="button" onClick={() => onOpenClass(row)} className="block max-w-full truncate text-left text-sm font-semibold text-zinc-100 hover:text-accent" aria-label={`Otwórz szczegóły zajęć ${row.title}`}>{row.title}</button>
                    <p className="mt-0.5 truncate text-xs text-muted"><span className={schoolTextClass(row.school)}>{row.school}</span>{row.instructor ? ` · ${row.instructor}` : ""}</p>
                    <button type="button" onClick={() => onOpenClass(row)} className="mt-1 text-[11px] font-semibold text-violet hover:text-accent">Szczegóły zajęć →</button>
                  </div>
                  {row.level && <span className="hidden rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[10px] font-semibold text-violet md:inline-flex">{row.level}</span>}
                  <div className="ml-16 flex basis-[calc(100%-4rem)] items-center gap-2 sm:ml-0 sm:basis-auto">
                    <PlusButton active={plannedClassIds.has(id)} onToggle={() => onPlan(id)} label="Dodaj do planu" className="!border-accent/40 !text-accent hover:!border-accent" />
                    <HeartButton active onToggle={() => onLike(id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function MiniCalendar({ items, onOpenClass }: { items: PlanItem[]; onOpenClass: (row: ClassRow) => void }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(today));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const classDates = new Set(items.filter((item) => item.kind === "class" || item.kind === "custom").map((item) => toLocalIsoDate(item.when)));
  const eventDates = new Set(items.filter((item) => item.kind === "event" || item.kind === "session").map((item) => toLocalIsoDate(item.when)));
  const selectedIso = toLocalIsoDate(selectedDate);
  const selectedItems = items.filter((item) => toLocalIsoDate(item.when) === selectedIso).sort((a, b) => a.when.getTime() - b.when.getTime());
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, index) => new Date(year, month, index + 1))];

  function moveMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setCursor(next);
    setSelectedDate(next);
  }

  function goToday() {
    const current = startOfDay(new Date());
    setCursor(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDate(current);
  }

  return (
    <section id="kalendarz" className="hidden scroll-mt-4 rounded-2xl border border-line bg-zinc-900/45 p-4 sm:block">
      <div className="flex items-center justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet">Plan miesiąca</p><h2 className="mt-1 font-heading text-base font-semibold text-zinc-50">Twój kalendarz</h2></div>
        <div className="flex items-center gap-1 text-xs text-zinc-300">
          <button type="button" onClick={() => moveMonth(-1)} className="rounded-full p-1 hover:bg-zinc-800" aria-label="Poprzedni miesiąc"><ChevronLeftIcon className="h-4 w-4" /></button>
          <span className="w-24 text-center">{MONTH_LABELS[month]} {year}</span>
          <button type="button" onClick={() => moveMonth(1)} className="rounded-full p-1 hover:bg-zinc-800" aria-label="Następny miesiąc"><ChevronRightIcon className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-[10px]">
        {WEEKDAY_LABELS.map((day) => <span key={day} className="pb-1 text-muted">{day}</span>)}
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;
          const iso = toLocalIsoDate(date);
          const isToday = sameDay(date, today);
          const isSelected = sameDay(date, selectedDate);
          return (
            <button type="button" key={iso} onClick={() => setSelectedDate(date)} aria-label={`Pokaż plan na ${date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`} aria-pressed={isSelected} className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isSelected ? "bg-accent font-semibold text-white shadow-[0_0_0_3px_rgba(255,107,0,.15)]" : isToday ? "border border-accent/60 font-semibold text-accent" : "text-zinc-300 hover:bg-zinc-800"}`}>
              {date.getDate()}
              {(classDates.has(iso) || eventDates.has(iso)) && <span className="absolute bottom-0.5 flex gap-0.5">{classDates.has(iso) && <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-violet"}`} />}{eventDates.has(iso) && <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-zinc-200" : "bg-zinc-500"}`} />}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold capitalize text-zinc-200">{selectedDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}</p><button type="button" onClick={goToday} className="text-[11px] font-semibold text-violet hover:text-accent">Dzisiaj</button></div>
        {selectedItems.length === 0 ? <p className="mt-2 text-xs leading-5 text-muted">Nie masz nic zaplanowanego na ten dzień.</p> : <div className="mt-2 divide-y divide-line/70">{selectedItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2 py-2">
            <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-accent">{item.when.toTimeString().slice(0, 5)}</span>
            <div className="min-w-0 flex-1">{item.href ? <Link href={item.href} className="block truncate text-xs font-semibold text-zinc-200 hover:text-accent">{item.title}</Link> : item.row ? <button type="button" onClick={() => onOpenClass(item.row!)} className="block max-w-full truncate text-left text-xs font-semibold text-zinc-200 hover:text-accent">{item.title}</button> : <Link href="/konto" className="block truncate text-xs font-semibold text-zinc-200 hover:text-accent">{item.title}</Link>}<p className={`truncate text-[10px] ${item.school ? schoolTextClass(item.school) : "text-muted"}`}>{item.school ?? (item.kind === "event" ? "Wydarzenie" : "Twój plan")}</p></div>
          </div>
        ))}</div>}
        <div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-3 text-[10px] text-muted"><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet" />zajęcia</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />wydarzenia</span></span><a href="#moj-plan" className="text-[11px] font-semibold text-zinc-400 hover:text-violet">Przejdź do planu →</a></div>
      </div>
    </section>
  );
}

function RecommendedClassesSection({ recommendations, activeFilter, onFilter, plannedClassIds, likedClassIds, onPlan, onLike, now, preferencesComplete, onOpenClass }: { recommendations: RecommendedOccurrence[]; activeFilter: RecommendationFilter; onFilter: (filter: RecommendationFilter) => void; plannedClassIds: Set<string>; likedClassIds: Set<string>; onPlan: (id: string) => void; onLike: (id: string) => void; now: Date; preferencesComplete: boolean; onOpenClass: (row: ClassRow) => void }) {
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Dopasowane do Ciebie</p><h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Propozycje na dziś i jutro dla Ciebie</h2></div>
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {[{ key: "for-you", label: "Dla Ciebie" }, { key: "all", label: "Wszystkie zajęcia" }, { key: "level", label: "Pasuje do poziomu" }].map((item) => (
            <button key={item.key} type="button" onClick={() => onFilter(item.key as RecommendationFilter)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${activeFilter === item.key ? "border-accent bg-accent/10 text-accent" : "border-line text-zinc-400 hover:text-zinc-100"}`}>{item.label}</button>
          ))}
        </div>
      </div>
      {!preferencesComplete && activeFilter !== "all" && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet/25 bg-violet/[0.07] px-4 py-3 text-xs text-zinc-300"><span>Uzupełnij poziom, dni i format, aby propozycje były naprawdę osobiste.</span><Link href="/konto#preferencje" className="font-semibold text-violet hover:text-accent">Ustaw preferencje →</Link></div>}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-zinc-900/45">
        {recommendations.length === 0 ? <p className="p-8 text-center text-sm text-muted">Brak nowych propozycji na najbliższe dni.</p> : <div className="divide-y divide-line">
          {recommendations.map(({ row, when, matchReason }) => {
            const id = `${row.school}-${row.id}`;
            return (
              <div key={id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-5">
                <div className="w-16 shrink-0"><p className="text-xs font-semibold text-accent">{formatDayLabel(when, now)}</p><p className="font-heading text-base font-semibold tabular-nums text-zinc-100">{row.startTime}</p></div>
                <div className="min-w-0 flex-[1_1_calc(100%-5rem)] sm:flex-1"><button type="button" onClick={() => onOpenClass(row)} className="block max-w-full truncate text-left text-sm font-semibold text-zinc-100 hover:text-accent" aria-label={`Otwórz szczegóły zajęć ${row.title}`}>{row.title}</button><p className="mt-0.5 truncate text-xs text-muted"><span className={schoolTextClass(row.school)}>{row.school}</span>{row.instructor ? ` · ${row.instructor}` : ""}</p><button type="button" onClick={() => onOpenClass(row)} className="mt-1 text-[11px] font-semibold text-violet hover:text-accent">Szczegóły zajęć →</button></div>
                <div className="ml-16 flex basis-[calc(100%-4rem)] items-center gap-2 sm:ml-0 sm:basis-auto">
                  {row.level && <span className="hidden rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[10px] font-semibold text-violet md:inline-flex">{row.level}</span>}
                  {activeFilter === "level" && <span className="hidden rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400 xl:inline-flex">Pasuje do poziomu</span>}
                  {activeFilter === "for-you" && matchReason && <span className="hidden rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300 xl:inline-flex">{matchReason}</span>}
                  <PlusButton active={plannedClassIds.has(id)} onToggle={() => onPlan(id)} label="Dodaj do planu" className="!border-accent/40 !text-accent hover:!border-accent" />
                  <HeartButton active={likedClassIds.has(id)} onToggle={() => onLike(id)} />
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </section>
  );
}

function DashboardStatsSection({ totalClasses, totalHours, schools, instructors, streak, monthCount, attendedEvents }: { totalClasses: number; totalHours: number; schools: number; instructors: number; streak: number; monthCount: number; attendedEvents: number }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Twój progres</p><h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Twoje statystyki</h2></div><Link href="/podsumowanie" className="text-xs font-semibold text-accent hover:text-accent-peach sm:text-sm">Zobacz podsumowanie →</Link></div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[{ value: totalClasses, label: "zajęć", note: monthCount > 0 ? `${monthCount} w tym miesiącu` : "Zacznij dziś" }, { value: `${totalHours} h`, label: "tańca", note: "Łączny czas" }, { value: attendedEvents, label: "wydarzeń", note: "Zaliczonych" }, { value: schools, label: "szkół", note: "Odwiedzonych" }, { value: instructors, label: "instruktorów", note: "Poznanych" }, { value: streak, label: "tygodni z rzędu", note: streak > 0 ? "🔥 Trzymaj rytm" : "Pierwsza passa czeka" }].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-zinc-900/45 p-4"><p className="font-heading text-2xl font-semibold text-zinc-50">{item.value}</p><p className="mt-1 text-xs font-medium text-zinc-300">{item.label}</p><p className="mt-3 text-[10px] text-muted">{item.note}</p></div>
        ))}
      </div>
    </section>
  );
}
