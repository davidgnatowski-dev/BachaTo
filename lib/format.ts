import type { ClassFormat } from "./types";

/**
 * "YYYY-MM-DD" in the machine's local calendar day — NOT `d.toISOString().slice(0, 10)`,
 * which converts through UTC first and silently rolls back to the previous
 * day for roughly the first 1-2 hours after local midnight in timezones
 * ahead of UTC (Poland included). Use this anywhere a Date is turned into a
 * plain calendar date for comparison, filtering, or display.
 */
export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * How stale a scraped-data timestamp is — for the data-freshness banner.
 * Keeps the `Date.now()` call out of component render code.
 */
export function scrapeFreshness(iso: string, staleAfterHours = 72): { relative: string; stale: boolean } {
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  return { relative: formatRelative(iso), stale: ageHours >= staleAfterHours };
}

/** "5 min temu" / "3 godz. temu" / "2 dni temu" — used for "ostatnia aktualizacja" labels. */
export function formatRelative(iso: string | undefined): string {
  if (!iso) return "nigdy";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.round(hours / 24);
  return `${days} dni temu`;
}

export const FORMAT_LABELS: Record<ClassFormat, string> = {
  partner: "W parach",
  solo: "Solo",
  unknown: "Nieokreślony",
};

const FORMAT_STYLES: Record<ClassFormat, { bg: string; text: string; ring: string }> = {
  partner: { bg: "bg-indigo-950/30", text: "text-indigo-300/80", ring: "ring-indigo-800/30" },
  solo: { bg: "bg-fuchsia-950/30", text: "text-fuchsia-300/80", ring: "ring-fuchsia-800/30" },
  unknown: { bg: "bg-zinc-800/40", text: "text-zinc-400", ring: "ring-zinc-700/60" },
};

export function formatStyle(format: ClassFormat) {
  return FORMAT_STYLES[format];
}

/**
 * Best-effort classification from a short raw text label (a school's own
 * "typ zajęć" field, an icon caption, or — as a last resort — the class
 * title itself). Solo/ladies-only wording is explicit almost everywhere
 * these dance schools use it, so we only classify "solo" on a positive
 * match and otherwise fall back to `instructorCount` (partner-work classes
 * are always co-taught by a leading + a following instructor to demonstrate
 * both roles; solo/styling/technique classes are taught by one person —
 * confirmed against real school schedules), then the given default.
 */
export function classifyFormatFromText(
  raw: string | undefined | null,
  fallback: ClassFormat = "unknown",
  instructorCount?: number
): ClassFormat {
  if (raw) {
    const s = raw.toLowerCase();

    if (
      s.includes("solo") ||
      s.includes("ladies styling") ||
      s.includes("lady styling") ||
      s.includes("men's style") ||
      s.includes("men’s style") ||
      s.includes("men style") ||
      s.includes("men styling") ||
      s.includes("for ladies") ||
      s.includes("dla pań")
    ) {
      return "solo";
    }
    if (s.includes("w parach") || s.includes("para") || s.includes("pary") || s.includes("duo")) {
      return "partner";
    }
  }
  if (instructorCount === 1) return "solo";
  if (instructorCount != null && instructorCount >= 2) return "partner";
  return fallback;
}
