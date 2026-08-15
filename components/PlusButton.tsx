"use client";

import { PlusIcon, CheckIcon } from "@/components/icons";

/** With `label`, renders as a legible text pill ("+ Dodaj do planu") instead of an icon-only circle. */
export function PlusButton({
  active,
  onToggle,
  className,
  label,
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
}) {
  const icon = active ? <CheckIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />;

  if (label) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={active ? "Usuń z mojego planu" : "Dodaj do mojego planu"}
        aria-pressed={active}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          active
            ? "border-violet/60 bg-violet/20 text-violet"
            : "border-line bg-black/40 text-zinc-200 hover:border-violet/50 hover:text-violet"
        } ${className ?? ""}`}
      >
        {icon}
        {active ? "W planie" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? "Usuń z mojego planu" : "Dodaj do mojego planu"}
      aria-pressed={active}
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
        active
          ? "border-violet/60 bg-violet/20 text-violet"
          : "border-white/20 bg-black/40 text-white/80 hover:text-white"
      } ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}
