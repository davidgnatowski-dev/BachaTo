"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
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
    <html lang="pl">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center font-sans text-foreground">
        <p className="text-4xl">😵</p>
        <h1 className="text-xl font-semibold text-zinc-50">BachaTo napotkało błąd</h1>
        <p className="max-w-sm text-sm text-muted">
          Coś poszło nie tak przy ładowaniu aplikacji. Spróbuj ponownie za chwilę.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Spróbuj ponownie
        </button>
      </body>
    </html>
  );
}
