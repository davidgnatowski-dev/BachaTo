"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LEVEL_BUCKET_ORDER, LEVEL_BUCKET_LABELS, type LevelBucket } from "@/lib/level";
import type { School } from "@/lib/types";
import { schoolTextClass } from "@/lib/schedule";

const ALL = "all";

const DAY_BUTTON_CLASS =
  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors";
const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function QuickFilterBar({ schools, styles }: { schools: School[]; styles: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = useState(false);

  const day = searchParams.get("day") ?? "today";
  const school = searchParams.get("school") ?? ALL;
  const level = searchParams.get("level") ?? ALL;
  const style = searchParams.get("style") ?? ALL;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    router.push(`/grafik?${params.toString()}`);
  }

  function dayButton(key: string, label: string) {
    const active = day === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => updateParam("day", key)}
        className={`${DAY_BUTTON_CLASS} ${active ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {dayButton("today", "Dzisiaj")}
        {dayButton("weekend", "Weekend")}

        <select
          value={level}
          onChange={(e) => updateParam("level", e.target.value)}
          className={SELECT_CLASS}
        >
          <option value={ALL}>Poziom</option>
          {LEVEL_BUCKET_ORDER.map((b: LevelBucket) => (
            <option key={b} value={b}>
              {LEVEL_BUCKET_LABELS[b]}
            </option>
          ))}
        </select>

        <select value={school} onChange={(e) => updateParam("school", e.target.value)} className={`${SELECT_CLASS} ${school === ALL ? "" : schoolTextClass(school)}`}>
          <option value={ALL}>Szkoła</option>
          {schools.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500"
        >
          {showMore ? "Mniej filtrów" : "Więcej filtrów"}
        </button>
      </div>

      {showMore && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          {dayButton("tomorrow", "Jutro")}
          {dayButton("week", "Ten tydzień")}

          <select value={style} onChange={(e) => updateParam("style", e.target.value)} className={SELECT_CLASS}>
            <option value={ALL}>Styl</option>
            {styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
