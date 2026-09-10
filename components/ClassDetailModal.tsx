"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { schoolAddress, schoolTextClass, formatDatePl, formatDuration, splitInstructors, nextOccurrences } from "@/lib/schedule";
import { classifyLevel, levelStyle, LEVEL_BUCKET_ICONS } from "@/lib/level";
import { FORMAT_LABELS, formatRelative, formatStyle } from "@/lib/format";
import { SCHOOL_INFO } from "@/lib/schools";
import { recentClassOccurrence } from "@/lib/calendar";
import { useFavorites } from "@/lib/favorites";
import { useActivity } from "@/lib/activity";
import { ExternalLinkIcon, PersonIcon, CheckIcon } from "@/components/icons";
import { PlusButton } from "@/components/PlusButton";
import { HeartButton } from "@/components/HeartButton";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";

const PILL_CLASS =
  "flex shrink-0 items-center gap-1 rounded-full border border-line bg-black/40 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:border-violet/50 hover:text-violet";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-200">{children}</p>
    </div>
  );
}

export function ClassDetailModal({ row, allRows, onClose }: { row: ClassRow; allRows: ClassRow[]; onClose: () => void }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const levelBucket = classifyLevel(row.level);
  const levelColors = levelStyle(levelBucket);
  const formatColors = formatStyle(row.format);
  const address = schoolAddress(row.school, row.location);
  const duration = formatDuration(row.startTime, row.endTime);
  const instructors = splitInstructors(row.instructor);
  const schoolInfo = SCHOOL_INFO[row.school];

  const { likedClassIds, plannedClassIds, toggleLikeClass, togglePlanClass } = useFavorites();
  const { isAttended, setAttended } = useActivity();
  const favoriteId = `${row.school}-${row.id}`;

  const now = new Date();
  const sourceIsStale = now.getTime() - new Date(row.lastSeenAt).getTime() > 7 * 86400000;
  const occurrence = recentClassOccurrence(row, now);
  const canMarkAttendance = !!occurrence && occurrence.getTime() <= now.getTime();
  const attended = occurrence ? isAttended(row, occurrence) : false;
  const planned = plannedClassIds.has(favoriteId);

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

  const otherInSchool = nextOccurrences(
    allRows.filter((r) => !(r.school === row.school && r.id === row.id) && r.school === row.school),
    now,
    3
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-line bg-zinc-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold leading-snug text-zinc-50">{row.title}</h2>
            <p className={`mt-0.5 text-sm font-medium ${schoolTextClass(row.school)}`}>
              {row.school}
              {row.specificDate ? ` · ${formatDatePl(row.specificDate)}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {row.level && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${levelColors.bg} ${levelColors.text} ${levelColors.ring}`}
                >
                  <span aria-hidden="true">{LEVEL_BUCKET_ICONS[levelBucket]}</span>
                  {row.level}
                </span>
              )}
              {row.format !== "unknown" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${formatColors.bg} ${formatColors.text} ${formatColors.ring}`}
                >
                  {FORMAT_LABELS[row.format]}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="shrink-0 rounded-full border border-line px-2.5 py-1 text-sm text-muted hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-line bg-black/20 p-3.5 sm:grid-cols-3">
          <InfoRow label="Godzina">
            {row.startTime ?? "?"}
            {row.endTime ? ` – ${row.endTime}` : ""}
          </InfoRow>
          {duration && <InfoRow label="Czas trwania">{duration}</InfoRow>}
          {row.location && <InfoRow label="Sala">{row.location}</InfoRow>}
          {address && <InfoRow label="Adres">{address}</InfoRow>}
          {row.level && <InfoRow label="Poziom">{row.level}</InfoRow>}
          <InfoRow label="Format">{FORMAT_LABELS[row.format]}</InfoRow>
        </div>

        {/* Main actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PlusButton label="Dodaj do mojego planu" active={planned} onToggle={togglePlan} />
          <HeartButton label="Dodaj do ulubionych" active={likedClassIds.has(favoriteId)} onToggle={() => toggleLikeClass(favoriteId)} />
          <AddToCalendarButton row={row} />
          <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark">
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Zapisz się w szkole
          </a>
          <a href={schoolInfo.homepage} target="_blank" rel="noopener noreferrer" className={PILL_CLASS}>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Strona szkoły
          </a>
        </div>

        {/* Attendance */}
        <button
          type="button"
          disabled={!canMarkAttendance}
          onClick={() => occurrence && setAttended(row, occurrence, !attended)}
          title={canMarkAttendance ? undefined : "Będzie dostępne po rozpoczęciu zajęć"}
          className={`mt-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
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
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {instructors.length > 1 ? "Instruktorzy" : "Instruktor"}
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {instructors.map((name) => {
                const photo = row.instructorPhotos?.[name];
                const classesByName = allRows.filter((r) => splitInstructors(r.instructor).includes(name));
                const styles = Array.from(new Set(classesByName.map((r) => r.danceStyle).filter(Boolean)));
                const bio =
                  classesByName.find((r) => r.instructorBios?.[name])?.instructorBios?.[name] ??
                  classesByName.find((r) => r.instructorBio && splitInstructors(r.instructor).length === 1)?.instructorBio ??
                  (splitInstructors(row.instructor).length === 1 ? row.instructorBio : undefined);
                const profileUrl = classesByName.find((r) => r.instructorProfileUrls?.[name])?.instructorProfileUrls?.[name];
                const fallbackBio = styles.length > 0 ? `Prowadzi zajęcia: ${styles.join(", ")}.` : undefined;
                return (
                  <div key={name} className="flex gap-3 rounded-lg border border-line bg-black/20 p-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
                      <img src={photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-muted">
                        <PersonIcon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-sm font-semibold text-zinc-50">{name}</p>
                      <p className={`text-xs ${schoolTextClass(row.school)}`}>{row.school}</p>
                      {(bio || fallbackBio) && <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-zinc-300">{bio || fallbackBio}</p>}
                      {styles.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {styles.map((s) => (
                            <span key={s} className="rounded-full bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/instruktorzy/${encodeURIComponent(name)}`}
                        className="mt-1.5 inline-block text-xs font-semibold text-accent hover:text-accent-peach"
                      >
                        Zobacz profil instruktora →
                      </Link>
                      {profileUrl && (
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="ml-3 mt-1.5 inline-block text-xs font-semibold text-zinc-400 hover:text-zinc-200">
                          Profil szkoły ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* School */}
        <div className="mt-4 rounded-lg border border-line bg-black/20 p-3">
          <p className={`font-heading text-sm font-semibold ${schoolTextClass(row.school)}`}>{row.school}</p>
          <p className="mt-1 text-xs text-zinc-300">{schoolInfo.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <a href={schoolInfo.homepage} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-peach">
              Strona szkoły ↗
            </a>
            <Link href={`/szkoly/${encodeURIComponent(row.school)}`} className="text-accent hover:text-accent-peach">
              Zobacz profil szkoły →
            </Link>
            <Link href={`/grafik?school=${encodeURIComponent(row.school)}`} className="text-accent hover:text-accent-peach">
              Pełny grafik szkoły →
            </Link>
          </div>
        </div>

        {/* Description */}
        {row.description && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Opis zajęć</p>
            <p className={`mt-1 whitespace-pre-line text-sm text-zinc-300 ${descExpanded ? "" : "line-clamp-4"}`}>{row.description}</p>
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-accent hover:text-accent-peach"
            >
              {descExpanded ? "Pokaż mniej" : "Pokaż więcej"}
            </button>
          </div>
        )}

        <a
          href={row.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-muted hover:text-zinc-300"
        >
          Sprawdź aktualny grafik i dostępność miejsc ↗
        </a>
        <p className={`mt-1 text-[11px] ${sourceIsStale ? "text-amber-400" : "text-zinc-600"}`}>
          Dane z grafiku szkoły: {formatRelative(row.lastSeenAt)}{sourceIsStale ? " · sprawdź termin u źródła" : ""}
        </p>

        {/* Related classes */}
        {moreFromInstructor.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Więcej od {instructors[0]}</p>
            <div className="mt-2 flex flex-col divide-y divide-line">
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
                  <div className="ml-[68px] shrink-0 sm:ml-0"><AddToCalendarButton row={r} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherInSchool.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inne zajęcia w <span className={schoolTextClass(row.school)}>{row.school}</span></p>
            <div className="mt-2 flex flex-col divide-y divide-line">
              {otherInSchool.map(({ row: r, label }) => (
                <div key={`${r.school}-${r.id}`} className="flex flex-wrap items-center gap-3 py-2 first:pt-0 last:pb-0 sm:flex-nowrap">
                  <div className="w-14 shrink-0">
                    <p className="text-xs font-semibold tabular-nums text-accent">{r.startTime}</p>
                    <p className="text-[10px] text-muted">{label}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">{r.title}</p>
                    <p className="truncate text-[11px] text-muted">{r.instructor}</p>
                  </div>
                  <div className="ml-[68px] shrink-0 sm:ml-0"><AddToCalendarButton row={r} /></div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Pozostałe zajęcia widoczne w pełnym grafiku szkoły.</p>
          </div>
        )}
      </div>
    </div>
  );
}
