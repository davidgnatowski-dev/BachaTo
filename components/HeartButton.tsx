"use client";

import { HeartIcon } from "@/components/icons";

/** With `label`, renders as a legible text pill ("♡ Dodaj do ulubionych") instead of an icon-only circle. */
export function HeartButton({
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
  const icon = <HeartIcon className="h-3.5 w-3.5" filled={active} />;

  if (label) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={active ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        aria-pressed={active}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          active
            ? "border-accent/60 bg-accent/20 text-accent"
            : "border-line bg-black/40 text-zinc-200 hover:border-accent/50 hover:text-accent"
        } ${className ?? ""}`}
      >
        {icon}
        {active ? "W ulubionych" : label}
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
      aria-label={active ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-pressed={active}
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
        active
          ? "border-accent/60 bg-accent/20 text-accent"
          : "border-white/20 bg-black/40 text-white/80 hover:text-white"
      } ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}
