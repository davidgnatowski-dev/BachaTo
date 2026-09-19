"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { schoolAddress, schoolTextClass, formatDuration, splitInstructors, nextOccurrences } from "@/lib/schedule";
import { classifyLevel, LEVEL_BUCKET_ICONS } from "@/lib/level";
import { FORMAT_LABELS, formatRelative } from "@/lib/format";
import { SCHOOL_INFO } from "@/lib/schools";
import { recentClassOccurrence } from "@/lib/calendar";
import { useFavorites } from "@/lib/favorites";
import { useActivity } from "@/lib/activity";
import { ExternalLinkIcon, CheckIcon, ChevronDownIcon, HeartIcon, SchoolIcon } from "@/components/icons";
import { PlusButton } from "@/components/PlusButton";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { InstructorAvatar } from "@/components/InstructorAvatar";

const MONTH_ABBR = ["STY", "LUT", "MAR", "KWI", "MAJ", "CZE", "LIP", "SIE", "WRZ", "PAŹ", "LIS", "GRU"];
const DAY_ABBR = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];

/** A collapsed-by-default section — "Opis zajęć", "Więcej terminów z X" — so the modal opens short and expands on demand. */
function Accordion({ title, preview, children }: { title: string; preview?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {!open && preview}
          <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function ClassDetailModal({ row, allRows, onClose }: { row: ClassRow; allRows: ClassRow[]; onClose: () => void }) {
  const levelBucket = classifyLevel(row.level);
  const address = schoolAddress(row.school, row.location);
  const duration = formatDuration(row.startTime, row.endTime);
  const instructors = splitInstructors(row.instructor);
  const schoolInfo = SCHOOL_INFO[row.school];

  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();
  const { isAttended, setAttended } = useActivity();
  const favoriteId = `${row.school}-${row.id}`;
  const liked = likedClassIds.has(favoriteId);

  const now = new Date();
  const sourceIsStale = now.getTime() - new Date(row.lastSeenAt).getTime() > 7 * 86400000;
  const occurrence = recentClassOccurrence(row, now);
  const canMarkAttendance = !!occurrence && occurrence.getTime() <= now.getTime();
  const attended = occurrence ? isAttended(row, occurrence) : false;
  const planned = plannedClassIds.has(favoriteId);

  const chipDate = row.specificDate ? new Date(`${row.specificDate}T12:00:00`) : nextOccurrences([row], now, 1)[0]?.when;

  function togglePlan() {
    const adding = !planned;
    togglePlanClass(favoriteId);
    if (adding && occurrence && canMarkAttendance && !attended) {
      setAttended(row, occurrence, true, { autoMarked: true });
    }
  }

  const moreFromInstructor =
    instructors.length > 0
      ? nextOccurrences(
          allRows.filter(
            (r) => !(r.school === row.school && r.id === row.id) && splitInstructors(r.instructor).some((n) => instructors.includes(n))
          ),
          now,
          3
        )
      : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-line bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:max-h-[90dvh] sm:rounded-xl"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3 sm:p-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" aria-hidden="true" />
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {chipDate && (
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-accent/60 bg-accent/10">
                  <span className="font-heading text-xl font-bold leading-none text-accent">{chipDate.getDate()}</span>
                  <span className="mt-1 text-[9px] font-semibold uppercase text-accent/80">
                    {MONTH_ABBR[chipDate.getMonth()]} · {DAY_ABBR[((chipDate.getDay() + 6) % 7)]}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">{row.school}</p>
                <h2 className="mt-0.5 font-heading text-xl font-bold leading-tight text-zinc-50">{row.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {row.level && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-black/25 px-2 py-0.5 text-xs font-semibold text-zinc-300"
                    >
                      <span aria-hidden="true">{LEVEL_BUCKET_ICONS[levelBucket]}</span>
                      {row.level}
                    </span>
                  )}
                  {row.format !== "unknown" && (
                    <span
                      className="rounded-md border border-line bg-black/25 px-2 py-0.5 text-xs font-semibold text-zinc-300"
                    >
                      {FORMAT_LABELS[row.format]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-sm text-muted hover:text-zinc-100"
            >
              ✕
            </button>
          </div>

          {/* Time, duration and address */}
          <div className="mt-4 rounded-xl border border-line bg-black/25 p-3">
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums text-zinc-50">
                {row.startTime ?? "?"}
                {row.endTime ? `–${row.endTime}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {[row.location || address, "Warszawa"].filter(Boolean).join(" · ")}
              </p>
              {duration && <p className="mt-1 text-xs text-zinc-300">Czas trwania: {duration}</p>}
            </div>
          </div>

          {/* Compact secondary actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <AddToCalendarButton row={row} />
            <button
              type="button"
              onClick={() => toggleLikeClass(favoriteId)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                liked ? "border-accent/60 bg-accent/10 text-accent" : "border-line bg-black/30 text-zinc-200 hover:border-accent/50 hover:text-accent"
              }`}
            >
              <HeartIcon className="h-4 w-4" filled={liked} />
              Ulubione
            </button>
            <a
              href={row.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-line bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-violet/50 hover:text-violet"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Zapisy
            </a>
          </div>

          {/* Attendance */}
          <button
            type="button"
            disabled={!canMarkAttendance}
            onClick={() => occurrence && setAttended(row, occurrence, !attended)}
            title={canMarkAttendance ? undefined : "Będzie dostępne po rozpoczęciu zajęć"}
            className={`mt-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
              !canMarkAttendance
                ? "cursor-not-allowed border-line text-zinc-600"
                : attended
                  ? "border-green-800/60 bg-green-950/40 text-green-300"
                  : "border-line text-zinc-300 hover:border-zinc-500"
            }`}
          >
            <CheckIcon className="h-3 w-3" />
            {attended ? "Byłeś/aś na tych zajęciach" : "Byłem/am na tych zajęciach"}
          </button>

          {/* Instructors */}
          {instructors.length > 0 && (
            <div className="mt-3">
              {instructors.map((name) => {
                const photo = row.instructorPhotos?.[name];
                return (
                  <Link
                    key={name}
                    href={`/instruktorzy/${encodeURIComponent(name)}`}
                    className="flex items-center gap-3 rounded-lg py-1.5 transition-colors hover:bg-black/20"
                  >
                    <InstructorAvatar name={name} photoUrl={photo} sizeClassName="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-50">{name}</p>
                      <p className="truncate text-xs text-muted">
                        {instructors.length > 1 ? "Instruktor/ka" : "Instruktor/ka"} · {row.school}
                      </p>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 shrink-0 -rotate-90 text-zinc-500" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* School */}
          <Link
            href={`/szkoly/${encodeURIComponent(row.school)}`}
            className="mt-1 flex items-center gap-3 rounded-lg py-1.5 transition-colors hover:bg-black/20"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-black/40 text-zinc-400">
              <SchoolIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">{row.school}</p>
              <p className="truncate text-xs text-muted">Profil szkoły i pełny grafik</p>
            </div>
            <ChevronDownIcon className="h-4 w-4 shrink-0 -rotate-90 text-zinc-500" />
          </Link>

          {/* Description */}
          {row.description && (
            <Accordion title="Opis zajęć" preview="krótki podgląd">
              <p className="whitespace-pre-line text-sm text-zinc-300">{row.description}</p>
            </Accordion>
          )}

          {/* Related classes from the same instructor */}
          {moreFromInstructor.length > 0 && (
            <Accordion title={`Więcej terminów z ${instructors[0]}`}>
              <div className="flex flex-col divide-y divide-line">
                {moreFromInstructor.map(({ row: r, label }) => (
                  <div key={`${r.school}-${r.id}`} className="flex flex-wrap items-center gap-3 py-2 first:pt-0 last:pb-0 sm:flex-nowrap">
                    <div className="w-14 shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-accent">{r.startTime}</p>
                      <p className="text-[10px] text-muted">{label}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-200">{r.title}</p>
                      <p className={`truncate text-[11px] ${schoolTextClass(r.school)}`}>{r.school}</p>
                    </div>
                    <div className="ml-[68px] shrink-0 sm:ml-0">
                      <AddToCalendarButton row={r} />
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          )}

          <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
            <a href={schoolInfo.homepage} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:text-accent-peach">
              Strona szkoły ↗
            </a>
            <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-zinc-300">
              Sprawdź aktualny grafik i dostępność miejsc ↗
            </a>
            <p className={`text-[11px] ${sourceIsStale ? "text-amber-400" : "text-zinc-600"}`}>
              Dane z grafiku szkoły: {formatRelative(row.lastSeenAt)}
              {sourceIsStale ? " · sprawdź termin u źródła" : ""}
            </p>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-zinc-900/95 p-3 backdrop-blur">
          <PlusButton
            label="Dodaj do planu"
            active={planned}
            onToggle={togglePlan}
            tone="accent"
            className="flex-1 !justify-center !py-2.5 !text-sm"
          />
          <button
            type="button"
            onClick={() => toggleLikeClass(favoriteId)}
            aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
              liked ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-zinc-300 hover:text-white"
            }`}
          >
            <HeartIcon className="h-4 w-4" filled={liked} />
          </button>
        </div>
      </div>
    </div>
  );
}
