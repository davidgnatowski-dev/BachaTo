"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ClassFormat, ClassRow, School } from "@/lib/types";
import { hasUserPreferences, matchesUserPreferences, type UserPreferences } from "@/lib/preferences";
import { DAY_LABELS, displayDayOfWeek, groupByDay, pluralizeClasses, schoolTextClass, splitInstructors } from "@/lib/schedule";
import { toLocalIsoDate } from "@/lib/format";
import { SCHOOL_NAMES } from "@/lib/schools";
import { ClassCard } from "@/components/ClassCard";
import { CompactClassRow } from "@/components/CompactClassRow";
import {
  classifyLevel,
  levelStyle,
  levelDotClass,
  LEVEL_BUCKET_ORDER,
  LEVEL_BUCKET_LABELS,
  type LevelBucket,
} from "@/lib/level";

const ALL = "all";

const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const DAY_CHIP_LABELS = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];
const MONTH_GENITIVE = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

/** 1 = Monday ... 7 = Sunday, matching displayDayOfWeek(). */
function todayWeekday(): number {
  return ((new Date().getDay() + 6) % 7) + 1;
}

/** The next real calendar date (today included) that falls on the given ISO weekday. */
function nextDateForWeekday(weekday: number, today: Date): Date {
  const current = todayWeekday();
  const daysAhead = (weekday - current + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() + daysAhead);
  return d;
}

const QUICK_RANGES = [
  { key: "today", label: "Dzisiaj" },
  { key: "tomorrow", label: "Jutro" },
  { key: "weekend", label: "Weekend" },
  { key: "week", label: "Cały tydzień" },
] as const;

const VIEWS = [
  { key: "lista", label: "Lista" },
  { key: "tydzien", label: "Tydzień" },
] as const;
type ViewMode = (typeof VIEWS)[number]["key"];

/** Reorders a set of weekdays to start from today and run forward, wrapping past days to the end. */
function rotateToToday(days: number[], todayWd: number): number[] {
  const sorted = [...days].sort((a, b) => a - b);
  const idx = sorted.findIndex((d) => d >= todayWd);
  if (idx <= 0) return sorted;
  return [...sorted.slice(idx), ...sorted.slice(0, idx)];
}

/** dayFilter is either a quick preset or a specific weekday ("1".."7") picked from the dropdown/chip. */
function daysForFilter(dayFilter: string): number[] {
  const today = todayWeekday();
  switch (dayFilter) {
    case "today":
      return [today];
    case "tomorrow":
      return [(today % 7) + 1];
    case "weekend":
      return [6, 7];
    case "week":
      return [1, 2, 3, 4, 5, 6, 7];
    default:
      return [Number(dayFilter)];
  }
}

/**
 * day/school/level/q live in the URL (not local state) so the QuickFilterBar
 * near the top of the page and this component, further down, stay in sync
 * without prop-drilling shared state through everything in between.
 */
export function ScheduleExplorer({ rows, preferences }: { rows: ClassRow[]; preferences?: UserPreferences }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Landing on /grafik directly (e.g. "Zobacz pełny grafik zajęć") shows the
  // whole week; arriving via a quick filter sets `day` explicitly in the URL.
  const dayFilter = searchParams.get("day") ?? "week";
  const school = searchParams.get("school") ?? ALL;
  const level = searchParams.get("level") ?? ALL;
  const format = searchParams.get("format") ?? ALL;
  const instructor = searchParams.get("instructor") ?? ALL;
  const query = searchParams.get("q") ?? "";
  const preferenceOnly = searchParams.get("mine") === "1" && Boolean(preferences && hasUserPreferences(preferences));

  const [view, setView] = useState<ViewMode>("lista");
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");
  const [showMore, setShowMore] = useState(false);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState(0);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const schools = SCHOOL_NAMES;

  const instructors = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => splitInstructors(r.instructor)))).sort((a, b) => a.localeCompare(b, "pl")),
    [rows]
  );

  const levels = useMemo(() => {
    const present = new Set(rows.map((r) => classifyLevel(r.level)));
    return LEVEL_BUCKET_ORDER.filter((b) => present.has(b));
  }, [rows]);

  const activeDays = useMemo(() => daysForFilter(dayFilter), [dayFilter]);

  const filtered = useMemo(() => {
    const activeDaySet = new Set(activeDays);
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (school !== ALL && r.school !== (school as School)) return false;
      if (instructor !== ALL && !splitInstructors(r.instructor).includes(instructor)) return false;
      if (level !== ALL && classifyLevel(r.level) !== (level as LevelBucket)) return false;
      if (format !== ALL && r.format !== (format as ClassFormat)) return false;
      const rowDay = displayDayOfWeek(r);
      if (rowDay === undefined || !activeDaySet.has(rowDay)) return false;
      if (timeFrom && (!r.startTime || r.startTime < timeFrom)) return false;
      if (timeTo && (!r.startTime || r.startTime > timeTo)) return false;
      if (q && !`${r.title} ${r.instructor ?? ""} ${r.school}`.toLowerCase().includes(q)) return false;
      if (preferenceOnly && preferences && !matchesUserPreferences(r, preferences)) return false;
      return true;
    });
  }, [rows, school, instructor, level, format, activeDays, timeFrom, timeTo, query, preferenceOnly, preferences]);

  const formatCounts = useMemo(() => {
    const counts: Record<ClassFormat, number> = { partner: 0, solo: 0, unknown: 0 };
    for (const r of filtered) counts[r.format]++;
    return counts;
  }, [filtered]);

  // Independent of any active filter — the "94 zajęć · 18 dzisiaj · 13 jutro · 27 w weekend" overview line.
  const overviewCounts = useMemo(() => {
    const countFor = (key: string) => {
      const set = new Set(daysForFilter(key));
      return rows.filter((r) => {
        const d = displayDayOfWeek(r);
        return d !== undefined && set.has(d);
      }).length;
    };
    return { total: rows.length, today: countFor("today"), tomorrow: countFor("tomorrow"), weekend: countFor("weekend") };
  }, [rows]);

  const groups = groupByDay(filtered);
  const hasActiveFilters =
    school !== ALL ||
    instructor !== ALL ||
    level !== ALL ||
    format !== ALL ||
    dayFilter !== "week" ||
    timeFrom !== "" ||
    timeTo !== "" ||
    query !== "" ||
    preferenceOnly;
  const hasSavedPreferences = Boolean(preferences && hasUserPreferences(preferences));

  useLayoutEffect(() => {
    const measure = () => {
      if (filterBarRef.current) setFilterBarHeight(filterBarRef.current.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [showMore, hasActiveFilters]);

  function resetFilters() {
    setTimeFrom("");
    setTimeTo("");
    setShowMore(false);
    router.replace(pathname, { scroll: false });
  }

  const specificDayValue = /^[1-7]$/.test(dayFilter) ? dayFilter : ALL;
  const today = new Date();
  const todayIso = toLocalIsoDate(today);
  const tomorrowIso = toLocalIsoDate(new Date(today.getTime() + 86400000));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-zinc-200">
          <span className="font-semibold text-zinc-50">{overviewCounts.total}</span> {pluralizeClasses(overviewCounts.total)} w
          Warszawie
          <span className="text-muted">
            {" "}
            · {overviewCounts.today} dzisiaj · {overviewCounts.tomorrow} jutro · {overviewCounts.weekend} w weekend
          </span>
        </p>
        {hasActiveFilters && (
          <p className="mt-0.5 text-sm text-accent">
            {filtered.length} {pluralizeClasses(filtered.length)} pasuje do Twoich filtrów
          </p>
        )}
      </div>

      {/* Sticky filter bar */}
      <div
        ref={filterBarRef}
        className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-line bg-background/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          {hasSavedPreferences && (
            <button
              type="button"
              onClick={() => updateParam("mine", preferenceOnly ? "" : "1")}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                preferenceOnly ? "border border-violet bg-violet/15 text-violet" : "border border-line text-zinc-300 hover:border-violet/60 hover:text-violet"
              }`}
            >
              {preferenceOnly ? "✓ Zgodne z moimi preferencjami" : "Moje preferencje"}
            </button>
          )}
          {QUICK_RANGES.map((range) => {
            const active = dayFilter === range.key;
            return (
              <button
                key={range.key}
                type="button"
                onClick={() => updateParam("day", range.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {range.label}
              </button>
            );
          })}

          <select value={level} onChange={(e) => updateParam("level", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Poziom</option>
            {levels.map((b) => (
              <option key={b} value={b}>
                {LEVEL_BUCKET_LABELS[b]}
              </option>
            ))}
          </select>

          <select value={school} onChange={(e) => updateParam("school", e.target.value)} className={`${SELECT_CLASS} ${school === ALL ? "" : schoolTextClass(school)}`}>
            <option value={ALL}>Szkoła</option>
            {schools.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select value={format} onChange={(e) => updateParam("format", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Format</option>
            <option value="partner">W parach</option>
            <option value="solo">Solo</option>
          </select>

          <select value={instructor} onChange={(e) => updateParam("instructor", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Instruktor</option>
            {instructors.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500"
          >
            {showMore ? "Mniej filtrów" : "Więcej filtrów"}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-accent/50 bg-accent/10 px-3.5 py-1.5 text-sm font-semibold text-accent hover:border-accent hover:bg-accent/15"
            >
              ✕ Wyczyść wszystko
            </button>
          )}

          <div className="ml-auto flex shrink-0 gap-1 rounded-full border border-line p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  view === v.key ? "bg-accent text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick day-of-week chips with real dates — jump to that day's section when the full week is visible */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DAY_CHIP_LABELS.map((label, idx) => {
            const weekday = idx + 1;
            const date = nextDateForWeekday(weekday, today);
            const active = specificDayValue === String(weekday);
            const canJump = view === "lista" && dayFilter === "week";
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (canJump) {
                    document.getElementById(`day-${weekday}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    updateParam("day", active ? "week" : String(weekday));
                  }
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {label} {date.getDate()}
              </button>
            );
          })}
        </div>

        {showMore && (
          <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Godzina od
              <input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className={SELECT_CLASS} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Godzina do
              <input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className={SELECT_CLASS} />
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {formatCounts.partner > 0 && <span>{formatCounts.partner} w parach</span>}
              {formatCounts.solo > 0 && <span>{formatCounts.solo} solo</span>}
              {formatCounts.unknown > 0 && <span>{formatCounts.unknown} nieokreślonych</span>}
            </div>
          </div>
        )}
      </div>

      {query && (
        <p className="text-xs text-muted">
          Wyniki wyszukiwania dla <span className="font-semibold text-zinc-200">&quot;{query}&quot;</span> —{" "}
          <button onClick={() => updateParam("q", "")} className="text-accent hover:text-accent-peach">
            wyczyść
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Poziom (kropka przy nazwie):</span>
        {levels.map((b) => {
          const colors = levelStyle(b);
          const active = level === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => updateParam("level", active ? ALL : b)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-opacity hover:opacity-80 ${colors.bg} ${colors.text} ${
                active ? `${colors.ring} ring-2` : colors.ring
              }`}
            >
              <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${levelDotClass(b)}`} />
              {LEVEL_BUCKET_LABELS[b]}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak zajęć spełniających wybrane kryteria.
        </p>
      ) : view === "lista" ? (
        // One column, grouped by day, sticky day headers, compact rows — ordered starting today.
        <div className="flex flex-col">
          {rotateToToday(activeDays, todayWeekday()).map((d) => {
            const dayRows = groups.get(d) ?? [];
            if (dayRows.length === 0) return null;
            const date = nextDateForWeekday(d, today);
            const iso = toLocalIsoDate(date);
            const prefix = iso === todayIso ? "Dzisiaj, " : iso === tomorrowIso ? "" : "";
            const heading = `${prefix}${DAY_LABELS[d - 1]} ${date.getDate()} ${MONTH_GENITIVE[date.getMonth()]}`;
            return (
              <div key={d} id={`day-${d}`} style={{ scrollMarginTop: filterBarHeight }} className="mt-2 first:mt-0">
                <div
                  className="sticky z-10 -mx-4 border-b-2 border-line bg-black/70 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur sm:mx-0 sm:rounded-t-lg sm:border sm:px-4"
                  style={{ top: filterBarHeight }}
                >
                  <h2 className="font-heading text-lg font-bold text-zinc-50 sm:text-xl">
                    {heading} <span className="text-sm font-normal text-muted">· {dayRows.length} {pluralizeClasses(dayRows.length)}</span>
                  </h2>
                </div>
                <div className="flex flex-col">
                  {dayRows.map((row) => (
                    <CompactClassRow key={`${row.school}-${row.id}`} row={row} allRows={rows} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : activeDays.length === 1 ? (
        <div className="grid grid-cols-1 gap-3 sm:max-w-sm">
          {(groups.get(activeDays[0]) ?? []).map((row) => (
            <ClassCard key={`${row.school}-${row.id}`} row={row} allRows={rows} />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${activeDays.length === 2 ? "sm:grid-cols-2 sm:max-w-2xl" : "sm:grid-cols-2 lg:grid-cols-7"}`}>
          {activeDays.map((d) => {
            const dayRows = groups.get(d) ?? [];
            return (
              <div key={d} className="flex flex-col gap-2">
                <h2 className="font-heading text-sm font-semibold text-zinc-300">{DAY_LABELS[d - 1]}</h2>
                <div className="flex flex-col gap-2">
                  {dayRows.length === 0 ? (
                    <p className="text-xs text-muted">brak zajęć</p>
                  ) : (
                    dayRows.map((row) => <ClassCard key={`${row.school}-${row.id}`} row={row} allRows={rows} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
