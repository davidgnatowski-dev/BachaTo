import type { Badge } from "@/lib/badges";

export function BadgesGrid({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);
  const ordered = [...earned, ...locked];
  const shown = compact ? ordered.slice(0, 6) : ordered;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Odznaki</p>
        <p className="text-xs text-muted">{earned.length} / {badges.length}</p>
      </div>
      <div className={`mt-3 grid ${compact ? "grid-cols-2 gap-2" : "grid-cols-2 gap-2.5 sm:grid-cols-3"}`}>
        {shown.map((badge) => (
          <div
            key={badge.id}
            title={`${badge.label} — ${badge.description}`}
            className={`min-w-0 rounded-xl border ${compact ? "flex items-center gap-2 p-2.5 text-left" : "flex flex-col items-center gap-1 p-3 text-center"} ${
              badge.earned
                ? "border-violet/50 bg-gradient-to-br from-violet/15 to-violet/5"
                : "border-line bg-zinc-950/40 opacity-60"
            }`}
          >
            <span className={`shrink-0 leading-none ${compact ? "text-xl" : "text-2xl"} ${badge.earned ? "" : "grayscale"}`} aria-hidden="true">
              {badge.icon}
            </span>
            <span className={compact ? "min-w-0 flex-1" : ""}>
              <span className="block break-words text-[11px] font-semibold leading-tight text-zinc-200">{badge.label}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-muted">
                {badge.earned ? "Zdobyta" : `${Math.round(badge.progress * 100)}%`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
