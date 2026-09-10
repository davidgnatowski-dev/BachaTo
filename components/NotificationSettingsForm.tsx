"use client";

import { useActionState, useEffect, useState } from "react";
import { updateNotifications } from "@/app/konto/actions";
import type { AuthActionState } from "@/lib/auth";
import type { NotificationPreferences } from "@/lib/notificationPreferences";

const BROWSER_KEY = "bachato:browser-notifications:v1";

export function NotificationSettingsForm({ preferences }: { preferences: NotificationPreferences }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(updateNotifications, {});
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [browserMessage, setBrowserMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBrowserEnabled(localStorage.getItem(BROWSER_KEY) === "on" && Notification.permission === "granted");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function toggleBrowser() {
    if (!("Notification" in window)) {
      setBrowserMessage("Ta przeglądarka nie obsługuje powiadomień.");
      return;
    }
    if (browserEnabled) {
      localStorage.removeItem(BROWSER_KEY);
      setBrowserEnabled(false);
      setBrowserMessage("Powiadomienia w tej przeglądarce są wyłączone.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(BROWSER_KEY, "on");
      setBrowserEnabled(true);
      setBrowserMessage("Gotowe — przypomnienia pojawią się, gdy BachaTo będzie otwarte.");
    } else {
      setBrowserMessage("Nie udało się włączyć powiadomień. Sprawdź uprawnienia strony w przeglądarce.");
    }
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["plannedClasses", "Zajęcia z planu", "Przypomnienie przed rozpoczęciem"],
          ["plannedEvents", "Wydarzenia z planu", "Najbliższe festiwale, imprezy i praktyki"],
          ["followed", "Obserwowani", "Nowe terminy szkół i instruktorów"],
        ].map(([name, title, description]) => (
          <label key={name} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-zinc-950/40 p-3">
            <input type="checkbox" name={name} defaultChecked={preferences[name as keyof NotificationPreferences] === true} className="mt-1 accent-[#ff6517]" />
            <span><strong className="block text-sm text-zinc-100">{title}</strong><span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span></span>
          </label>
        ))}
      </div>
      <label className="flex max-w-sm flex-col gap-1.5 text-xs font-medium text-zinc-400">Przypomnij przed zajęciami
        <select name="reminderMinutes" defaultValue={preferences.reminderMinutes} className="rounded-xl border border-line bg-zinc-950/65 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-accent focus:outline-none">
          <option value="60">1 godzinę wcześniej</option>
          <option value="180">3 godziny wcześniej</option>
          <option value="1440">Dzień wcześniej</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="button" onClick={toggleBrowser} className={`rounded-full border px-4 py-2 text-xs font-semibold ${browserEnabled ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300" : "border-violet/50 bg-violet/10 text-violet hover:bg-violet/20"}`}>
          {browserEnabled ? "Powiadomienia przeglądarki: włączone" : "Włącz powiadomienia przeglądarki"}
        </button>
        <p className="text-xs text-muted">Dzwonek w aplikacji działa zawsze po zalogowaniu.</p>
      </div>
      {browserMessage && <p className="text-xs text-zinc-300">{browserMessage}</p>}
      {state?.success && <p className="text-sm text-emerald-400">Ustawienia powiadomień zapisane.</p>}
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{pending ? "Zapisywanie…" : "Zapisz powiadomienia"}</button>
    </form>
  );
}
