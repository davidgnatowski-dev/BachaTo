"use client";

import { PlusIcon, CheckIcon } from "@/components/icons";

/**
 * With `label`, renders as a legible text pill ("+ Dodaj do planu") instead
 * of an icon-only circle. `tooltip`/`activeTooltip` let a caller use more
 * specific wording (e.g. "Dodaj do mojego grafiku" for classes) while every
 * other call site keeps the default "planu" wording — the `title` attribute
 * doubles as the native desktop tooltip and the accessible label.
 */
export function PlusButton({
  active,
  onToggle,
  className,
  label,
  tooltip = "Dodaj do mojego planu",
  activeTooltip = "Usuń z mojego planu",
  tone = "neutral",
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
  tooltip?: string;
  activeTooltip?: string;
  /** "accent" gives the labeled pill a solid orange primary-CTA look instead of the default neutral/violet-hover one. */
  tone?: "neutral" | "accent";
}) {
  const icon = active ? <CheckIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />;
  const text = active ? activeTooltip : tooltip;

  if (label) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={text}
        title={text}
        aria-pressed={active}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          tone === "accent"
            ? active
              ? "border-accent/60 bg-accent/15 text-accent"
              : "border-accent bg-accent text-white hover:bg-accent-dark"
            : active
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
      aria-label={text}
      title={text}
      aria-pressed={active}
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
        tone === "accent"
          ? "border-accent bg-accent text-white hover:bg-accent-dark"
          : active
            ? "border-violet/60 bg-violet/20 text-violet"
            : "border-white/20 bg-black/40 text-white/80 hover:text-white"
      } ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}
