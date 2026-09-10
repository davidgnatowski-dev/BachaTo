"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setEventGoing } from "@/app/actions/events";
import { PeopleIcon } from "@/components/icons";

export function EventGoingButton({
  source,
  eventId,
  loggedIn,
  initialAttending,
  initialCount,
  publicNames,
}: {
  source: string;
  eventId: number;
  loggedIn: boolean;
  initialAttending: boolean;
  initialCount: number;
  publicNames: string[];
}) {
  const router = useRouter();
  const [attending, setAttending] = useState(initialAttending);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <div>
        <Link href="/logowanie" className="inline-flex items-center gap-2 rounded-full border border-violet/50 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet/10">
          <PeopleIcon className="h-4 w-4" /> Zaloguj się i zaznacz udział
        </Link>
        {count > 0 && <p className="mt-2 text-xs text-muted">Wybiera się {count} {count === 1 ? "osoba" : "osób"}.</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        aria-pressed={attending}
        onClick={() => {
          const next = !attending;
          setAttending(next);
          setCount((value) => Math.max(0, value + (next ? 1 : -1)));
          startTransition(async () => {
            const saved = await setEventGoing(source, eventId, next);
            if (!saved) {
              setAttending(!next);
              setCount((value) => Math.max(0, value + (next ? -1 : 1)));
            }
            router.refresh();
          });
        }}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${attending ? "border-violet/50 bg-violet/10 text-violet" : "border-line text-zinc-200 hover:border-violet/50"}`}
      >
        <PeopleIcon className="h-4 w-4" />
        {pending ? "Zapisuję…" : attending ? "Wybieram się ✓" : "Biorę udział"}
      </button>
      {count > 0 && (
        <p className="mt-2 text-xs text-muted">
          Wybiera się {count} {count === 1 ? "osoba" : "osób"}
          {publicNames.length > 0 ? ` · ${publicNames.join(", ")}` : ""}
        </p>
      )}
    </div>
  );
}
