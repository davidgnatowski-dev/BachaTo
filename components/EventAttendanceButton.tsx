"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setEventAttendance } from "@/app/actions/events";
import { CheckIcon } from "@/components/icons";

export function EventAttendanceButton({
  source,
  eventId,
  attended,
  canConfirm,
  loggedIn,
}: {
  source: string;
  eventId: number;
  attended: boolean;
  canConfirm: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(attended);
  const [pending, startTransition] = useTransition();

  if (!canConfirm) {
    return <p className="text-sm text-muted">Udział będzie można potwierdzić od dnia rozpoczęcia wydarzenia.</p>;
  }

  if (!loggedIn) {
    return (
      <Link href="/logowanie" className="inline-flex rounded-full border border-violet/50 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet/10">
        Zaloguj się, aby potwierdzić udział
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={active}
      onClick={() => {
        const next = !active;
        setActive(next);
        startTransition(async () => {
          const saved = await setEventAttendance(source, eventId, next);
          if (!saved) setActive(!next);
          router.refresh();
        });
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${active ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-accent bg-accent text-white hover:bg-accent-dark"}`}
    >
      <CheckIcon className="h-4 w-4" />
      {pending ? "Zapisuję…" : active ? "Udział potwierdzony" : "Byłem/am na tym wydarzeniu"}
    </button>
  );
}
