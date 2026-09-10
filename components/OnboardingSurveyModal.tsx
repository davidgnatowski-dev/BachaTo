"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEVEL_BUCKET_ORDER, LEVEL_BUCKET_LABELS, type LevelBucket } from "@/lib/level";
import { FORMAT_LABELS } from "@/lib/format";
import type { ClassFormat } from "@/lib/types";
import { submitOnboardingSurvey, skipOnboardingSurveyAction } from "@/app/actions/preferences";

const SHORT_DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const SELECTABLE_FORMATS: ClassFormat[] = ["partner", "solo"];
// Covers the real spread of class start times (a handful before 17:00, the bulk from 17:00 on).
const TIME_FROM_OPTIONS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];
const DEFAULT_TIME_FROM = "17:00";
const ALL = "all";

const CHIP_BASE = "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors";
const CHIP_ACTIVE = "border-accent bg-accent text-white";
const CHIP_INACTIVE = "border-line bg-black/40 text-zinc-200 hover:border-zinc-500";
const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

/**
 * One-screen, ~30-second survey shown once to a freshly logged-in user
 * (gated by `onboarding_survey_done_at` being null — see app/page.tsx).
 * Every answer is optional; "no preference" is a valid, filterable state,
 * not an error, so recommendations degrade gracefully rather than forcing
 * a choice on any question.
 */
export function OnboardingSurveyModal() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [levels, setLevels] = useState<LevelBucket[]>([]);
  const [formats, setFormats] = useState<ClassFormat[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [timeFrom, setTimeFrom] = useState<string | null>(DEFAULT_TIME_FROM);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function toggleLevel(b: LevelBucket) {
    setLevels((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  function toggleFormat(f: ClassFormat) {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function save() {
    startTransition(async () => {
      await submitOnboardingSurvey({ levels, formats, days, timeFrom });
      setOpen(false);
      // Land straight on the payoff: the schedule pre-filtered to what they
      // just told us, with a short welcome note.
      const hasAnyPreference = levels.length > 0 || formats.length > 0 || days.length > 0 || Boolean(timeFrom);
      router.push(hasAnyPreference ? "/grafik?mine=1&powitanie=1" : "/grafik?powitanie=1");
    });
  }

  function skip() {
    startTransition(async () => {
      await skipOnboardingSurveyAction();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="survey-title">
      <div className="w-full max-w-md rounded-xl border border-line bg-zinc-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:p-6">
        <h2 id="survey-title" className="font-heading text-lg font-semibold text-foreground">
          Dopasujmy zajęcia dla Ciebie
        </h2>
        <p className="mt-1 text-sm text-muted">Zajmie to 30 sekund. Możesz pominąć dowolne pytanie.</p>

        <div className="mt-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Poziom zajęć, które Cię interesują (możesz wybrać kilka)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLevels([])}
                className={`${CHIP_BASE} ${levels.length === 0 ? CHIP_ACTIVE : CHIP_INACTIVE}`}
              >
                Wszystkie
              </button>
              {LEVEL_BUCKET_ORDER.filter((b) => b !== "unknown").map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleLevel(b)}
                  className={`${CHIP_BASE} ${levels.includes(b) ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                >
                  {LEVEL_BUCKET_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Zajęcia solo czy w parach (możesz wybrać oba)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SELECTABLE_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFormat(f)}
                  className={`${CHIP_BASE} ${formats.includes(f) ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Kiedy masz czas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHORT_DAY_LABELS.map((label, i) => {
                const day = i + 1;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`${CHIP_BASE} h-9 w-9 !px-0 ${days.includes(day) ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <label className="mt-2.5 flex items-center gap-2 text-xs text-muted">
              Od godziny
              <select
                value={timeFrom ?? ALL}
                onChange={(e) => setTimeFrom(e.target.value === ALL ? null : e.target.value)}
                className={SELECT_CLASS}
              >
                <option value={ALL}>Dowolna</option>
                {TIME_FROM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {Number(t.slice(0, 2))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
          >
            Zapisz preferencje
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={isPending}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:text-zinc-200 disabled:opacity-60"
          >
            Pomiń, dobiorę to sam
          </button>
        </div>
      </div>
    </div>
  );
}
