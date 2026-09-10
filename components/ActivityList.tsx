"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActivity, type ActivityEntry } from "@/lib/activity";
import { formatDatePl, pluralizeClasses } from "@/lib/schedule";
import { TrashIcon } from "@/components/icons";

const TYPE_BADGES: Record<string, string> = {
  practice: "Praktyka",
  party: "Impreza",
  workshop: "Warsztat",
};

export function ActivityList({ initialEntries }: { initialEntries?: ActivityEntry[] }) {
  const router = useRouter();
  const { entries, confirmEntry, markEntrySkipped, removeEntry, updateReflection } = useActivity(initialEntries);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sortedEntries = [...entries].sort((a, b) => b.dateIso.localeCompare(a.dateIso));

  async function handleRemove(key: string) {
    setRemovingKey(key);
    setError(null);
    try {
      await removeEntry(key);
      setConfirmKey(null);
      router.refresh();
    } catch {
      setError("Nie udało się usunąć aktywności. Spróbuj ponownie.");
    } finally {
      setRemovingKey(null);
    }
  }

  if (sortedEntries.length === 0) {
    return (
      <p className="text-sm text-muted">
        Brak jeszcze odbytych zajęć. Zaznacz &quot;Byłem/am na tych zajęciach&quot; w szczegółach zajęć, żeby zaczęły
        się tu pojawiać.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-line">
        {sortedEntries.slice(0, 10).map((entry) => {
          const isConfirming = confirmKey === entry.key;
          const isRemoving = removingKey === entry.key;

          return (
            <div key={entry.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-100">
                  {entry.activityType && TYPE_BADGES[entry.activityType] && (
                    <span className="shrink-0 rounded-full border border-violet/40 bg-violet/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet">
                      {TYPE_BADGES[entry.activityType]}
                    </span>
                  )}
                  <span className="truncate">{entry.title}</span>
                </p>
                <p className="truncate text-xs text-muted">
                  {[entry.school, entry.instructor].filter(Boolean).join(" · ") || "wpis ręczny"}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <p className="text-xs text-muted">{formatDatePl(entry.dateIso)}</p>
                {entry.autoMarked && (
                  <>
                    <button type="button" onClick={() => confirmEntry(entry.key)} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-dark">Potwierdź: byłem</button>
                    <button type="button" onClick={() => markEntrySkipped(entry.key)} className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-500">Nie byłem</button>
                  </>
                )}
                {!entry.autoMarked && (isConfirming ? (
                  <div className="flex items-center gap-1.5" aria-label={`Potwierdź usunięcie ${entry.title}`}>
                    <button
                      type="button"
                      onClick={() => setConfirmKey(null)}
                      disabled={isRemoving}
                      className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.key)}
                      disabled={isRemoving}
                      className="rounded-full border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {isRemoving ? "Usuwam…" : "Usuń"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmKey(entry.key)}
                    className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-xs font-medium text-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                    title="Usuń tę aktywność"
                    aria-label={`Usuń aktywność ${entry.title}`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Usuń
                  </button>
                ))}
              </div>
              </div>
              {entry.autoMarked && <p className="text-xs text-accent">Dodane automatycznie z Twojego planu — czeka na potwierdzenie.</p>}
              <ReflectionEditor entry={entry} onSave={updateReflection} />
            </div>
          );
        })}
        {sortedEntries.length > 10 && (
          <p className="pt-2.5 text-xs text-muted">
            +{sortedEntries.length - 10} więcej {pluralizeClasses(sortedEntries.length - 10)}
          </p>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </>
  );
}

function ReflectionEditor({ entry, onSave }: { entry: ActivityEntry; onSave: (key: string, rating: number | null, note: string) => Promise<void> }) {
  const [rating, setRating] = useState<number | null>(entry.rating ?? null);
  const [note, setNote] = useState(entry.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  return <details className="group rounded-lg bg-zinc-950/35 px-3 py-2">
    <summary className="cursor-pointer list-none text-xs font-medium text-zinc-400 hover:text-violet [&::-webkit-details-marker]:hidden">{entry.rating || entry.note ? `Twoja opinia${entry.rating ? ` · ${entry.rating}/5` : ""}` : "+ Dodaj ocenę lub notatkę"}</summary>
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-1" aria-label="Ocena zajęć">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`text-lg ${rating && value <= rating ? "text-accent" : "text-zinc-700"}`} aria-label={`${value} z 5`}>★</button>)}</div>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="Co było dobre? Co warto zapamiętać?" className="resize-y rounded-lg border border-line bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-violet focus:outline-none" />
      <div className="flex items-center gap-2"><button type="button" disabled={saving} onClick={async () => { setSaving(true); setSaved(false); try { await onSave(entry.key, rating, note); setSaved(true); } finally { setSaving(false); } }} className="rounded-full bg-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Zapisuję…" : "Zapisz opinię"}</button>{saved && <span className="text-xs text-emerald-400">Zapisano ✓</span>}</div>
    </div>
  </details>;
}
