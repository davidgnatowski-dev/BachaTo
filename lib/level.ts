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
  const normalized = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (normalized.includes("open")) return "open";
  if (/pre[\s-]*master/.test(normalized)) return "advanced";
  if (normalized.includes("master")) return "master";
  if (normalized.includes("poczatkujacy") || normalized.includes("od zera") || normalized.includes("starter") || normalized.includes("beginner")) return "starter";
  if (/srednio[\s-]*zaawansowan/.test(normalized) || normalized.includes("intermediate")) return "intermediate";
  if (normalized.includes("zaawansowan") || normalized.includes("advanced")) return "advanced";
  if (normalized.includes("podstawowy") || normalized.includes("improver")) return "elementary";

  const pMatch = s.match(/\bp-?(\d)\b/);
  if (pMatch) {
    const n = Number(pMatch[1]);
    if (n <= 1) return "starter";
    // P is the podstawowy track. A higher P number does not turn it into
    // the separate S (średniozaawansowany) track.
    return "elementary";
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

/**
 * Solid fill colour per tier — for the small level dot shown next to a class
 * time/name. Brighter and more saturated than LEVEL_STYLES (which are muted
 * tints for pill backgrounds).
 */
// Vivid -400 shade of the same hue family used by LEVEL_STYLES pills, so the
// dot and the written level tag always read as the same colour.
const LEVEL_DOT_CLASS: Record<LevelBucket, string> = {
  starter: "bg-green-400",
  elementary: "bg-blue-400",
  intermediate: "bg-amber-400",
  advanced: "bg-red-400",
  master: "bg-violet-400",
  open: "bg-indigo-400",
  unknown: "bg-zinc-500",
};

export function levelDotClass(bucket: LevelBucket) {
  return LEVEL_DOT_CLASS[bucket];
}

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

/** Short letter tier code for compact UI (mobile list, timeline axis). Both P-track buckets read as "P" — the digit from levelShortCode (P1 vs P2) is what actually tells them apart in practice. */
export const LEVEL_BUCKET_LETTERS: Record<LevelBucket, string> = {
  starter: "P",
  elementary: "P",
  intermediate: "S",
  advanced: "Z",
  master: "M",
  open: "O",
  unknown: "?",
};

/**
 * Compact level code for tight UI: the school's own P#/S# digit when the raw
 * level string has one (e.g. "Podstawowy Plus (P2)" -> "P2"), so classes on
 * the same P/S track stay distinguishable; otherwise the plain bucket letter.
 */
export function levelShortCode(raw: string | undefined | null, bucket: LevelBucket): string {
  if (bucket === "open") return "Open";
  if (raw) {
    const s = raw.toLowerCase();
    const pMatch = s.match(/\bp-?(\d)\b/);
    if (pMatch) return `P${pMatch[1]}`;
    const sMatch = s.match(/\bs-?(\d)\b/);
    if (sMatch) return `S${sMatch[1]}`;
  }
  return LEVEL_BUCKET_LETTERS[bucket];
}
