"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Shown when an anonymous visitor tries to add a class/event to their plan.
 * Browsing (classes, schools, instructors, events) never requires an
 * account — only this one action does, and only here do we explain why.
 */
export function AddToPlanModal({ onClose }: { onClose: () => void }) {
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
      aria-labelledby="add-to-plan-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-line bg-zinc-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="add-to-plan-modal-title" className="font-heading text-lg font-semibold text-foreground">
            Dodaj zajęcia do swojego planu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="shrink-0 rounded-full border border-line px-2.5 py-1 text-sm text-muted hover:text-zinc-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Załóż konto lub zaloguj się, aby zapisywać zajęcia z różnych szkół w jednym miejscu.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/rejestracja"
            className="rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Załóż darmowe konto
          </Link>
          <Link
            href="/logowanie"
            className="rounded-full border border-line px-4 py-2.5 text-center text-sm font-semibold text-foreground/80 hover:border-zinc-500"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    </div>
  );
}
