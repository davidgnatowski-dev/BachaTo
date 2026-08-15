"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LEVEL_BUCKET_ORDER, LEVEL_BUCKET_LABELS, type LevelBucket } from "@/lib/level";
import type { School } from "@/lib/types";

const ALL = "all";

export function QuickFilterBar({ schools }: { schools: School[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const day = searchParams.get("day") ?? "today";
  const school = searchParams.get("school") ?? ALL;
  const level = searchParams.get("level") ?? ALL;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    router.push(`/grafik?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => updateParam("day", "today")}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          day === "today" ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"
        }`}
      >
        Dzisiaj
      </button>
      <button
        type="button"
        onClick={() => updateParam("day", "weekend")}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          day === "weekend" ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"
        }`}
      >
        Weekend
      </button>

      <select
        value={level}
        onChange={(e) => updateParam("level", e.target.value)}
        className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value={ALL}>Poziom</option>
        {LEVEL_BUCKET_ORDER.map((b: LevelBucket) => (
          <option key={b} value={b}>
            {LEVEL_BUCKET_LABELS[b]}
          </option>
        ))}
      </select>

      <select
        value={school}
        onChange={(e) => updateParam("school", e.target.value)}
        className="rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value={ALL}>Szkoła</option>
        {schools.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
