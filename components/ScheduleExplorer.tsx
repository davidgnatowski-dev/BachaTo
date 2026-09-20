"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ClassFormat, ClassRow, School } from "@/lib/types";
import { hasUserPreferences, matchesUserPreferences, type UserPreferences } from "@/lib/preferences";
import {
  DAY_LABELS,
  pluralizeClasses,
  scheduleDatesForFilter,
  scheduleOccurrencesForDates,
  schoolAddress,
  schoolTextClass,
  splitInstructors,
} from "@/lib/schedule";
import { toLocalIsoDate } from "@/lib/format";
import { SCHOOL_NAMES } from "@/lib/schools";
import { ClassCard } from "@/components/ClassCard";
import { CompactClassRow } from "@/components/CompactClassRow";
import { ScheduleWeekGrid } from "@/components/ScheduleWeekGrid";
import { ScheduleMap } from "@/components/ScheduleMap";
import { DayScheduleSlots, DayTimeline } from "@/components/DayTimeline";
import { HourSelect } from "@/components/HourSelect";
import { ChevronDownIcon, FilterIcon } from "@/components/icons";
import {
  classifyLevel,
  levelStyle,
  LEVEL_BUCKET_ORDER,
  LEVEL_BUCKET_LABELS,
  LEVEL_BUCKET_LETTERS,
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

/** The next real calendar date (today included) that falls on the given ISO weekday. */
function nextDateForWeekday(weekday: number, today: Date): Date {
  const current = ((today.getDay() + 6) % 7) + 1;
  const daysAhead = (weekday - current + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() + daysAhead);
  return d;
}

const QUICK_RANGES = [
  { key: "today", label: "Dzisiaj" },
  { key: "tomorrow", label: "Jutro" },
  { key: "weekend", label: "Weekend" },
  { key: "week", label: "7 dni" },
] as const;

const VIEWS = [
  { key: "lista", label: "Lista" },
  { key: "tydzien", label: "Tydzień" },
  { key: "mapa", label: "Mapa" },
] as const;
type ViewMode = (typeof VIEWS)[number]["key"];

/**
 * day/school/level/q live in the URL (not local state) so the QuickFilterBar
 * near the top of the page and this component, further down, stay in sync
 * without prop-drilling shared state through everything in between.
 */
export function ScheduleExplorer({ rows, preferences }: { rows: ClassRow[]; preferences?: UserPreferences }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const pendingSearchParams = useRef(searchParamsKey);

  useLayoutEffect(() => {
    pendingSearchParams.current = searchParamsKey;
  }, [searchParamsKey]);

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
  // Auto-expand when a link lands here with ?school= or ?instructor= already set (e.g. a school's "Pełny grafik" link, or an instructor's profile) — otherwise the active filter would be invisible.
  const [showMore, setShowMore] = useState(() => searchParams.get("school") !== null || searchParams.get("instructor") !== null);
  const [levelPanelOpen, setLevelPanelOpen] = useState(() => searchParams.get("level") !== null);
  const [today] = useState(() => new Date());

  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState(0);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(pendingSearchParams.current);
    if (value === ALL || value === "") params.delete(key);
    else params.set(key, value);
    const nextParams = params.toString();
    pendingSearchParams.current = nextParams;
    router.push(nextParams ? `${pathname}?${nextParams}` : pathname, { scroll: false });
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

  const activeDates = useMemo(() => scheduleDatesForFilter(dayFilter, today), [dayFilter, today]);
  // Monday-anchored (unlike the "week" quick filter, which rolls 7 days from today) so the
  // mobile day-scroller always reads Mon -> Sun in the same fixed order as the desktop chips.
  const weekDates = useMemo(() => {
    const currentWeekday = ((today.getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
    const monday = new Date(today);
    monday.setDate(monday.getDate() - (currentWeekday - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return toLocalIsoDate(d);
    });
  }, [today]);
  const todayIsoForMobile = toLocalIsoDate(today);
  const mobileSelectedIso =
    activeDates.length === 1 ? activeDates[0] : activeDates.includes(todayIsoForMobile) ? todayIsoForMobile : activeDates[0];

  const filteredOccurrences = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scheduleOccurrencesForDates(rows, activeDates).filter(({ row: r }) => {
      if (school !== ALL && r.school !== (school as School)) return false;
      if (instructor !== ALL && !splitInstructors(r.instructor).includes(instructor)) return false;
      if (level !== ALL && classifyLevel(r.level) !== (level as LevelBucket)) return false;
      if (format !== ALL && r.format !== (format as ClassFormat)) return false;
      if (timeFrom && (!r.startTime || r.startTime < timeFrom)) return false;
      if (timeTo && (!r.startTime || r.startTime > timeTo)) return false;
      if (q && !`${r.title} ${r.instructor ?? ""} ${r.school}`.toLowerCase().includes(q)) return false;
      if (preferenceOnly && preferences && !matchesUserPreferences(r, preferences)) return false;
      return true;
    });
  }, [rows, school, instructor, level, format, activeDates, timeFrom, timeTo, query, preferenceOnly, preferences]);

  const filtered = useMemo(() => filteredOccurrences.map(({ row }) => row), [filteredOccurrences]);

  const formatCounts = useMemo(() => {
    const counts: Record<ClassFormat, number> = { partner: 0, solo: 0, unknown: 0 };
    for (const r of filtered) counts[r.format]++;
    return counts;
  }, [filtered]);

  // Independent of active filters and based on real dates, not only weekday names.
  const overviewCounts = useMemo(() => {
    const countFor = (key: string) => scheduleOccurrencesForDates(rows, scheduleDatesForFilter(key, today)).length;
    return { total: countFor("week"), today: countFor("today"), tomorrow: countFor("tomorrow"), weekend: countFor("weekend") };
  }, [rows, today]);

  const groups = useMemo(() => {
    const result = new Map<string, ClassRow[]>();
    for (const { row, dateIso } of filteredOccurrences) {
      const list = result.get(dateIso) ?? [];
      list.push(row);
      result.set(dateIso, list);
    }
    return result;
  }, [filteredOccurrences]);
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
  // Filters tucked behind "Więcej filtrów" — surfaced as a count badge so it's obvious there's
  // something active back there even while the panel itself is collapsed.
  const hiddenFiltersCount = [school !== ALL, instructor !== ALL, timeFrom !== "", timeTo !== ""].filter(Boolean).length;

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

          <select value={format} onChange={(e) => updateParam("format", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Format</option>
            <option value="partner">W parach</option>
            <option value="solo">Solo</option>
          </select>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              showMore || hiddenFiltersCount > 0
                ? "border-accent/60 bg-accent/10 text-accent hover:border-accent"
                : "border-line text-zinc-300 hover:border-zinc-500"
            }`}
          >
            <FilterIcon className="h-4 w-4" />
            {showMore ? "Mniej filtrów" : "Więcej filtrów"}
            {!showMore && hiddenFiltersCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {hiddenFiltersCount}
              </span>
            )}
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

        {/* Quick day-of-week chips with real dates — jump to that day's section when the full week is visible. On mobile the "lista" view has its own date strip inside DayTimeline, so this one only shows from lg: up there. */}
        <div className={`flex-wrap items-center gap-1.5 ${view === "lista" ? "hidden lg:flex" : "flex"}`}>
          {DAY_CHIP_LABELS.map((label, idx) => {
            const weekday = idx + 1;
            const date = nextDateForWeekday(weekday, today);
            const active = specificDayValue === String(weekday);
            const chipIso = toLocalIsoDate(date);
            const canJump = view === "lista" && dayFilter === "week" && activeDates.includes(chipIso);
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (canJump) {
                    document.getElementById(`day-${chipIso}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              Szkoła
              <select value={school} onChange={(e) => updateParam("school", e.target.value)} className={`${SELECT_CLASS} ${school === ALL ? "" : schoolTextClass(school)}`}>
                <option value={ALL}>Wszystkie</option>
                {schools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {school !== ALL && schoolAddress(school) && (
                <span className="max-w-[220px] text-[11px] leading-snug text-muted">{schoolAddress(school)}</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Instruktor
              <select value={instructor} onChange={(e) => updateParam("instructor", e.target.value)} className={SELECT_CLASS}>
                <option value={ALL}>Wszyscy</option>
                {instructors.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <HourSelect label="Godzina od" value={timeFrom || null} onChange={(v) => setTimeFrom(v ?? "")} />
            <HourSelect label="Godzina do" value={timeTo || null} onChange={(v) => setTimeTo(v ?? "")} />
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

      <div>
        <button
          type="button"
          onClick={() => setLevelPanelOpen((value) => !value)}
          aria-expanded={levelPanelOpen}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100"
        >
          Poziom
          {level !== ALL && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${levelStyle(level as LevelBucket).bg} ${levelStyle(level as LevelBucket).text} ${levelStyle(level as LevelBucket).ring}`}>
              {LEVEL_BUCKET_LETTERS[level as LevelBucket]}
            </span>
          )}
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${levelPanelOpen ? "rotate-180" : ""}`} />
        </button>
        {levelPanelOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  {LEVEL_BUCKET_LETTERS[b]} - {LEVEL_BUCKET_LABELS[b]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak zajęć spełniających wybrane kryteria.
        </p>
      ) : view === "lista" ? (
        <>
          {/* One day at a time on mobile, navigated via the horizontal date strip. */}
          <div className="lg:hidden">
            <DayTimeline
              weekDates={weekDates}
              selectedIso={mobileSelectedIso}
              groups={groups}
              allRows={rows}
              todayIso={todayIso}
              tomorrowIso={tomorrowIso}
              onSelectWeekday={(weekday) => updateParam("day", String(weekday))}
            />
          </div>

          {/* Full week as one scrollable list from lg: up. */}
          <div className="hidden lg:block">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
              <ChevronDownIcon className="h-3 w-3 shrink-0" />
              Instruktorzy, sala i pełny poziom pojawiają się po rozwinięciu wiersza.
            </p>
            {/* One column grouped by actual occurrence date, so one-off classes never leak into a different week. */}
            <div className="flex flex-col">
              {activeDates.map((iso) => {
                const dayRows = groups.get(iso) ?? [];
                if (dayRows.length === 0) return null;
                const date = new Date(`${iso}T12:00:00`);
                const weekday = ((date.getDay() + 6) % 7) + 1;
                const prefix = iso === todayIso ? "Dzisiaj, " : iso === tomorrowIso ? "Jutro, " : "";
                const heading = `${prefix}${DAY_LABELS[weekday - 1]} ${date.getDate()} ${MONTH_GENITIVE[date.getMonth()]}`;
                return (
                  <div key={iso} id={`day-${iso}`} style={{ scrollMarginTop: filterBarHeight }} className="mt-2 first:mt-0">
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
          </div>
        </>
      ) : view === "mapa" ? (
        <ScheduleMap rows={filtered} allRows={rows} />
      ) : activeDates.length === 1 ? (
        <div className="grid grid-cols-1 gap-3 sm:max-w-sm">
          {(groups.get(activeDates[0]) ?? []).map((row) => (
            <ClassCard key={`${row.school}-${row.id}`} row={row} allRows={rows} />
          ))}
        </div>
      ) : (
        <>
          {/* Stacked day columns on mobile/tablet; a real hour-by-day grid takes over from lg: up. */}
          <div className={`grid grid-cols-1 gap-4 lg:hidden ${activeDates.length === 2 ? "sm:grid-cols-2 sm:max-w-2xl" : "sm:grid-cols-2"}`}>
            {activeDates.map((iso) => {
              const dayRows = groups.get(iso) ?? [];
              const date = new Date(`${iso}T12:00:00`);
              const weekday = ((date.getDay() + 6) % 7) + 1;
              return (
                <div key={iso} className="flex flex-col gap-2">
                  <h2 className="font-heading text-sm font-semibold text-zinc-300">
                    {DAY_LABELS[weekday - 1]} {date.getDate()}.{String(date.getMonth() + 1).padStart(2, "0")}
                  </h2>
                  <div>
                    {dayRows.length === 0 ? (
                      <p className="text-xs text-muted">brak zajęć</p>
                    ) : (
                      <DayScheduleSlots rows={dayRows} allRows={rows} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden lg:block">
            <ScheduleWeekGrid activeDates={activeDates} groups={groups} allRows={rows} todayIso={todayIso} />
          </div>
        </>
      )}
    </div>
  );
}
