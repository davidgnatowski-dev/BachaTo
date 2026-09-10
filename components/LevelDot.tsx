import { classifyLevel, levelDotClass, levelStyle, LEVEL_BUCKET_LABELS } from "@/lib/level";

/**
 * A small colour-coded dot for a class level — meant to sit right after the
 * time and before the class name. Hover/long-press shows the tier name.
 * Renders nothing when the class has no level at all.
 */
export function LevelDot({ level, className = "" }: { level: string | null | undefined; className?: string }) {
  if (!level) return null;
  const bucket = classifyLevel(level);
  const label = bucket === "unknown" ? level : LEVEL_BUCKET_LABELS[bucket];
  return (
    <span
      title={`Poziom: ${label}`}
      aria-label={`Poziom: ${label}`}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${levelDotClass(bucket)} ${className}`}
    />
  );
}

/**
 * The level shown as a text pill, tinted with that level's own colour — the
 * single definition of the level tag used across schedule rows, plan rows,
 * recommendations, previews. Renders nothing when there is no level.
 */
export function LevelBadge({ level, className = "" }: { level: string | null | undefined; className?: string }) {
  if (!level) return null;
  const colors = levelStyle(classifyLevel(level));
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring} ${className}`}
    >
      {level}
    </span>
  );
}
