"use client";

import { useActionState } from "react";
import { updatePreferences } from "@/app/konto/actions";
import type { AuthActionState } from "@/lib/auth";
import type { UserPreferences } from "@/lib/preferences";
import { LEVEL_BUCKET_LABELS, LEVEL_BUCKET_ORDER } from "@/lib/level";

const INPUT = "rounded-xl border border-line bg-zinc-950/65 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const DAYS = [[1, "Pn"], [2, "Wt"], [3, "Śr"], [4, "Cz"], [5, "Pt"], [6, "So"], [7, "Nd"]] as const;
const STYLES = ["Bachata Sensual", "Bachata Dominicana", "Bachata Moderna", "Bachata Solo", "Footwork", "Musicality"];
const TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

export function PreferencesForm({ preferences, city, district, maxDistanceKm, publicProfile }: {
  preferences: UserPreferences;
  city: string | null;
  district: string | null;
  maxDistanceKm: number | null;
  publicProfile: boolean;
}) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(updatePreferences, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">Miasto
          <input name="city" defaultValue={city ?? "Warszawa"} placeholder="Warszawa" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">Dzielnica lub okolica
          <input name="district" defaultValue={district ?? ""} placeholder="np. Mokotów" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">Maksymalna odległość
          <span className="relative"><input name="maxDistanceKm" type="number" min="1" max="100" defaultValue={maxDistanceKm ?? 10} className={`${INPUT} w-full pr-12`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">km</span></span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">Najwcześniejsza godzina
          <select name="timeFrom" defaultValue={preferences.timeFrom ?? ""} className={INPUT}>
            <option value="">Dowolna</option>{TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
          </select>
        </label>
      </div>
      <fieldset><legend className="text-xs font-medium text-zinc-400">Twój poziom (możesz wybrać kilka)</legend><div className="mt-2 flex flex-wrap gap-2">
        {LEVEL_BUCKET_ORDER.filter((level) => level !== "unknown").map((level) => <label key={level} className="cursor-pointer"><input type="checkbox" name="levels" value={level} defaultChecked={preferences.levels.includes(level)} className="peer sr-only" /><span className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold text-zinc-400 peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent">{LEVEL_BUCKET_LABELS[level]}</span></label>)}
      </div></fieldset>
      <fieldset><legend className="text-xs font-medium text-zinc-400">Preferowany format</legend><div className="mt-2 flex flex-wrap gap-2">
        {[["partner", "W parach"], ["solo", "Solo"]].map(([value, label]) => <label key={value} className="cursor-pointer"><input type="checkbox" name="formats" value={value} defaultChecked={preferences.formats.includes(value as "partner" | "solo")} className="peer sr-only" /><span className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold text-zinc-400 peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent">{label}</span></label>)}
      </div></fieldset>
      <fieldset><legend className="text-xs font-medium text-zinc-400">Najlepsze dni</legend><div className="mt-2 flex flex-wrap gap-2">
        {DAYS.map(([value, label]) => <label key={value} className="cursor-pointer"><input type="checkbox" name="days" value={value} defaultChecked={preferences.days.includes(value)} className="peer sr-only" /><span className="flex h-9 w-10 items-center justify-center rounded-lg border border-line text-xs font-semibold text-zinc-400 peer-checked:border-violet peer-checked:bg-violet/10 peer-checked:text-violet">{label}</span></label>)}
      </div></fieldset>
      <fieldset><legend className="text-xs font-medium text-zinc-400">Co chcesz tańczyć</legend><div className="mt-2 flex flex-wrap gap-2">
        {STYLES.map((style) => <label key={style} className="cursor-pointer"><input type="checkbox" name="styles" value={style} defaultChecked={preferences.styles.includes(style)} className="peer sr-only" /><span className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold text-zinc-400 peer-checked:border-violet peer-checked:bg-violet/10 peer-checked:text-violet">{style}</span></label>)}
      </div></fieldset>
      <label className="flex items-start gap-3 rounded-xl border border-line bg-zinc-950/40 p-3 text-sm text-zinc-300"><input type="checkbox" name="publicProfile" defaultChecked={publicProfile} className="mt-1 accent-[#ff6517]" /><span><strong className="block text-zinc-100">Profil widoczny w społeczności</strong><span className="mt-0.5 block text-xs text-muted">Domyślnie profil jest prywatny. Włącz, jeśli chcesz być widoczny dla innych tancerzy.</span></span></label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">Preferencje zapisane. Rekomendacje zostały zaktualizowane.</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{pending ? "Zapisywanie…" : "Zapisz preferencje"}</button>
    </form>
  );
}
