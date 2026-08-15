"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      const newTotal = (data.results ?? []).reduce((sum: number, r: { newCount: number }) => sum + (r.newCount ?? 0), 0);
      const failed = (data.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      setMessage(
        failed.length > 0
          ? `Gotowe, ale ${failed.length} szkoła/y zwróciły błąd — sprawdź konsolę serwera.`
          : `Gotowe — znaleziono ${newTotal} nowych zajęć.`
      );
      router.refresh();
    } catch {
      setMessage("Nie udało się odświeżyć — sprawdź połączenie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? "Odświeżanie..." : "Odśwież teraz"}
      </button>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
