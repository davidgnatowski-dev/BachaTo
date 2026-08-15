export type LevelBucket = "starter" | "elementary" | "intermediate" | "advanced" | "master" | "open" | "unknown";

export const LEVEL_BUCKET_ORDER: LevelBucket[] = [
  "starter",
  "elementary",
  "intermediate",
  "advanced",
  "master",
  "open",
  "unknown",
];

export const LEVEL_BUCKET_LABELS: Record<LevelBucket, string> = {
  starter: "Początkujący",
  elementary: "Podstawowy",
  intermediate: "Średniozaawansowany",
  advanced: "Zaawansowany",
  master: "Master",
  open: "Open / wszystkie poziomy",
  unknown: "Nieokreślony",
};

/**
 * Every school labels levels differently ("P1", "Początkujący (P1)", "p1 (od
 * zera)", "Starter"...). We normalize into a small set of buckets so levels
 * can be color-coded and filtered consistently across schools.
 *
 * Polish keywords take priority when present (they're the school's own
 * explicit statement of tier); the P#/S# code is a fallback for schools that
 * only publish codes. S-track (Sensual) starts at an intermediate tier in
 * practice, so "S1" maps to intermediate rather than starter.
 */
export function classifyLevel(raw: string | undefined | null): LevelBucket {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();

  if (s.includes("master")) return "master";
  if (s.includes("open")) return "open";
  if (s.includes("początkujący") || s.includes("od zera") || s.includes("starter")) return "starter";
  if (s.includes("średniozaawansowany")) return "intermediate";
  if (s.includes("zaawansowany")) return "advanced";
  if (s.includes("podstawowy")) return "elementary";

  const pMatch = s.match(/\bp-?(\d)\b/);
  if (pMatch) {
    const n = Number(pMatch[1]);
    if (n <= 1) return "starter";
    if (n === 2) return "elementary";
    if (n === 3) return "intermediate";
    return "advanced";
  }

  const sMatch = s.match(/\bs-?(\d)\b/);
  if (sMatch) {
    return Number(sMatch[1]) <= 1 ? "intermediate" : "advanced";
  }

  return "unknown";
}

const LEVEL_STYLES: Record<LevelBucket, { bg: string; text: string; ring: string }> = {
  starter: { bg: "bg-green-950/30", text: "text-green-300/90", ring: "ring-green-800/30" },
  elementary: { bg: "bg-blue-950/30", text: "text-blue-300/90", ring: "ring-blue-800/30" },
  intermediate: { bg: "bg-amber-950/30", text: "text-amber-300/90", ring: "ring-amber-800/30" },
  advanced: { bg: "bg-red-950/30", text: "text-red-300/90", ring: "ring-red-800/30" },
  master: { bg: "bg-violet/10", text: "text-violet/80", ring: "ring-violet/25" },
  open: { bg: "bg-indigo-950/30", text: "text-indigo-300/80", ring: "ring-indigo-800/30" },
  unknown: { bg: "bg-zinc-800/40", text: "text-zinc-400", ring: "ring-zinc-700/60" },
};

/** Small icon per level tier, matching the design system's "Tagi poziomów". */
export const LEVEL_BUCKET_ICONS: Record<LevelBucket, string> = {
  starter: "🌱",
  elementary: "⭐",
  intermediate: "📊",
  advanced: "🔥",
  master: "👑",
  open: "♾️",
  unknown: "",
};

export function levelStyle(bucket: LevelBucket) {
  return LEVEL_STYLES[bucket];
}
