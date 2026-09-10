"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/lib/auth";
import { logManualActivity } from "@/app/actions/activity";
import { MANUAL_ACTIVITY_TYPES, MANUAL_ACTIVITY_LABELS, type ManualActivityType } from "@/lib/manualActivity";

const INPUT_CLASS =
  "rounded-xl border border-line bg-zinc-950/65 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function ManualActivityForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(logManualActivity, {});
  const [type, setType] = useState<ManualActivityType>("class");
  const [rating, setRating] = useState(0);
  // Remount the uncontrolled fields after a successful save so the form clears
  // for the next entry (type stays selected for logging several in a row).
  // Reacting to the new action result during render — the "adjust state when a
  // prop changes" pattern — rather than in an effect.
  const [formKey, setFormKey] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.success) {
      setRating(0);
      setFormKey((k) => k + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-400">Typ aktywności</span>
        <div className="flex flex-wrap gap-2">
          {MANUAL_ACTIVITY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                type === t ? "border-accent bg-accent text-white" : "border-line bg-black/40 text-zinc-200 hover:border-zinc-500"
              }`}
            >
              {MANUAL_ACTIVITY_LABELS[t]}
            </button>
          ))}
        </div>
        <input type="hidden" name="activityType" value={type} />
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Nazwa *
        <input name="title" required maxLength={160} placeholder="np. Bachata Sensual S2, praktis w Abra, warsztat z…" className={INPUT_CLASS} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Data *
          <input name="dateIso" type="date" required defaultValue={todayIso()} max={todayIso()} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Od
          <input name="startTime" type="time" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Do
          <input name="endTime" type="time" className={INPUT_CLASS} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Szkoła / miejsce
          <input name="school" maxLength={120} placeholder="opcjonalnie" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Instruktor
          <input name="instructor" maxLength={160} placeholder="opcjonalnie" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Poziom
          <input name="level" maxLength={80} placeholder="opcjonalnie" className={INPUT_CLASS} />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-400">Ocena (opcjonalnie)</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating((r) => (r === n ? 0 : n))}
              aria-label={`${n} z 5`}
              className={`text-2xl leading-none transition-colors ${n <= rating ? "text-accent" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <button type="button" onClick={() => setRating(0)} className="ml-2 text-xs text-muted hover:text-zinc-200">
              wyczyść
            </button>
          )}
        </div>
        <input type="hidden" name="rating" value={rating || ""} />
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Notatka (opcjonalnie)
        <textarea name="note" rows={3} maxLength={500} placeholder="Co przećwiczyliście, jak poszło, co zapamiętać…" className={`${INPUT_CLASS} resize-y`} />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-400">
          Zapisano w dzienniku. <Link href="/podsumowanie" className="underline hover:text-green-300">Zobacz podsumowanie →</Link>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Zapisywanie…" : "Dodaj do dziennika"}
        </button>
        <Link href="/podsumowanie" className="text-sm font-semibold text-zinc-400 hover:text-accent">
          Wróć do podsumowania
        </Link>
      </div>

      <p className="text-xs text-muted">
        Wpis jest prywatny — trafia tylko do Twoich statystyk. Zgłoszenie wydarzenia do publicznego kalendarza to osobna
        czynność (<Link href="/dla-organizatorow" className="underline hover:text-zinc-200">tutaj</Link>).
      </p>
    </form>
  );
}
