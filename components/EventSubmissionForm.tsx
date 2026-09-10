"use client";

import { useActionState } from "react";
import { submitEventRequest, type SubmissionState } from "@/app/dla-organizatorow/actions";

const initialState: SubmissionState = { ok: false, message: "" };

export function EventSubmissionForm({
  initialKind = "new",
  initialTitle = "",
  eventKey = "",
}: {
  initialKind?: "new" | "correction" | "claim";
  initialTitle?: string;
  eventKey?: string;
}) {
  const [state, action, pending] = useActionState(submitEventRequest, initialState);
  if (state.ok) return <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200" role="status">{state.message}</div>;

  const field = "rounded-xl border border-line bg-zinc-950/70 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="eventKey" value={eventKey} />
      <label className="grid gap-1.5 text-xs font-medium text-zinc-300">Rodzaj zgłoszenia
        <select name="kind" defaultValue={initialKind} className={field}>
          <option value="new">Dodaj nowe wydarzenie</option>
          <option value="correction">Zgłoś poprawkę</option>
          <option value="claim">Przejmij profil wydarzenia</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-zinc-300">Nazwa wydarzenia
          <input name="eventTitle" defaultValue={initialTitle} required minLength={3} maxLength={200} className={field} />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-zinc-300">E-mail kontaktowy
          <input name="contactEmail" type="email" required maxLength={200} className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-xs font-medium text-zinc-300">Strona wydarzenia lub organizatora
        <input name="eventUrl" type="url" maxLength={500} placeholder="https://…" className={field} />
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-zinc-300">Co mamy dodać lub poprawić?
        <textarea name="message" required minLength={10} maxLength={3000} rows={6} placeholder="Podaj datę, miejsce, program lub opisz, skąd wiemy, że reprezentujesz organizatora." className={field} />
      </label>
      {state.message && <p className="text-sm text-rose-300" role="alert">{state.message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-lg text-xs leading-5 text-muted">Zgłoszenie najpierw sprawdzimy. Dzięki temu w publicznej bazie nie pojawią się przypadkowe ani testowe wpisy.</p>
        <button type="submit" disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{pending ? "Wysyłam…" : "Wyślij do moderacji"}</button>
      </div>
    </form>
  );
}
