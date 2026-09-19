"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { pluralizeClasses } from "@/lib/schedule";

export function UnifiedClassDayGroup({ date, count, hours, defaultOpen = false, children }: { date: Date; count: number; hours?: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-zinc-950/30">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="grid w-full grid-cols-[3rem_minmax(0,1fr)_2rem] items-center gap-3 p-3 text-left">
        <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-zinc-800 text-accent"><b className="font-heading text-base font-semibold leading-none">{date.getDate()}</b><span className="mt-1 text-[9px] font-semibold uppercase">{date.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "")}</span></span>
        <span className="min-w-0"><strong className="block truncate text-sm font-semibold capitalize text-zinc-100">{date.toLocaleDateString("pl-PL", { weekday: "long" })}</strong><span className="mt-1 block text-[11px] text-muted">{count} {pluralizeClasses(count)}{hours ? ` · ${hours.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} h` : ""}</span></span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-zinc-400"><ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></span>
      </button>
      {open && <div className="divide-y divide-line border-t border-line px-3">{children}</div>}
    </article>
  );
}
