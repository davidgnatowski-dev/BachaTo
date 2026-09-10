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
      <div className={`mt-3 grid gap-2.5 ${compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"}`}>
        {shown.map((badge) => (
          <div
            key={badge.id}
            title={`${badge.label} — ${badge.description}`}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
              badge.earned
                ? "border-violet/40 bg-violet/10"
                : "border-line bg-zinc-950/40 opacity-60"
            }`}
          >
            <span className={`text-2xl leading-none ${badge.earned ? "" : "grayscale"}`} aria-hidden="true">
              {badge.icon}
            </span>
            <span className="text-[11px] font-semibold leading-tight text-zinc-200">{badge.label}</span>
            {!compact && (
              <span className="text-[10px] leading-tight text-muted">
                {badge.earned ? "Zdobyta" : `${Math.round(badge.progress * 100)}%`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
