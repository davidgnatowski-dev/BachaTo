"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-4xl">😵</p>
      <h1 className="font-heading text-xl font-semibold text-zinc-50">Coś poszło nie tak</h1>
      <p className="text-sm text-muted">
        Nie udało się załadować tej strony. Spróbuj ponownie, a jeśli problem się powtarza, wróć na stronę główną.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Spróbuj ponownie
        </button>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-accent hover:text-accent">
          Strona główna
        </Link>
      </div>
    </div>
  );
}
